// app.js - Main application file with shared utilities and event listeners

const baseUrl = 'http://localhost:8080';
let lyrics = [];

// Helper functions
function showResult(elementId, content, isError = false) {
    const element = document.getElementById(elementId);
    element.innerHTML = content;
    element.style.display = 'block';
    element.style.borderLeftColor = isError ? '#e74c3c' : '#3498db';
}

function showStatus(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message ${isError ? 'error' : 'success'}`;
    element.style.display = 'block';
    setTimeout(() => element.style.display = 'none', 5000);
}

// Lyrics functions
async function getLyrics(id) {
    try {
        const res = await fetch(`${baseUrl}/lyrics/${id}`);
        lyrics = res.ok ? (await res.json()).lyrics : [];
    } catch (e) {
        lyrics = [];
    }
}

function updateLyrics() {
    const audio = document.getElementById('audioPlayer');
    if (!lyrics.length || audio.paused) return;

    const time = audio.currentTime * 1000;
    let currentIndex = -1;

    for (let i = 0; i < lyrics.length; i++) {
        if (lyrics[i].timestamp <= time) currentIndex = i;
        else break;
    }

    const currentEl = document.getElementById('currentLyric');
    const nextEl = document.getElementById('nextLyric');

    if (currentIndex >= 0) {
        currentEl.textContent = lyrics[currentIndex].text;
        nextEl.textContent = lyrics[currentIndex + 1]?.text || '';
    } else {
        currentEl.textContent = '';
        nextEl.textContent = '';
    }
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Enter key shortcuts
    document.getElementById('trackId')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') playTrack();
    });

    document.getElementById('songId')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') searchSong();
    });

    document.getElementById('artistName')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') searchArtist();
    });

    // Audio player event listeners
    const audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer) {
        audioPlayer.addEventListener('play', async () => {
            const id = document.getElementById('trackId').value;
            if (id) await getLyrics(id);
        });
    }

    // Start lyrics update interval
    setInterval(updateLyrics, 500);
});