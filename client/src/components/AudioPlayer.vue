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
      <div class="track-info">
        <h4>{{ trackTitle }}</h4>
        <span>{{ trackArtist }}</span>
      </div>
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
      <div class="volume-control">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        <div class="volume-bar" @click="adjustVolume">
          <div class="volume-fill" :style="{ width: volume * 100 + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { API } from '../services/api.js'
  import { formatTime } from '../services/utils.js'

  const emit = defineEmits(['audio-element-ready', 'vocal-data-loaded', 'time-update', 'audio-context-ready', 'playback-stopped', 'song-loading'])

  const audio = ref(new Audio())
  const audioContext = ref(null)
  const micStreamNode = ref(null)
  const micMediaStream = ref(null) // [NEW] Store reference to the raw stream
  const isPlaying = ref(false)
  const progress = ref(0)
  const volume = ref(0.5)
  const trackTitle = ref('--')
  const trackArtist = ref('--')
  const currentTime = ref(0)
  const duration = ref(0)

  const currentTimeDisplay = computed(() => formatTime(currentTime.value))
  const durationDisplay = computed(() => formatTime(duration.value))

  const initAudioContext = async () => {
  if (!audioContext.value) {
  audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
}
  if (audioContext.value.state === 'suspended') {
  await audioContext.value.resume()
}

  if (!micStreamNode.value) {
  try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  micMediaStream.value = stream // [NEW] Save the stream
  micStreamNode.value = audioContext.value.createMediaStreamSource(stream)
} catch (err) {
  console.error("Microphone access failed:", err)
  alert("Please enable microphone access for visualizers.")
  return null
}
}
  return { context: audioContext.value, source: micStreamNode.value }
}

  // [NEW] Helper to stop microphone tracks and clear the red dot
  const stopMicrophone = () => {
  if (micMediaStream.value) {
  micMediaStream.value.getTracks().forEach(track => track.stop())
  micMediaStream.value = null
}
  // Clear the node so initAudioContext() creates a new one next time
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

  if (isPlaying.value) {
  pause() // [CHANGED] Use pause() to ensure cleanup runs
}

  progress.value = 0
  currentTime.value = 0
  duration.value = 0

  trackTitle.value = song.title || "Unknown Title"
  trackArtist.value = artistName || "Unknown Artist"

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

  // Re-initialize mic (getUserMeda) since we stopped it on pause
  const audioSetup = await initAudioContext()
  if (audioSetup) {
  emit('audio-context-ready', audioSetup)
}
} catch (err) {
  console.warn('Play blocked or failed:', err)
}
}

  const pause = () => {
  audio.value.pause()
  isPlaying.value = false
  stopMicrophone() // [NEW] Stop the mic when pausing
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
  stopMicrophone() // [NEW] Ensure mic stops when song ends
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
  switch(e.code) {
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
})

  onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  audio.value.removeEventListener('timeupdate', handleTimeUpdate)
  audio.value.removeEventListener('loadedmetadata', handleLoadedMetadata)
  audio.value.removeEventListener('ended', handleEnded)
  stopMicrophone() // [NEW] Cleanup on unmount
  if (audioContext.value) {
  audioContext.value.close()
}
})

  defineExpose({
  loadSong
})
</script>
