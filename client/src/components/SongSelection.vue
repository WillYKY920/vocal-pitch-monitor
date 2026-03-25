<template>
  <div class="selection-area">
    <div class="list-headers">
      <div class="header-cell artist-header">
        <span>Artists</span>
        <select v-model="selectedLang" class="lang-select">
          <option value="all">all</option>
          <option value="zh">zh</option>
          <option value="ko">ko</option>
          <option value="en">en</option>
        </select>
      </div>
      <div class="header-cell">Songs</div>
    </div>
    <div class="list-content">
      <div class="column artist-col">
        <!-- Loop over filteredArtists and use artist.name -->
        <div
            v-for="artist in filteredArtists"
            :key="artist.name"
            class="column-item"
            :class="{ active: selectedArtist === artist.name }"
            @click="selectArtist(artist.name)"
        >
          {{ artist.name }}
        </div>
      </div>
      <div class="column song-col">
        <div
            v-if="songs.length === 0"
            class="column-item"
            style="cursor: default;"
        >
          {{ selectedArtist ? 'No songs found' : 'Select an artist' }}
        </div>
        <div
            v-for="song in songs"
            :key="song.id"
            class="column-item song-item"
            :class="{ active: currentSong?.id === song.id }"
            @click="selectSong(song)"
        >
          <span>{{ song.title }}</span>
          <span v-if="song.duration">{{ formatTime(song.duration, true) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { API } from '../services/api.js'
import { formatTime } from '../services/utils.js'

const props = defineProps({
  currentArtist: String,
  currentSong: Object
})

const emit = defineEmits(['song-selected'])

const artists = ref([])
const songs = ref([])
const selectedArtist = ref(null)
const selectedLang = ref('all')

const filteredArtists = computed(() => {
  if (selectedLang.value === 'all') return artists.value
  return artists.value.filter(artist => artist.lang === selectedLang.value)
})

const loadArtists = async () => {
  const data = await API.getArtists()
  artists.value = data.artists || []
}

const selectArtist = async (artistName) => {
  selectedArtist.value = artistName
  const data = await API.getSongsByArtist(artistName)
  songs.value = data.songs || []
}

const selectSong = (song) => {
  if (song && selectedArtist.value) {
    emit('song-selected', { song, artistName: selectedArtist.value })
  }
}

onMounted(() => {
  loadArtists()
})
</script>
