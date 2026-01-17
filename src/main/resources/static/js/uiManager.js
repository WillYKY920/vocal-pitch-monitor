// js/uiManager.js
import { API } from './api.js';
import { formatTime } from './utils.js';

export class UIManager {
    constructor(audioPlayer) {
        this.audioPlayer = audioPlayer;

        this.artistCol = document.querySelector('.artist-col');
        this.songCol = document.querySelector('.song-col');

        this.currentArtist = null;

        // Initial Load
        this.loadArtists();
        this.clearSongs(); // Default state: clear song list
    }

    async loadArtists() {
        const data = await API.getArtists();
        // data.artists is now ["artist1", "artist2", ...]
        this.renderArtistList(data.artists);
    }

    renderArtistList(artists) {
        this.artistCol.innerHTML = '';

        if (!artists || !Array.isArray(artists)) {
            console.error("Invalid artist data format");
            return;
        }

        artists.forEach(artistName => {
            const div = document.createElement('div');
            div.classList.add('column-item');

            // UPDATE: Directly use the string from the array
            div.innerText = artistName;

            div.addEventListener('click', () => {
                // Handle UI Selection
                this.artistCol.querySelectorAll('.column-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');

                // Fetch Songs
                // UPDATE: Use artistName directly
                this.currentArtist = artistName;
                this.loadSongs(artistName);
            });

            this.artistCol.appendChild(div);
        });
    }

    async loadSongs(artistName) {
        const data = await API.getSongsByArtist(artistName);
        this.renderSongList(data.songs);
    }

    renderSongList(songs) {
        this.songCol.innerHTML = '';

        if (!songs || songs.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.classList.add('column-item');
            emptyMsg.style.cursor = 'default';
            emptyMsg.innerText = "No songs found";
            this.songCol.appendChild(emptyMsg);
            return;
        }

        songs.forEach(song => {
            const div = document.createElement('div');
            div.classList.add('column-item');

            // Format duration if available
            const dur = song.duration ? `(${formatTime(song.duration, true)})` : '';

            div.innerHTML = `<span>${song.title}</span> <span style="float:right; opacity:0.6; font-size:0.8em">${dur}</span>`;

            div.addEventListener('click', () => {
                // Handle UI Selection
                this.songCol.querySelectorAll('.column-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');

                // Play Song
                this.audioPlayer.loadSong(song, this.currentArtist);
            });

            this.songCol.appendChild(div);
        });
    }

    clearSongs() {
        this.songCol.innerHTML = '<div class="column-item" style="cursor:default; color:#666;">Select an artist</div>';
    }
}
