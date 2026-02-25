<template>
  <div id="monitor-container">
    <div id="note-display">{{ currentNote }}</div>
    <div id="playhead-line" :class="{ recording: isRunning }"></div>

    <button
        v-if="showExport"
        class="export-btn"
        @click="exportJson"
    >
      Export Result
    </button>

    <canvas ref="canvasRef" id="pitchCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePitchCanvas } from '../composables/usePitchCanvas.js'

const props = defineProps({
  audioElement: Object,
  vocalData: Object,
  lyrics: { type: Array, default: () => [] }
})

const canvasRef = ref(null)

const {
  currentNote,
  isRunning,
  showExport,
  exportJson,
  start,
  stop,
  reset
} = usePitchCanvas(props, canvasRef)

defineExpose({ start, stop, reset })
</script>
