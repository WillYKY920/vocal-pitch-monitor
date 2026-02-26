<template>
  <div class="waveform-visualizer-area">
    <canvas ref="canvasRef" id="waveformCanvas"></canvas>
    <div class="waveform-indicator-bar" :class="{ recording: isRecording }"></div>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAudioRecorder } from '../composables/useAudioRecorder.js'

const canvasRef = ref(null)
const ctx = ref(null)
const isRecording = ref(false)
const amplitudeHistory = ref([])
const maxHistory = 400
const audioRecorder = useAudioRecorder()
const listenerHandle = ref(null)

const resizeCanvas = () => {
  const parent = canvasRef.value?.parentElement
  if (parent) {
    canvasRef.value.width = Math.max(100, parent.clientWidth - 40)
    canvasRef.value.height = Math.max(100, parent.clientHeight - 40)
  }
}

const processAudio = (inputData) => {
  if (!isRecording.value) return

  let sum = 0
  for (let i = 0; i < inputData.length; i++) {
    sum += inputData[i] * inputData[i]
  }

  const rms = Math.sqrt(sum / inputData.length)
  const displayValue = Math.min(rms * 10, 1.0)

  amplitudeHistory.value.push({
    timestamp: Date.now(),
    value: rms,
    display: displayValue
  })

  if (amplitudeHistory.value.length > maxHistory) {
    amplitudeHistory.value.shift()
  }
  drawGraph()
}

const start = async (audioContext, sourceNode) => {
  if (isRecording.value) return
  if (!audioContext || !sourceNode) return

  try {
    listenerHandle.value = await audioRecorder.start(audioContext, sourceNode)
    if (listenerHandle.value) {
      listenerHandle.value.addListener(processAudio)
    }
    isRecording.value = true
  } catch (err) {
    console.error('WaveformGenerator Error:', err)
  }
}

const stop = () => {
  isRecording.value = false
  if (listenerHandle.value) {
    listenerHandle.value.removeListener()
    listenerHandle.value = null
  }
}

const clear = () => {
  amplitudeHistory.value = []
  drawGraph()
}

const drawGraph = () => {
  if (!ctx.value || !canvasRef.value) return
  const width = canvasRef.value.width
  const height = canvasRef.value.height
  const centerY = height / 2

  ctx.value.fillStyle = '#1e1e1e'
  ctx.value.fillRect(0, 0, width, height)

  ctx.value.strokeStyle = '#333'
  ctx.value.lineWidth = 2
  ctx.value.beginPath()
  ctx.value.moveTo(0, centerY)
  ctx.value.lineTo(width, centerY)
  ctx.value.stroke()

  if (amplitudeHistory.value.length === 0) return

  const barColor = '#633CCEFF'
  const barWidth = 3
  const gap = 2
  const slotWidth = barWidth + gap
  const maxBars = Math.floor(width / slotWidth)
  const startIndex = Math.max(0, amplitudeHistory.value.length - maxBars)

  ctx.value.fillStyle = barColor
  for (let i = startIndex; i < amplitudeHistory.value.length; i++) {
    const idx = i - startIndex
    const x = idx * slotWidth
    const amp = amplitudeHistory.value[i].display
    const h = amp * (height * 0.8)
    const topY = centerY - h / 2
    ctx.value.fillRect(x, topY, barWidth, h)
  }
}

onMounted(() => {
  if (canvasRef.value) {
    ctx.value = canvasRef.value.getContext('2d')
    resizeCanvas()
    drawGraph()
  }
})

const reset = () => {
  clear()
}

onUnmounted(() => {
  stop()
})

defineExpose({
  start,
  stop,
  clear,
  reset
})
</script>
