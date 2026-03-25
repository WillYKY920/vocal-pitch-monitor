<template>
  <div id="monitor-container">
    <div id="note-display">{{ currentNote }}</div>
    <div id="playhead-line" :class="{ recording: isRunning }"></div>

    <!-- New Result Popup Frame -->
    <div v-if="songEnded && pitchResults.length" class="result-modal">
      <div class="result-header">
        <div class="col-lyrics">Lyrics</div>
        <div class="col-offkey">Off-key %</div>
      </div>
      <div class="result-body">
        <div v-for="(item, index) in pitchResults" :key="index" class="result-row">
          <div class="col-lyrics">{{ item.timeStr }} {{ item.text }}</div>
          <div class="col-offkey">
            <span :class="['pill', item.offKeyPercent >= 45 ? 'pill-high' : 'pill-med']">
              {{ item.offKeyPercent }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <canvas ref="canvasRef" id="pitchCanvas"></canvas>
  </div>
</template>

<script setup>
// In your Vue component script setup
import { ref } from 'vue'
import { usePitchCanvas } from '../composables/usePitchCanvas.js'
import { usePitchResults } from '../composables/usePitchResults.js'

const props = defineProps({
  audioElement: Object,
  vocalData: Object,
  lyrics: { type: Array, default: () => [] }
})

const canvasRef = ref(null)

const {
  currentNote,
  isRunning,
  songEnded,
  offKeyEvents,
  start,
  stop,
  reset
} = usePitchCanvas(props, canvasRef)

const { pitchResults } = usePitchResults(songEnded, props, offKeyEvents)

defineExpose({ start, stop, reset })
</script>
