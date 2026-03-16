<!-- components/WaveformVisualizer.vue -->
<template>
  <div class="waveform-visualizer-area">
    <canvas ref="canvasRef" id="waveformCanvas"></canvas>
    <div class="waveform-indicator-bar" :class="{ recording: isRecording }"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useWaveformCanvas } from '../composables/useWaveformCanvas.js'

const canvasRef = ref(null)

const {
  isRecording,
  start,
  stop,
  clear,
  reset
} = useWaveformCanvas(canvasRef)

defineExpose({
  start,
  stop,
  clear,
  reset
})
</script>
