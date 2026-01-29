
const BASE_URL = 'http://localhost:8080';

function setResponseOutput(value) {
    const output = document.getElementById('responseOutput');
    output.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

async function handleResponse(response) {
    const output = document.getElementById('responseOutput');

    try {
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            output.textContent = JSON.stringify(json, null, 2);
        } catch {
            output.textContent = text || `Status: ${response.status} ${response.statusText}`;
        }
    } catch (err) {
        output.textContent = `Error reading response: ${err.message}`;
    }
}

// --- Artist Endpoints ---
function getArtistByName() {
    const name = document.getElementById('artistNameInput').value;
    if (!name) return alert('Please enter an artist name');

    fetch(`${BASE_URL}/artist/${encodeURIComponent(name)}`)
        .then(handleResponse)
        .catch(err => setResponseOutput(String(err)));
}

function saveArtist() {
    const name = document.getElementById('artistNameInput').value;
    if (!name) return alert('Please enter an artist name');

    fetch(`${BASE_URL}/artist/save?name=${encodeURIComponent(name)}`, { method: 'POST' })
        .then(handleResponse)
        .catch(err => setResponseOutput(String(err)));
}

function getAllArtists() {
    fetch(`${BASE_URL}/artist/all`)
        .then(handleResponse)
        .catch(err => setResponseOutput(String(err)));
}

// --- Song Endpoints ---
function getSongById() {
    const id = document.getElementById('songIdInput').value;
    if (!id) return alert('Please enter a Song ID');

    fetch(`${BASE_URL}/song/${id}`)
        .then(handleResponse)
        .catch(err => setResponseOutput(String(err)));
}

function getLyricsById() {
    const id = document.getElementById('songIdInput').value;
    if (!id) return alert('Please enter a Song ID');

    fetch(`${BASE_URL}/lyrics/${id}`)
        .then(handleResponse)
        .catch(err => setResponseOutput(String(err)));
}

function deleteSongById() {
    const id = document.getElementById('songIdInput').value;
    if (!id) return alert('Please enter a Song ID');

    fetch(`${BASE_URL}/song/delete/${id}`)
        .then(handleResponse)
        .catch(err => setResponseOutput(String(err)));
}

function getAllSongs() {
    fetch(`${BASE_URL}/song/all`)
        .then(handleResponse)
        .catch(err => setResponseOutput(String(err)));
}

function getVocalPitchesBySongId() {
    // 1. Get the ID from the specific input field in the Visualization card
    const id = document.getElementById('songIdInput2').value;
    if (!id) return alert('Please enter a Song ID');
    fetch(`${BASE_URL}/vocal/${id}`)
        .then(handleResponse) // Uses your existing response handler to display the JSON
        .catch(err => setResponseOutput(String(err)));
}

// --- Upload Endpoints ---
function uploadLrc() {
    const fileInput = document.getElementById('lrcFile');
    if (fileInput.files.length === 0) return alert('Select an LRC file first');

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch(`${BASE_URL}/lrc/save`, { method: 'POST', body: formData })
        .then(handleResponse)
        .catch(err => setResponseOutput(String(err)));
}

function uploadAudio() {
    const id = document.getElementById('uploadSongId').value;
    const fileInput = document.getElementById('audioFile');
    if (!id) return alert('Enter Song ID for this upload');
    if (fileInput.files.length === 0) return alert('Select an audio file');

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch(`${BASE_URL}/audio/${id}`, { method: 'POST', body: formData })
        .then(handleResponse)
        .catch(err => setResponseOutput(String(err)));
}

async function uploadVocal() {
    const id = document.getElementById('uploadSongId').value;
    const fileInput = document.getElementById('vocalFile');

    if (!id) return alert('Enter Song ID for this upload');
    if (fileInput.files.length === 0) return alert('Select a vocal file');

    const file = fileInput.files[0];

    try {
        setResponseOutput("Processing audio... please wait.");
        // 1. Extract pitch data locally
        const processedData = await extractPitchData(file);
        // 2. Send JSON to endpoint
        const response = await fetch(`${BASE_URL}/vocal/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(processedData)
        });

        // 3. Handle response
        await handleResponse(response);

    } catch (err) {
        setResponseOutput(`Error processing or uploading: ${err.message}`);
    }
}

/**
 * Converts an audio file to pitch data using the YIN algorithm.
 * @param {File} file - The .wav or .flac file to process.
 * @returns {Promise<{fileName: string, samples: number, sampleRate: number, hopSize: number, pitchData: number[]}>}
 */
async function extractPitchData(file) {
    const arrayBuffer = await file.arrayBuffer();

    // STEP 1: First decode to get the ORIGINAL sample rate
    const tempContext = new (window.AudioContext || window.webkitAudioContext)();
    const tempBuffer = await tempContext.decodeAudioData(arrayBuffer.slice(0));
    const originalSampleRate = tempBuffer.sampleRate;
    await tempContext.close();

    console.log(`Detected sample rate from AudioContext: ${originalSampleRate} Hz`);
    console.log(`WARNING: Browser may have resampled the file!`);

    // STEP 2: Parse WAV header to get ACTUAL file sample rate
    const actualSampleRate = getWavSampleRate(arrayBuffer);
    console.log(`Actual WAV file sample rate: ${actualSampleRate} Hz`);

    // STEP 3: Create AudioContext with the correct sample rate
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: actualSampleRate
    });

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const pcmData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const totalSamples = pcmData.length;

    console.log(`Final sample rate: ${sampleRate} Hz`);
    console.log(`Total samples: ${totalSamples}`);
    console.log(`Duration: ${(totalSamples / sampleRate).toFixed(2)}s`);

    // Stricter threshold for vocal detection
    const yinDetector = new YinF0Detector(sampleRate, 80, 1000, 0.20);

    const bufferSize = 2048;
    const hopSize = 512;
    const pitchData = [];

    // Higher RMS threshold to ignore background noise
    const RMS_THRESHOLD = 0.03;

    for (let i = 0; i < totalSamples - bufferSize; i += hopSize) {
        const frame = pcmData.slice(i, i + bufferSize);

        const rms = Math.sqrt(
            frame.reduce((sum, val) => sum + val * val, 0) / frame.length
        );

        let pitch = 0;
        if (rms > RMS_THRESHOLD) {
            const detectedPitch = yinDetector.estimateF0(frame);
            if (detectedPitch >= 80 && detectedPitch <= 1000) {
                pitch = detectedPitch;
            }
        }

        pitchData.push(pitch);
    }

    // Clean up
    await audioContext.close();

    const audioDuration = totalSamples / sampleRate;
    const pitchDataDuration = (pitchData.length * hopSize) / sampleRate;

    console.log(`Extraction complete:
- File: ${file.name}
- Sample Rate: ${sampleRate} Hz
- Total Samples: ${totalSamples}
- Pitch Frames: ${pitchData.length}
- Hop Size: ${hopSize} samples
- Pitch Data Duration: ${pitchDataDuration.toFixed(2)}s (${pitchDataDuration})`);

    return {
        fileName: file.name,
        samples: totalSamples,
        sampleRate: sampleRate,
        hopSize: hopSize,
        pitchData: pitchData
    };
}

/**
 * Read sample rate directly from WAV file header
 * @param {ArrayBuffer} arrayBuffer - WAV file data
 * @returns {number} Sample rate in Hz
 */
function getWavSampleRate(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);

    // Check RIFF header
    const riff = String.fromCharCode(
        dataView.getUint8(0),
        dataView.getUint8(1),
        dataView.getUint8(2),
        dataView.getUint8(3)
    );

    if (riff !== 'RIFF') {
        console.warn('Not a valid WAV file, using default 44100 Hz');
        return 44100;
    }

    // Sample rate is at byte offset 24 (little-endian)
    const sampleRate = dataView.getUint32(24, true);

    return sampleRate;
}


// --- Real-time Vocal Pitch Recording ---
let recording = { ctx: null, stream: null, node: null };
let pitchList = [];

function toggleRecording() {
    if (recording.ctx) {
        stopVocalPitchRecording();
    } else {
        startVocalPitchRecording();
    }
}

// Helper to update button visual state
function updateRecordButtonState(isRecording) {
    const buttons = document.getElementsByTagName('button');
    for (let btn of buttons) {
        if (btn.textContent.includes('Record Pitch Stream') || btn.textContent.includes('Stop Recording')) {
            if (isRecording) {
                btn.textContent = "Stop Recording";
                btn.style.backgroundColor = "#ff4444"; // Visual feedback (Red)
            } else {
                btn.textContent = "Record Pitch Stream";
                btn.style.backgroundColor = ""; // Reset to default
            }
            break;
        }
    }
}

async function startVocalPitchRecording() {
    if (recording.ctx) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const source = ctx.createMediaStreamSource(stream);
        const node = ctx.createScriptProcessor(2048, 1, 1);
        const yin = new YinF0Detector(ctx.sampleRate, 80, 1000, 0.15);

        recording = { ctx, stream, node };
        pitchList = [];

        node.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pitch = yin.estimateF0(inputData);
            pitchList.push(pitch);

            // Live Display: Show count + last 10 pitches
            const recent = pitchList.slice(-10).map((p, i) =>
                `Frame ${pitchList.length - 10 + i + 1}: ${p.toFixed(2)} Hz`
            ).join('\n');

            setResponseOutput(`Recording... Total Frames: ${pitchList.length}\n\nRecent:\n${recent}`);
        };

        source.connect(node);
        node.connect(ctx.destination);

        updateRecordButtonState(true);

    } catch (err) {
        setResponseOutput(`Error: ${err.message}`);
    }
}

function stopVocalPitchRecording() {
    if (!recording.ctx) return;

    recording.node.disconnect();
    recording.ctx.close();
    recording.stream.getTracks().forEach(track => track.stop());
    recording = { ctx: null, stream: null, node: null };

    const fullList = pitchList.map((p, i) => `Frame ${i + 1}: ${p.toFixed(2)} Hz`).join('\n');
    setResponseOutput(`Recording Stopped.\n\nFull Pitch List:\n${fullList}`);

    updateRecordButtonState(false);
}

// Auto-attach event listener when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Find the button with text "Record Pitch Stream"
    const buttons = document.getElementsByTagName('button');
    for (let btn of buttons) {
        if (btn.textContent.trim() === 'Record Pitch Stream') {
            btn.onclick = toggleRecording;
            break;
        }
    }
});

