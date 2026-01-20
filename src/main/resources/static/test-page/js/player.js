// player-functions.js - Audio player operations

// 6. Audio Player Functions
async function playTrack() {
    const trackId = document.getElementById('trackId').value;
    if (!trackId) return alert('Please enter a track ID');

    const audioPlayer = document.getElementById('audioPlayer');
    const playerStatus = document.getElementById('playerStatus');

    audioPlayer.src = `${baseUrl}/play/${trackId}`;
    audioPlayer.load();

    playerStatus.textContent = `Loading track ID: ${trackId}...`;
    playerStatus.style.display = 'block';

    try {
        await audioPlayer.play();
        playerStatus.textContent = `Now playing track ID: ${trackId}`;
    } catch (error) {
        playerStatus.textContent = `Playback error: ${error.message}`;
    }
}

// Get Now Playing Info
async function getNowPlayingInfo() {
    try {
        const response = await fetch(`${baseUrl}/play/info`);
        if (response.ok) {
            const data = await response.json();
            showResult('nowPlayingInfo', JSON.stringify(data, null, 2));
        } else {
            showResult('nowPlayingInfo', 'No audio playing', true);
        }
    } catch (error) {
        showResult('nowPlayingInfo', `Error: ${error.message}`, true);
    }
}