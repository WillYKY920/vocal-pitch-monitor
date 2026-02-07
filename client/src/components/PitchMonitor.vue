<template>
  <div id="monitor-container">
    <div id="note-display">{{ currentNote }}</div>
    <div id="playhead-line" :class="{ recording: isRunning }"></div>
    <canvas ref="canvasRef" id="pitchCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, watch } from 'vue'
import { YinF0Detector } from '../algorithms/pitchDetector.js'
import { AudioFilter } from '../algorithms/audioFilter.js'
import { ErrorDetector } from '../algorithms/errorDetector.js'
import { useAudioRecorder } from '../composables/useAudioRecorder.js'
import { mapPitchesToNotes } from '../services/utils.js'

const props = defineProps({
  audioElement: Object,
  vocalData: Object
})

const canvasRef = ref(null)
const currentNote = ref('')
// Use shallowRef for objects/arrays to avoid deep reactivity overhead (performance fix)
const ctx = shallowRef(null)
const audioFilter = shallowRef(new AudioFilter(5, 24))
const errorDetector = shallowRef(new ErrorDetector())
const errorMarkers = shallowRef([])

const MIN_FREQ = 80
const MAX_FREQ = 1000
const GRAPH_SPEED = 4
const VISIBLE_RANGE_SEMITONES = 32
const MAX_HISTORY = 1000
const MAX_ERROR_MARKERS = 50

const audioRecorder = useAudioRecorder()
const listenerHandle = shallowRef(null)
const isRunning = ref(false)
const yinDetector = shallowRef(null)
const historyData = shallowRef([]) // Optimization: shallowRef prevents Proxy wrapping on push
const maxHistoryLen = ref(0)
const currentCenterPitch = ref(60)
const targetCenterPitch = ref(60)
const referencePitchData = shallowRef(null)
const sampleRate = ref(44100)
const hopSize = ref(512)
const animationFrameId = ref(null)
const lastDrawTime = ref(0)
const DRAW_INTERVAL = 16

// Temp variable to decouple audio processing from DOM updates
let latestDetectedNote = ''

const resizeCanvas = () => {
  if (!canvasRef.value) return
  const parent = canvasRef.value.parentElement
  if (parent) {
    canvasRef.value.width = parent.clientWidth
    canvasRef.value.height = parent.clientHeight
  }
  maxHistoryLen.value = MAX_HISTORY
  if (!isRunning.value) draw()
}

const processAudio = (inputData) => {
  if (!isRunning.value) return

  const currentTime = props.audioElement ? props.audioElement.currentTime : (Date.now() / 1000)

  let frequency = 0
  if (yinDetector.value) {
    frequency = yinDetector.value.estimateF0(inputData)
  }

  let smoothedPitch = null
  if (frequency > 0 && frequency > MIN_FREQ && frequency < MAX_FREQ) {
    const rawMidi = 69 + 12 * Math.log2(frequency / 440)
    smoothedPitch = audioFilter.value.process(rawMidi)
  }

  if (smoothedPitch !== null) {
    const smoothedFreq = 440 * Math.pow(2, (smoothedPitch - 69) / 12)
    // Optimization: Store note in var, update ref in animation loop
    latestDetectedNote = YinF0Detector.frequencyToNote(smoothedFreq)

    targetCenterPitch.value = smoothedPitch
    historyData.value.push({ val: smoothedPitch, time: currentTime, active: true })

    const error = errorDetector.value.processUserPitch(smoothedPitch, currentTime)
    if (error) {
      errorMarkers.value.push({
        time: currentTime,
        errorInfo: error
      })
      if (errorMarkers.value.length > MAX_ERROR_MARKERS) {
        errorMarkers.value.shift()
      }
    }
  } else {
    // Reset note if silence
    if (historyData.value.length > 0 && historyData.value[historyData.value.length - 1].active) {
      latestDetectedNote = ''
    }
    historyData.value.push({ val: null, time: currentTime, active: false })
  }

  if (historyData.value.length > maxHistoryLen.value) {
    historyData.value.shift()
  }

  const retentionTime = 10
  if (historyData.value.length > 0 && (currentTime - historyData.value[0].time > retentionTime)) {
    historyData.value.shift()
  }

  errorDetector.value.clearOldErrors(10000)
}

const start = async (audioCtx, source) => {
  if (isRunning.value) return
  try {
    yinDetector.value = new YinF0Detector(audioCtx.sampleRate, 80, 1000, 0.2)

    listenerHandle.value = await audioRecorder.start(audioCtx, source)
    if (listenerHandle.value) {
      listenerHandle.value.addListener(processAudio)
    }

    isRunning.value = true
    lastDrawTime.value = performance.now()
    updatePitch()
  } catch (err) {
    console.error('Error starting pitch monitor:', err)
  }
}

const stop = () => {
  isRunning.value = false

  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
  }

  if (listenerHandle.value) {
    listenerHandle.value.removeListener()
    listenerHandle.value = null
  }
}

const updatePitch = () => {
  if (!isRunning.value) return

  // Sync DOM updates with Animation Frame (prevents layout thrashing in audio callback)
  if (currentNote.value !== latestDetectedNote) {
    currentNote.value = latestDetectedNote
  }

  const now = performance.now()
  if (now - lastDrawTime.value >= DRAW_INTERVAL) {
    draw()
    lastDrawTime.value = now
  }

  animationFrameId.value = requestAnimationFrame(updatePitch)
}

const draw = () => {
  if (!ctx.value || !canvasRef.value) return

  const { width, height } = canvasRef.value
  ctx.value.clearRect(0, 0, width, height)

  ctx.value.fillStyle = '#111111'
  ctx.value.fillRect(0, 0, width, height)

  const PLAYHEAD_X = width * 0.8
  const PX_PER_SEC = (sampleRate.value / hopSize.value) * GRAPH_SPEED
  const currentTime = props.audioElement ? props.audioElement.currentTime : (historyData.value.length > 0 ? historyData.value[historyData.value.length - 1].time : 0)

  currentCenterPitch.value += (targetCenterPitch.value - currentCenterPitch.value) * 0.05
  const halfRange = VISIBLE_RANGE_SEMITONES / 2
  const minMidi = currentCenterPitch.value - halfRange
  const maxMidi = currentCenterPitch.value + halfRange
  const range = maxMidi - minMidi
  const getY = (midiVal) => height - ((midiVal - minMidi) / range) * height

  ctx.value.font = "14px sans-serif"
  ctx.value.textAlign = "left"
  ctx.value.textBaseline = "middle"
  const startGrid = Math.floor(minMidi)
  const endGrid = Math.ceil(maxMidi)

  for (let m = startGrid; m <= endGrid; m++) {
    const gridFreq = 440 * Math.pow(2, (m - 69) / 12)
    const name = YinF0Detector.frequencyToNote(gridFreq)
    const isC = name.startsWith("C") && !name.includes("#")
    const isSharp = name.includes("#")
    const y = getY(m)

    if (!isSharp) {
      ctx.value.beginPath()
      ctx.value.moveTo(0, y)
      ctx.value.lineTo(width, y)
      ctx.value.lineWidth = isC ? 2 : 1
      ctx.value.strokeStyle = isC ? "#666" : "#333"
      ctx.value.stroke()
      ctx.value.fillStyle = isC ? "#DDD" : "#777"
      ctx.value.fillText(name, 10, y)
    }
  }

  if (referencePitchData.value) {
    const frameDuration = hopSize.value / sampleRate.value
    const totalFrames = referencePitchData.value.length

    const maxVisibleOffset = (width - PLAYHEAD_X)
    const minVisibleOffset = -PLAYHEAD_X

    const startFrame = Math.floor((currentTime + (minVisibleOffset / PX_PER_SEC)) / frameDuration)
    const endFrame = Math.ceil((currentTime + (maxVisibleOffset / PX_PER_SEC)) / frameDuration)

    const clampStart = Math.max(0, startFrame)
    const clampEnd = Math.min(totalFrames - 1, endFrame)

    ctx.value.beginPath()
    ctx.value.lineWidth = 3
    ctx.value.strokeStyle = "rgba(150, 150, 150, 0.6)"
    ctx.value.lineCap = "round"
    ctx.value.lineJoin = "round"
    let pathStarted = false

    // Loop through visible reference data
    for (let i = clampStart; i <= clampEnd; i++) {
      const pitch = referencePitchData.value[i]
      const frameTime = i * frameDuration

      // Optimization: Only calculate x/y if pitch is valid
      if (pitch !== null && pitch > 0) {
        const x = PLAYHEAD_X + (frameTime - currentTime) * PX_PER_SEC
        const y = getY(pitch)

        if (y >= -50 && y <= height + 50) {
          if (!pathStarted) {
            ctx.value.moveTo(x, y)
            pathStarted = true
          } else {
            ctx.value.lineTo(x, y)
          }
        } else {
          pathStarted = false
        }
      } else {
        pathStarted = false
      }
    }
    ctx.value.stroke()
  }

  const markersToRender = errorMarkers.value
  markersToRender.forEach(marker => {
    const timeDiff = marker.time - currentTime
    const x = PLAYHEAD_X + (timeDiff * PX_PER_SEC)

    if (x >= 0 && x <= width) {
      ctx.value.beginPath()
      ctx.value.strokeStyle = "rgb(60,35,128)"
      ctx.value.lineWidth = 3
      ctx.value.moveTo(x, 0)
      ctx.value.lineTo(x, height)
      ctx.value.stroke()
    }
  })

  if (historyData.value.length > 1) {
    ctx.value.beginPath()
    ctx.value.lineWidth = 4
    ctx.value.strokeStyle = "#FFFF00"
    ctx.value.lineCap = "round"
    ctx.value.lineJoin = "round"
    ctx.value.shadowBlur = 10
    ctx.value.shadowColor = "#FFFF00"
    let started = false

    for (let i = 0; i < historyData.value.length; i++) {
      const point = historyData.value[i]
      const timeDiff = point.time - currentTime
      const x = PLAYHEAD_X + (timeDiff * PX_PER_SEC)

      if (x > PLAYHEAD_X) continue
      if (x < -10) continue

      if (point.active && point.val !== null) {
        const y = getY(point.val)
        if (y < -50 || y > height + 50) {
          started = false
          continue
        }
        if (!started) {
          ctx.value.moveTo(x, y)
          started = true
        } else {
          ctx.value.lineTo(x, y)
        }
      } else {
        started = false
      }
    }
    ctx.value.stroke()
    ctx.value.shadowBlur = 0
  }

  ctx.value.beginPath()
  ctx.value.strokeStyle = "rgba(255, 255, 255, 0.2)"
  ctx.value.lineWidth = 1
  ctx.value.setLineDash([5, 5])
  ctx.value.moveTo(0, height / 2)
  ctx.value.lineTo(width, height / 2)
  ctx.value.stroke()
  ctx.value.setLineDash([])
}

const reset = () => {
  stop()
  // Clearing shallowRef array content
  historyData.value.length = 0
  errorMarkers.value.length = 0
  currentNote.value = ''
  latestDetectedNote = '' // Reset temp var
  currentCenterPitch.value = 60
  targetCenterPitch.value = 60
  audioFilter.value.reset()
  errorDetector.value.reset()
  if (ctx.value && canvasRef.value) {
    ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    draw()
  }
}

watch(() => props.vocalData, (newData) => {
  if (newData) {
    const mappedPitches = mapPitchesToNotes(newData.pitchData)
    const processedData = { ...newData, pitchData: mappedPitches }

    if (errorDetector.value.loadSampleData(processedData)) {
      errorMarkers.value.length = 0
      referencePitchData.value = mappedPitches.map(freq => {
        if (freq > 0) {
          return 69 + 12 * Math.log2(freq / 440)
        }
        return null
      })
      sampleRate.value = newData.sampleRate || 44100
      hopSize.value = 512
    }
  }
})

let resizeTimeout = null
const debouncedResize = () => {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(resizeCanvas, 150)
}

onMounted(() => {
  if (canvasRef.value) {
    ctx.value = canvasRef.value.getContext('2d', { alpha: false })
    resizeCanvas()
    window.addEventListener('resize', debouncedResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedResize)
  if (resizeTimeout) clearTimeout(resizeTimeout)
  stop()
  historyData.value = []
  errorMarkers.value = []
  referencePitchData.value = null
})

defineExpose({
  start,
  stop,
  reset
})
</script>
