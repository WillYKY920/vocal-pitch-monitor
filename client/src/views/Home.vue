<script setup>
import { ref } from 'vue'
import PitchMonitor from '../components/PitchMonitor.vue'
import WaveformVisualizer from '../components/WaveformVisualizer.vue'
import AudioPlayer from '../components/AudioPlayer.vue'
import SongSelection from '../components/SongSelection.vue'
import LyricsDisplay from '../components/LyricsDisplay.vue'

const pitchMonitor = ref(null)
const audioPlayer = ref(null)
const waveformVisualizer = ref(null)

const audioElement = ref(null)
const currentVocalData = ref(null)
const lyrics = ref([])
const currentTime = ref(0)
const currentArtist = ref(null)
const currentSong = ref(null)
const audioContext = ref(null)
const micSourceNode = ref(null)

const handleSongSelected = ({ song, artistName }) => {
  if (!song) return
  currentArtist.value = artistName
  currentSong.value = song
  audioPlayer.value?.loadSong(song, artistName)
}

const handleAudioElementReady = (audio) => {
  audioElement.value = audio
}

const handleVocalDataLoaded = ({ vocalData, lyricsData }) => {
  currentVocalData.value = vocalData
  lyrics.value = lyricsData
}

const handleTimeUpdate = (time) => {
  currentTime.value = time
}

const handleAudioContextReady = ({ context, source }) => {
  audioContext.value = context
  micSourceNode.value = source
  waveformVisualizer.value?.start(context, source)
  pitchMonitor.value?.start(context, source)
}

const handlePlaybackStopped = () => {
  waveformVisualizer.value?.stop()
  pitchMonitor.value?.stop()
}

const handleSongLoading = () => {
  pitchMonitor.value?.reset()
  waveformVisualizer.value?.reset()
  lyrics.value = []
  currentTime.value = 0
}
</script>

<template>
  <section class="pitch-graph-container">
    <PitchMonitor
        ref="pitchMonitor"
        :audioElement="audioElement"
        :vocalData="currentVocalData"
        :lyrics="lyrics"
    />
  </section>

  <section class="bottom-section">
    <div class="ui-frame left-frame">
      <SongSelection
          @song-selected="handleSongSelected"
          :currentArtist="currentArtist"
          :currentSong="currentSong"
      />

      <AudioPlayer
          ref="audioPlayer"
          @audio-element-ready="handleAudioElementReady"
          @vocal-data-loaded="handleVocalDataLoaded"
          @time-update="handleTimeUpdate"
          @audio-context-ready="handleAudioContextReady"
          @playback-stopped="handlePlaybackStopped"
          @song-loading="handleSongLoading"
      />
    </div>

    <div class="ui-frame right-frame">
      <WaveformVisualizer
          ref="waveformVisualizer"
          :audioContext="audioContext"
          :sourceNode="micSourceNode"
      />

      <LyricsDisplay
          :lyrics="lyrics"
          :currentTime="currentTime"
      />
    </div>
  </section>
</template>

<style>
@import '../assets/styles/home.css';
</style>
