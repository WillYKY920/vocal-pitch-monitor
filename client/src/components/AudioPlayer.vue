<template>
  <div class="player-area">
    <div class="progress-row">
      <span class="time-current">{{ currentTimeDisplay }}</span>
      <div class="progress-bar-container" @mousedown="seek">
        <div class="progress-fill" :style="{ width: progress + '%' }">
          <div class="progress-thumb"></div>
        </div>
      </div>
      <span class="time-duration">{{ durationDisplay }}</span>
    </div>

    <div class="controls-row">
      <!-- Left -->
      <div class="track-info">
        <h4>{{ trackTitle }}</h4>
        <span>{{ trackArtist }}</span>
      </div>

      <!-- True centre (absolutely positioned, not in flex flow) -->
      <div class="controls">
        <button class="play-btn" @click="togglePlay">
          <svg v-if="!isPlaying" width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
          </svg>
        </button>
      </div>

      <!-- Right group -->
      <div class="right-group">
        <div class="mic-select-wrapper">
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#A9A9A9FF" stroke-width="2">
            <rect x="9" y="2" width="6" height="12" rx="3"></rect>
            <path d="M5 10a7 7 0 0 0 14 0"></path>
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <line x1="8" y1="22" x2="16" y2="22"></line>
          </svg>
          <select class="mic-select" v-model="selectedDeviceId" @change="onMicDeviceChange"
                  :disabled="audioInputDevices.length === 0" title="Select microphone input">
            <option v-for="device in audioInputDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || `Microphone ${device.deviceId.slice(0, 6)}` }}
            </option>
            <option v-if="audioInputDevices.length === 0" value="">No devices found</option>
          </select>
        </div>
        <div class="volume-control">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A9A9A9FF" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
          <div class="volume-bar" @click="adjustVolume">
            <div class="volume-fill" :style="{ width: volume * 100 + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { API } from '../services/api.js'
import { formatTime } from '../services/utils.js'

const emit = defineEmits([
  'audio-element-ready', 'vocal-data-loaded', 'time-update',
  'audio-context-ready', 'playback-stopped', 'song-loading'
])

const audio = ref(new Audio())
const audioContext = ref(null)
const micStreamNode = ref(null)
const micMediaStream = ref(null)
const isPlaying = ref(false)
const progress = ref(0)
const volume = ref(0.5)
const trackTitle = ref('--')
const trackArtist = ref('--')
const currentTime = ref(0)
const duration = ref(0)

// [NEW] Mic device state
const audioInputDevices = ref([])
const selectedDeviceId = ref('')

const currentTimeDisplay = computed(() => formatTime(currentTime.value))
const durationDisplay = computed(() => formatTime(duration.value))

// [NEW] Enumerate available audio input devices
const loadAudioDevices = async () => {
  try {
    // A brief getUserMedia call is required on first load so that
    // device labels are populated (browser security requirement).
    const devices = await navigator.mediaDevices.enumerateDevices()
    audioInputDevices.value = devices.filter(d => d.kind === 'audioinput')

    // If labels are blank (permission not yet granted), request it once
    if (audioInputDevices.value.some(d => !d.label)) {
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      tempStream.getTracks().forEach(t => t.stop())
      const updated = await navigator.mediaDevices.enumerateDevices()
      audioInputDevices.value = updated.filter(d => d.kind === 'audioinput')
    }

    // Pre-select the first device or keep current selection if still present
    if (
        !selectedDeviceId.value ||
        !audioInputDevices.value.find(d => d.deviceId === selectedDeviceId.value)
    ) {
      selectedDeviceId.value = audioInputDevices.value[0]?.deviceId ?? ''
    }
  } catch (err) {
    console.warn('Could not enumerate audio devices:', err)
  }
}

// [NEW] Called when the user picks a different mic
const onMicDeviceChange = () => {
  // If the mic is actively streaming, restart it with the new device
  if (micMediaStream.value) {
    stopMicrophone()
    initAudioContext()
  }
}

const initAudioContext = async () => {
  if (!audioContext.value) {
    audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioContext.value.state === 'suspended') {
    await audioContext.value.resume()
  }

  if (!micStreamNode.value) {
    try {
      // [CHANGED] Use the selected deviceId constraint
      const constraints = {
        audio: selectedDeviceId.value
            ? { deviceId: { exact: selectedDeviceId.value } }
            : true
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      micMediaStream.value = stream
      micStreamNode.value = audioContext.value.createMediaStreamSource(stream)
    } catch (err) {
      console.error('Microphone access failed:', err)
      alert('Please enable microphone access for visualizers.')
      return null
    }
  }
  return { context: audioContext.value, source: micStreamNode.value }
}

const stopMicrophone = () => {
  if (micMediaStream.value) {
    micMediaStream.value.getTracks().forEach(track => track.stop())
    micMediaStream.value = null
  }
  if (micStreamNode.value) {
    micStreamNode.value.disconnect()
    micStreamNode.value = null
  }
}

const loadSong = async (song, artistName) => {
  if (!song || !song.id) {
    console.error('Invalid song object:', song)
    return
  }
  emit('song-loading')
  if (isPlaying.value) pause()
  progress.value = 0
  currentTime.value = 0
  duration.value = 0
  trackTitle.value = song.title || 'Unknown Title'
  trackArtist.value = artistName || 'Unknown Artist'
  audio.value.src = API.getAudioStreamUrl(song.id)
  audio.value.load()
  try {
    const [lyricsResponse, vocalData] = await Promise.all([
      API.getLyrics(song.id),
      API.getVocalData(song.id)
    ])
    emit('vocal-data-loaded', {
      vocalData: vocalData,
      lyricsData: lyricsResponse?.lyrics || []
    })
    await play()
  } catch (err) {
    console.error('Error loading song data:', err)
  }
}

const play = async () => {
  try {
    await audio.value.play()
    isPlaying.value = true
    const audioSetup = await initAudioContext()
    if (audioSetup) emit('audio-context-ready', audioSetup)
  } catch (err) {
    console.warn('Play blocked or failed:', err)
  }
}

const pause = () => {
  audio.value.pause()
  isPlaying.value = false
  stopMicrophone()
  emit('playback-stopped')
}

const togglePlay = () => {
  if (!audio.value.src) return
  if (isPlaying.value) pause()
  else play()
}

const handleTimeUpdate = () => {
  currentTime.value = audio.value.currentTime
  duration.value = audio.value.duration
  if (isFinite(duration.value) && duration.value > 0) {
    progress.value = (currentTime.value / duration.value) * 100
  }
  emit('time-update', currentTime.value)
}

const handleLoadedMetadata = () => {
  duration.value = audio.value.duration
}

const handleEnded = () => {
  isPlaying.value = false
  progress.value = 0
  stopMicrophone()
  emit('playback-stopped')
}

const seek = (e) => {
  e.preventDefault()
  if (!audio.value.src || !isFinite(audio.value.duration)) return
  const rect = e.currentTarget.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const percentage = Math.max(0, Math.min(1, clickX / rect.width))
  audio.value.currentTime = percentage * audio.value.duration
}

const adjustVolume = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  let percentage = Math.max(0, Math.min(1, clickX / rect.width))
  audio.value.volume = percentage
  volume.value = percentage
}

const handleKeydown = (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  switch (e.code) {
    case 'Space':
      e.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft':
      audio.value.currentTime = Math.max(0, audio.value.currentTime - 5)
      break
    case 'ArrowRight':
      if (isFinite(audio.value.duration)) {
        audio.value.currentTime = Math.min(audio.value.duration, audio.value.currentTime + 5)
      }
      break
  }
}

onMounted(() => {
  audio.value.volume = volume.value
  audio.value.addEventListener('timeupdate', handleTimeUpdate)
  audio.value.addEventListener('loadedmetadata', handleLoadedMetadata)
  audio.value.addEventListener('ended', handleEnded)
  document.addEventListener('keydown', handleKeydown)
  emit('audio-element-ready', audio.value)

  // [NEW] Load devices and watch for hardware changes
  loadAudioDevices()
  navigator.mediaDevices.addEventListener('devicechange', loadAudioDevices)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  audio.value.removeEventListener('timeupdate', handleTimeUpdate)
  audio.value.removeEventListener('loadedmetadata', handleLoadedMetadata)
  audio.value.removeEventListener('ended', handleEnded)
  stopMicrophone()
  if (audioContext.value) audioContext.value.close()

  // [NEW] Remove device change listener
  navigator.mediaDevices.removeEventListener('devicechange', loadAudioDevices)
})

defineExpose({ loadSong })
</script>
