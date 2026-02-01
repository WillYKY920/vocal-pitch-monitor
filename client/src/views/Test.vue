<template>
  <div class="page-container">
    <div class="control-panel">

      <div class="card">
        <h3>Artist Management</h3>
        <div class="form-group">
          <label>Artist Name</label>
          <input type="text" v-model="artistName" placeholder="Enter artist name" />
        </div>
        <div class="btn-group">
          <button class="btn-get" @click="getArtistByName">GET</button>
          <button class="btn-action" @click="saveArtist">SAVE POST</button>
        </div>
      </div>

      <!-- Song Management -->
      <div class="card">
        <h3>Song Management</h3>
        <div class="form-group">
          <label>Song ID</label>
          <input type="number" v-model="songId" placeholder="Enter Song ID" />
        </div>
        <div class="btn-group">
          <button class="btn-get" @click="getSongById">GET Song</button>
          <button class="btn-get" @click="getLyricsById">GET Lyrics</button>
          <button class="btn-red" @click="deleteSongById">DELETE</button>
        </div>
      </div>

      <!-- List of Songs/Artists -->
      <div class="card">
        <h3>List of Songs/Artists</h3>
        <div class="btn-group">
          <button class="btn-get" @click="getAllSongs">List All Songs</button>
          <button class="btn-get" @click="getAllArtists">List All Artists</button>
        </div>
      </div>

      <!-- Uploads -->
      <div class="card">
        <h3>Uploads</h3>

        <div class="form-group">
          <label>Upload Song lrc file</label>
          <div style="display:flex; gap:10px;">
            <input type="file" ref="lrcFileRef" accept=".lrc" />
            <button class="btn-post" style="width: 80px;" @click="uploadLrc">UPLOAD</button>
          </div>
        </div>

        <hr style="border-color: #333;" />

        <div class="form-group">
          <label>Target Song ID for Audio/Vocal</label>
          <input type="number" v-model="uploadSongId" placeholder="ID" />
        </div>

        <div class="form-group">
          <label>Upload Vocal Track (.wav/.flac)</label>
          <div style="display:flex; gap:10px;">
            <input type="file" ref="vocalFileRef" accept=".wav,.flac,.mp3" />
            <button class="btn-post" style="width: 80px;" @click="uploadVocal">UPLOAD</button>
          </div>
        </div>

        <div class="form-group">
          <label>Upload Audio Track (.wav/.flac)</label>
          <div style="display:flex; gap:10px;">
            <input type="file" ref="audioFileRef" accept=".wav,.flac,.mp3" />
            <button class="btn-post" style="width: 80px;" @click="uploadAudio">UPLOAD</button>
          </div>
        </div>
      </div>

      <!-- YIN Visualization -->
      <div class="card">
        <h3>YIN Visualization</h3>
        <div class="form-group">
          <label>Target Song ID for Vocal Track</label>
          <input type="number" v-model="vizSongId" placeholder="Enter Song ID" />
        </div>
        <div class="btn-group">
          <button class="btn-get" @click="getVocalPitchesBySongId">Get Vocal Pitches (Hz)</button>
          <button
              class="btn-red"
              @click="toggleRecording"
              :style="isRecording ? { backgroundColor: '#ff4444' } : {}"
          >
            {{ isRecording ? 'Stop Recording' : 'Record Pitch Stream' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Response Panel (Right Side) -->
    <div class="response-panel">
      <pre id="responseOutput">{{ responseOutput }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { YinF0Detector } from '../algorithms/pitchDetector.js';
import { AudioFilter } from '../algorithms/audioFilter.js';
import { useAudioRecorder } from '../composables/useAudioRecorder.js';

// --- Configuration ---
const BASE_URL = 'http://localhost:8080';

// --- State Refs ---
const responseOutput = ref('');
const artistName = ref('');
const songId = ref('');
const uploadSongId = ref('');
const vizSongId = ref('');
const lrcFileRef = ref(null);
const vocalFileRef = ref(null);
const audioFileRef = ref(null);

// --- Audio Recorder ---
const { start, stop, isActive: isRecording } = useAudioRecorder();
const recordingContext = ref(null);
const pitchList = ref([]);

// --- Helper Functions ---
const setResponseOutput = (value) => {
  responseOutput.value = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
};

const handleResponse = async (response) => {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      setResponseOutput(json);
    } catch {
      setResponseOutput(text || `Status: ${response.status} ${response.statusText}`);
    }
  } catch (err) {
    setResponseOutput(`Error reading response: ${err.message}`);
  }
};

// Hz <-> MIDI Conversion for Filter
const hzToMidi = (hz) => (hz <= 0 ? 0 : 69 + 12 * Math.log2(hz / 440));
const midiToHz = (midi) => (midi <= 0 ? 0 : 440 * Math.pow(2, (midi - 69) / 12));

// --- API Methods ---

// Artist
const getArtistByName = () => {
  if (!artistName.value) return alert('Please enter an artist name');
  fetch(`${BASE_URL}/artist/${encodeURIComponent(artistName.value)}`)
      .then(handleResponse)
      .catch(err => setResponseOutput(String(err)));
};

const saveArtist = () => {
  if (!artistName.value) return alert('Please enter an artist name');
  fetch(`${BASE_URL}/artist/save?name=${encodeURIComponent(artistName.value)}`, { method: 'POST' })
      .then(handleResponse)
      .catch(err => setResponseOutput(String(err)));
};

const getAllArtists = () => {
  fetch(`${BASE_URL}/artist/all`)
      .then(handleResponse)
      .catch(err => setResponseOutput(String(err)));
};

// Songs
const getSongById = () => {
  if (!songId.value) return alert('Please enter a Song ID');
  fetch(`${BASE_URL}/song/${songId.value}`)
      .then(handleResponse)
      .catch(err => setResponseOutput(String(err)));
};

const getLyricsById = () => {
  if (!songId.value) return alert('Please enter a Song ID');
  fetch(`${BASE_URL}/lyrics/${songId.value}`)
      .then(handleResponse)
      .catch(err => setResponseOutput(String(err)));
};

const deleteSongById = () => {
  if (!songId.value) return alert('Please enter a Song ID');
  fetch(`${BASE_URL}/song/delete/${songId.value}`)
      .then(handleResponse)
      .catch(err => setResponseOutput(String(err)));
};

const getAllSongs = () => {
  fetch(`${BASE_URL}/song/all`)
      .then(handleResponse)
      .catch(err => setResponseOutput(String(err)));
};

const getVocalPitchesBySongId = () => {
  if (!vizSongId.value) return alert('Please enter a Song ID');
  fetch(`${BASE_URL}/vocal/${vizSongId.value}`)
      .then(handleResponse)
      .catch(err => setResponseOutput(String(err)));
};

// Uploads
const uploadLrc = () => {
  if (!lrcFileRef.value?.files.length) return alert('Select an LRC file first');
  const formData = new FormData();
  formData.append('file', lrcFileRef.value.files[0]);
  fetch(`${BASE_URL}/lrc/save`, { method: 'POST', body: formData })
      .then(handleResponse)
      .catch(err => setResponseOutput(String(err)));
};

const uploadAudio = () => {
  if (!uploadSongId.value) return alert('Enter Song ID for this upload');
  if (!audioFileRef.value?.files.length) return alert('Select an audio file');
  const formData = new FormData();
  formData.append('file', audioFileRef.value.files[0]);
  fetch(`${BASE_URL}/audio/${uploadSongId.value}`, { method: 'POST', body: formData })
      .then(handleResponse)
      .catch(err => setResponseOutput(String(err)));
};

const uploadVocal = async () => {
  if (!uploadSongId.value) return alert('Enter Song ID for this upload');
  if (!vocalFileRef.value?.files.length) return alert('Select a vocal file');

  const file = vocalFileRef.value.files[0];
  try {
    setResponseOutput("Processing audio... please wait.");

    // 1. Extract pitch data locally using Class implementation
    const processedData = await extractPitchData(file);

    // 2. Send JSON to endpoint
    const response = await fetch(`${BASE_URL}/vocal/${uploadSongId.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(processedData)
    });

    // 3. Handle response
    await handleResponse(response);
  } catch (err) {
    setResponseOutput(`Error processing or uploading: ${err.message}`);
  }
};

// --- Pitch Processing Logic ---

const getWavSampleRate = (arrayBuffer) => {
  const dataView = new DataView(arrayBuffer);
  const riff = String.fromCharCode(
      dataView.getUint8(0), dataView.getUint8(1), dataView.getUint8(2), dataView.getUint8(3)
  );
  if (riff !== 'RIFF') {
    console.warn('Not a valid WAV file, using default 44100 Hz');
    return 44100;
  }
  return dataView.getUint32(24, true);
};

const extractPitchData = async (file) => {
  const arrayBuffer = await file.arrayBuffer();

  // Decode to get ORIGINAL sample rate
  const tempContext = new (window.AudioContext || window.webkitAudioContext)();
  const tempBuffer = await tempContext.decodeAudioData(arrayBuffer.slice(0));
  await tempContext.close();

  // Parse WAV header for actual rate
  const actualSampleRate = getWavSampleRate(arrayBuffer);

  // Create Context
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: actualSampleRate
  });

  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const pcmData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const totalSamples = pcmData.length;

  console.log(`Final sample rate: ${sampleRate} Hz`);

  // Use provided classes
  const yinDetector = new YinF0Detector(sampleRate, 80, 1000, 0.20);
  const audioFilter = new AudioFilter(5, 24); // window=5, maxJump=24

  const bufferSize = 2048;
  const hopSize = 512;
  const pitchData = [];
  const RMS_THRESHOLD = 0.03;
  const totalFrames = Math.floor((totalSamples - bufferSize) / hopSize);
  let frameCount = 0;

  for (let i = 0; i < totalSamples - bufferSize; i += hopSize) {
    const frame = pcmData.slice(i, i + bufferSize);
    const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);

    let pitch = 0;
    if (rms > RMS_THRESHOLD) {
      const detectedHz = yinDetector.estimateF0(frame);
      if (detectedHz >= 80 && detectedHz <= 1000) {
        // Convert Hz -> MIDI -> Filter -> Hz
        const midi = hzToMidi(detectedHz);
        const filteredMidi = audioFilter.process(midi);
        if (filteredMidi !== null) {
          pitch = midiToHz(filteredMidi);
        }
      }
    }
    pitchData.push(pitch);
    frameCount++;

    // Update progress occasionally
    if (frameCount % 100 === 0) {
      const currentPercent = Math.floor((frameCount / totalFrames) * 100);
      setResponseOutput(`Extracting pitch data... ${currentPercent}%`);
    }
  }

  await audioContext.close();

  return {
    fileName: file.name,
    samples: totalSamples,
    sampleRate: sampleRate,
    hopSize: hopSize,
    pitchData: pitchData
  };
};

// --- Recording Logic ---

const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
};

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaStreamSource(stream);

    recordingContext.value = ctx;
    pitchList.value = [];

    const yin = new YinF0Detector(ctx.sampleRate, 80, 1000, 0.15);

    // useAudioRecorder handles the ScriptProcessor
    const recorder = await start(ctx, source);

    if (recorder) {
      recorder.addListener((inputData) => {
        const pitch = yin.estimateF0(inputData);
        pitchList.value.push(pitch);

        const recent = pitchList.value.slice(-10).map((p, i) =>
            `Frame ${pitchList.value.length - 10 + i + 1}: ${p.toFixed(2)} Hz`
        ).join('\n');

        setResponseOutput(`Recording... Total Frames: ${pitchList.value.length}\n\nRecent:\n${recent}`);
      });
    }

  } catch (err) {
    setResponseOutput(`Error starting recording: ${err.message}`);
  }
};

const stopRecording = () => {
  stop(); // Stop useAudioRecorder

  if (recordingContext.value) {
    recordingContext.value.close();
    recordingContext.value = null;
  }

  const fullList = pitchList.value.map((p, i) => `Frame ${i + 1}: ${p.toFixed(2)} Hz`).join('\n');
  setResponseOutput(`Recording Stopped.\n\nFull Pitch List:\n${fullList}`);
};

onUnmounted(() => {
  if (isRecording.value) stopRecording();
});
</script>

<style>
@import '../assets/styles/test.css';
</style>