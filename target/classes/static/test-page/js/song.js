// song-functions.js - Song related operations

// 1. Search Song by ID
async function searchSong() {
    const songId = document.getElementById('songId').value;
    if (!songId) return alert('Please enter a Song ID');

    try {
        const response = await fetch(`${baseUrl}/song/${songId}`);
        if (response.ok) {
            const data = await response.json();
            showResult('songResult', JSON.stringify(data, null, 2));
        } else {
            showResult('songResult', `Error: ${response.status} ${response.statusText}`, true);
        }
    } catch (error) {
        showResult('songResult', `Error: ${error.message}`, true);
    }
}

// 4. Get All Songs
async function getAllSongs() {
    try {
        const response = await fetch(`${baseUrl}/song/all`);
        if (response.ok) {
            const data = await response.json();
            showResult('allSongsResult', JSON.stringify(data, null, 2));
        } else {
            showResult('allSongsResult', `Error: ${response.statusText}`, true);
        }
    } catch (error) {
        showResult('allSongsResult', `Error: ${error.message}`, true);
    }
}

// artist-functions.js - Artist related operations

// 3. Search Artist
async function searchArtist() {
    const artistName = document.getElementById('artistName').value;
    if (!artistName) return alert('Please enter an artist name');

    try {
        const response = await fetch(`${baseUrl}/artist/${encodeURIComponent(artistName)}`);
        if (response.ok) {
            const data = await response.json();
            showResult('artistResult', JSON.stringify(data, null, 2));
        } else {
            showResult('artistResult', `Artist not found`, true);
        }
    } catch (error) {
        showResult('artistResult', `Error: ${error.message}`, true);
    }
}

// 3b. Save Artist
async function saveArtist() {
    const artistName = document.getElementById('artistName').value;
    if (!artistName) return alert('Please enter an artist name');

    try {
        const response = await fetch(`${baseUrl}/artist/save?name=${encodeURIComponent(artistName)}`, {
            method: 'POST'
        });

        if (response.ok) {
            const data = await response.json();
            showResult('artistResult', `✓ Artist saved!\n${JSON.stringify(data, null, 2)}`);
        } else {
            showResult('artistResult', `Save failed`, true);
        }
    } catch (error) {
        showResult('artistResult', `Error: ${error.message}`, true);
    }
}