<template>
  <div id="monitor-container">
    <div id="note-display">{{ currentNote }}</div>
    <canvas ref="canvasRef" id="pitchCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { YinF0Detector } from '../algorithms/pitchDetector.js'
import { AudioFilter } from '../algorithms/audioFilter.js'
import { ErrorDetector } from '../algorithms/errorDetector.js'
import { useAudioRecorder } from '../composables/useAudioRecorder.js'

const props = defineProps({
  audioElement: Object,
  vocalData: Object
})

const canvasRef = ref(null)
const currentNote = ref('')
const ctx = ref(null)
const audioFilter = ref(new AudioFilter(5, 24))
const errorDetector = ref(new ErrorDetector())
const errorMarkers = ref([])

const MIN_FREQ = 80
const MAX_FREQ = 1000
const GRAPH_SPEED = 4
const VISIBLE_RANGE_SEMITONES = 32
const MAX_HISTORY = 500
const MAX_ERROR_MARKERS = 50

const audioRecorder = useAudioRecorder()
const listenerHandle = ref(null)
const isRunning = ref(false)
const yinDetector = ref(null)
const historyData = ref([])
const maxHistoryLen = ref(0)
const currentCenterPitch = ref(60)
const targetCenterPitch = ref(60)
const referencePitchData = ref(null)
const sampleRate = ref(44100)
const hopSize = ref(512)
const animationFrameId = ref(null)
const lastDrawTime = ref(0)
const DRAW_INTERVAL = 16

const resizeCanvas = () => {
  if (!canvasRef.value) return
  const parent = canvasRef.value.parentElement
  if (parent) {
    canvasRef.value.width = parent.clientWidth
    canvasRef.value.height = parent.clientHeight
  }
  maxHistoryLen.value = Math.min(Math.ceil(canvasRef.value.width / GRAPH_SPEED) + 1, MAX_HISTORY)
  if (!isRunning.value) draw()
}

const processAudio = (inputData) => {
  if (!isRunning.value) return

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
    currentNote.value = YinF0Detector.frequencyToNote(smoothedFreq)
    targetCenterPitch.value = smoothedPitch
    historyData.value.push({ val: smoothedPitch, active: true })

    const currentTime = props.audioElement ? props.audioElement.currentTime : 0
    const error = errorDetector.value.processUserPitch(smoothedPitch, currentTime)
    if (error) {
      errorMarkers.value.push({
        historyIndex: historyData.value.length - 1,
        errorInfo: error
      })
      if (errorMarkers.value.length > MAX_ERROR_MARKERS) {
        errorMarkers.value.shift()
      }
    }
  } else {
    historyData.value.push({ val: null, active: false })
  }

  if (historyData.value.length > maxHistoryLen.value) {
    const removeCount = historyData.value.length - maxHistoryLen.value
    historyData.value.splice(0, removeCount)
    errorMarkers.value = errorMarkers.value
        .map(marker => ({
          ...marker,
          historyIndex: marker.historyIndex - removeCount
        }))
        .filter(marker => marker.historyIndex >= 0)
  }

  errorDetector.value.clearOldErrors(10000)
}

const start = async (audioCtx, source) => {
  if (isRunning.value) return
  try {
    yinDetector.value = new YinF0Detector(audioCtx.sampleRate, 80, 1000, 0.15)

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

  const now = performance.now()
  if (now - lastDrawTime.value >= DRAW_INTERVAL) {
    draw()
    lastDrawTime.value = now
  }

  animationFrameId.value = requestAnimationFrame(updatePitch)
}

const timeToFrameIndex = (currentTime) => {
  return Math.floor((currentTime * sampleRate.value) / hopSize.value)
}

const draw = () => {
  if (!ctx.value || !canvasRef.value) return

  const { width, height } = canvasRef.value
  ctx.value.clearRect(0, 0, width, height)
  ctx.value.fillStyle = '#111111'
  ctx.value.fillRect(0, 0, width, height)

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

  if (referencePitchData.value && props.audioElement) {
    const currentTime = props.audioElement.currentTime
    const currentFrameIndex = timeToFrameIndex(currentTime)
    const framesToShow = Math.min(maxHistoryLen.value, 300)

    ctx.value.beginPath()
    ctx.value.lineWidth = 3
    ctx.value.strokeStyle = "rgba(150, 150, 150, 0.6)"
    ctx.value.lineCap = "round"
    ctx.value.lineJoin = "round"
    let pathStarted = false

    for (let i = 0; i < framesToShow; i++) {
      const refFrameIndex = currentFrameIndex - i
      if (refFrameIndex < 0 || refFrameIndex >= referencePitchData.value.length) {
        pathStarted = false
        continue
      }

      const pitch = referencePitchData.value[refFrameIndex]
      if (pitch !== null && pitch > 0) {
        const x = width - (i * GRAPH_SPEED)
        const y = getY(pitch)
        if (y >= -50 && y <= height + 50 && x >= -10 && x <= width + 10) {
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

  const markersToRender = errorMarkers.value.slice(-30)
  markersToRender.forEach(marker => {
    const historyPosition = historyData.value.length - 1 - marker.historyIndex
    const x = width - (historyPosition * GRAPH_SPEED)
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

    const historyLen = historyData.value.length
    for (let i = 0; i < historyLen; i++) {
      const point = historyData.value[historyLen - 1 - i]
      const x = width - (i * GRAPH_SPEED)
      if (x < -10) break
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
  historyData.value = []
  errorMarkers.value = []
  currentNote.value = ''
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
  if (newData && errorDetector.value.loadSampleData(newData)) {
    errorMarkers.value = []
    referencePitchData.value = newData.pitchData.map(freq => {
      if (freq > 0) {
        return 69 + 12 * Math.log2(freq / 440)
      }
      return null
    })
    sampleRate.value = newData.sampleRate || 44100
    hopSize.value = 512
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
