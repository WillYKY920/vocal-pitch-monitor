const BASE_URL = 'http://localhost:8080';

async function handleResponse(response) {
    const output = document.getElementById('responseOutput');
    try {
        const text = await response.text();
        // Try to format JSON if possible
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
    if(!name) return alert("Please enter an artist name");
    fetch(`${BASE_URL}/artist/${name}`)
        .then(handleResponse)
        .catch(err => document.getElementById('responseOutput').textContent = err);
}

function saveArtist() {
    const name = document.getElementById('artistNameInput').value;
    if(!name) return alert("Please enter an artist name");
    // Controller expects RequestParam 'name'
    fetch(`${BASE_URL}/artist/save?name=${encodeURIComponent(name)}`, { method: 'POST' })
        .then(handleResponse)
        .catch(err => document.getElementById('responseOutput').textContent = err);
}

function getAllArtists() {
    fetch(`${BASE_URL}/artist/all`)
        .then(handleResponse)
        .catch(err => document.getElementById('responseOutput').textContent = err);
}

// --- Song Endpoints ---

function getSongById() {
    const id = document.getElementById('songIdInput').value;
    if(!id) return alert("Please enter a Song ID");
    fetch(`${BASE_URL}/song/${id}`)
        .then(handleResponse)
        .catch(err => document.getElementById('responseOutput').textContent = err);
}

function getLyricsById() {
    const id = document.getElementById('songIdInput').value;
    if(!id) return alert("Please enter a Song ID");
    fetch(`${BASE_URL}/lyrics/${id}`)
        .then(handleResponse)
        .catch(err => document.getElementById('responseOutput').textContent = err);
}

function deleteSongById() {
    const id = document.getElementById('songIdInput').value;
    if(!id) return alert("Please enter a Song ID");
    // Controller uses GET for delete based on the snippet provided
    fetch(`${BASE_URL}/song/delete/${id}`)
        .then(handleResponse)
        .catch(err => document.getElementById('responseOutput').textContent = err);
}

function getAllSongs() {
    fetch(`${BASE_URL}/song/all`)
        .then(handleResponse)
        .catch(err => document.getElementById('responseOutput').textContent = err);
}

// --- Upload Endpoints ---

function uploadLrc() {
    const fileInput = document.getElementById('lrcFile');
    if(fileInput.files.length === 0) return alert("Select an LRC file first");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    fetch(`${BASE_URL}/lrc/save`, {
        method: 'POST',
        body: formData
    })
        .then(handleResponse)
        .catch(err => document.getElementById('responseOutput').textContent = err);
}

function uploadVocal() {
    const id = document.getElementById('uploadSongId').value;
    const fileInput = document.getElementById('vocalFile');

    if(!id) return alert("Enter Song ID for this upload");
    if(fileInput.files.length === 0) return alert("Select a vocal file");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    fetch(`${BASE_URL}/vocal/${id}`, {
        method: 'POST',
        body: formData
    })
        .then(handleResponse)
        .catch(err => document.getElementById('responseOutput').textContent = err);
}

function uploadAudio() {
    const id = document.getElementById('uploadSongId').value;
    const fileInput = document.getElementById('audioFile');

    if(!id) return alert("Enter Song ID for this upload");
    if(fileInput.files.length === 0) return alert("Select an audio file");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    fetch(`${BASE_URL}/audio/${id}`, {
        method: 'POST',
        body: formData
    })
        .then(handleResponse)
        .catch(err => document.getElementById('responseOutput').textContent = err);
}