<template>
  <div class="lyrics-area">
    <div
        class="lyric-line prev"
        :class="{ empty: !prevLyric }"
    >
      {{ prevLyric }}
    </div>
    <div
        class="lyric-line active"
        :class="{ empty: !currentLyric }"
    >
      {{ currentLyric || '' }}
    </div>
    <div
        class="lyric-line next"
        :class="{ empty: !nextLyric }"
    >
      {{ nextLyric }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  lyrics: {
    type: Array,
    default: () => []
  },
  currentTime: {
    type: Number,
    default: 0
  }
})

const currentIndex = ref(-1)

const prevLyric = computed(() => {
  if (currentIndex.value > 0 && props.lyrics.length > 0) {
    return props.lyrics[currentIndex.value - 1]?.text || ''
  }
  return ''
})

const currentLyric = computed(() => {
  if (currentIndex.value >= 0 && currentIndex.value < props.lyrics.length) {
    return props.lyrics[currentIndex.value]?.text || ''
  }
  return ''
})

const nextLyric = computed(() => {
  if (currentIndex.value >= 0 && currentIndex.value < props.lyrics.length - 1) {
    return props.lyrics[currentIndex.value + 1]?.text || ''
  }
  return ''
})

watch(() => props.currentTime, (newTime) => {
  if (!props.lyrics || props.lyrics.length === 0) {
    currentIndex.value = -1
    return
  }

  const currentTimeMs = newTime * 1000

  for (let i = props.lyrics.length - 1; i >= 0; i--) {
    if (currentTimeMs >= props.lyrics[i].timestamp) {
      currentIndex.value = i
      return
    }
  }

  currentIndex.value = -1
}, { immediate: true })

watch(() => props.lyrics, (newLyrics) => {
  if (!newLyrics || newLyrics.length === 0) {
    currentIndex.value = -1
  }
}, { immediate: true })
</script>
