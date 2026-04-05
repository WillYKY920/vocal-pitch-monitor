<template>
  <div id="monitor-container">
    <div id="note-display">{{ currentNote }}</div>
    <div id="playhead-line" :class="{ recording: isRunning }"></div>

    <!-- Popup Result Modal -->
    <div v-if="songEnded && pitchResults.length" class="result-modal">
      <div class="result-header">
        <div class="col-lyrics">Lyrics</div>
        <div class="col-offkey">Off-key %</div>
      </div>

      <div class="result-body">
        <div
            v-for="(item, index) in pitchResults"
            :key="index"
            :class="['result-row', { 'has-audio': item.audioUrl }]"
            @click="playSegment(item.audioUrl)"
        >
          <div class="col-lyrics">
            <span v-if="item.audioUrl" class="play-icon">▶</span>
            {{ item.timeStr }} {{ item.text }}
          </div>
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
const currentlyPlaying = ref(null)

const {
  currentNote,
  isRunning,
  songEnded,
  offKeyEvents,
  rawAudioChunks,
  sampleRate,
  start,
  stop,
  reset: canvasReset
} = usePitchCanvas(props, canvasRef)

const { pitchResults, cleanupUrls } = usePitchResults(songEnded, props, offKeyEvents, rawAudioChunks, sampleRate)

// Plays the specific voice segment
const playSegment = (url) => {
  if (!url) return
  if (currentlyPlaying.value) {
    currentlyPlaying.value.pause()
    currentlyPlaying.value.currentTime = 0
  }
  currentlyPlaying.value = new Audio(url)
  currentlyPlaying.value.play()
}

// Wrapper to clear old URLs when the user resets/starts a new song
const reset = () => {
  if (currentlyPlaying.value) currentlyPlaying.value.pause()
  cleanupUrls()
  canvasReset()
}

defineExpose({ start, stop, reset })
</script>

<style scoped>
/* Add to your existing styles */
.result-row.has-audio {
  cursor: pointer;
  transition: background-color 0.2s;
}
.result-row.has-audio:hover {
  background-color: #444 !important; /* Highlights on hover */
}
.play-icon {
  display: inline-block;
  color: #a64dff;
  font-size: 12px;
  margin-right: 6px;
  vertical-align: middle;
}
</style>
