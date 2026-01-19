// js/audioPlayer.js
import { API } from './api.js';
import { formatTime } from './utils.js';
import { PitchRecorder } from './pitchRecorder.js';

export class AudioPlayer {
    constructor(lyricsManager) {
        this.audio = new Audio();
        this.lyricsManager = lyricsManager;
        this.pitchRecorder = new PitchRecorder('pitchCanvas');

        // UI Elements
        this.playBtn = document.querySelector('.play-btn');
        this.progressBarContainer = document.querySelector('.progress-bar-container');
        this.progressFill = document.querySelector('.progress-fill');

        this.volumeContainer = document.querySelector('.volume-control');
        this.volumeBar = document.querySelector('.volume-bar');
        this.volumeFill = document.querySelector('.volume-fill');

        this.trackTitle = document.querySelector('.track-info h4');
        this.trackArtist = document.querySelector('.track-info span');

        // Create/Find time labels
        this.currentTimeEl = document.querySelector('.time-current');
        this.durationEl = document.querySelector('.time-duration');

        // If they don't exist in HTML yet, create them dynamically
        if (!this.currentTimeEl) {
            this.createTimeLabels();
        } // <--- THIS WAS MISSING

        this.isPlaying = false;
        this.initializeEvents();
    } // <--- THIS WAS MISSING

    createTimeLabels() {
        // 1. Create a container for the whole row
        const rowContainer = document.createElement('div');
        rowContainer.className = 'progress-row';
        rowContainer.style.display = 'flex';
        rowContainer.style.alignItems = 'center';
        rowContainer.style.gap = '10px'; // Space between text and bar
        rowContainer.style.marginBottom = '15px';
        rowContainer.style.width = '100%';

        // 2. Create Current Time
        this.currentTimeEl = document.createElement('span');
        this.currentTimeEl.innerText = "00:00";
        this.currentTimeEl.style.fontSize = '0.8rem';
        this.currentTimeEl.style.color = '#B0B0B0';
        this.currentTimeEl.style.minWidth = '35px'; // Prevent jumping

        // 3. Create Duration
        this.durationEl = document.createElement('span');
        this.durationEl.innerText = "00:00";
        this.durationEl.style.fontSize = '0.8rem';
        this.durationEl.style.color = '#B0B0B0';
        this.durationEl.style.minWidth = '35px'; // Prevent jumping

        // 4. Move the EXISTING progress bar into this row
        // We assume this.progressBarContainer exists in the DOM
        if (this.progressBarContainer && this.progressBarContainer.parentNode) {
            // Remove bar from its current place
            const parent = this.progressBarContainer.parentNode;

            // Insert the new row where the bar WAS
            parent.insertBefore(rowContainer, this.progressBarContainer);

            // Now append everything into the row
            rowContainer.appendChild(this.currentTimeEl);
            rowContainer.appendChild(this.progressBarContainer); // Move bar here
            rowContainer.appendChild(this.durationEl);

            // Update bar style to fill space
            this.progressBarContainer.style.flex = '1';
            this.progressBarContainer.style.marginBottom = '0'; // Remove old margin
        }
    }


    initializeEvents() {
        // Toggle Play/Pause
        if(this.playBtn) {
            this.playBtn.addEventListener('click', () => this.togglePlay());
        }

        // Audio Time Update
        this.audio.addEventListener('timeupdate', () => this.handleTimeUpdate());

        // Metadata loaded
        this.audio.addEventListener('loadedmetadata', () => {
            if (isFinite(this.audio.duration)) {
                this.durationEl.innerText = formatTime(this.audio.duration);
            }
        });

        // Song Ended
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.progressFill.style.width = '0%';
        });

        // Click to Seek
        if(this.progressBarContainer) {
            this.progressBarContainer.addEventListener('mousedown', (e) => this.seek(e));
        }

        // Volume
        if(this.volumeBar) {
            this.volumeBar.addEventListener('click', (e) => this.adjustVolume(e));
        }
    }

    async loadSong(song, artistName) {
        this.trackTitle.innerText = song.title || "Unknown Title";
        this.trackArtist.innerText = artistName || "Unknown Artist";

        // Reset Lyrics
        this.lyricsManager.reset();
        this.pitchRecorder.clear();

        // Set source
        this.audio.src = API.getAudioStreamUrl(song.id);
        this.audio.load();

        // Fetch Lyrics
        const lyricsResponse = await API.getLyrics(song.id);
        if(lyricsResponse && lyricsResponse.lyrics) {
            this.lyricsManager.setLyrics(lyricsResponse.lyrics);
        }

        this.play();
    }

    play() {
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
                this.updatePlayButton();

                // Start pitch recording when song plays
                this.pitchRecorder.start();
            })
            .catch(err => console.warn('Play blocked or failed:', err));
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
        this.pitchRecorder.stop();
    }

    togglePlay() {
        if (!this.audio.src) return;
        if (this.isPlaying) this.pause();
        else this.play();
    }

    updatePlayButton() {
        if (!this.playBtn) return;

        if (this.isPlaying) {
            // Pause Icon
            this.playBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                   <rect x="6" y="5" width="4" height="14" rx="1" />
                   <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>`;
        } else {
            // Play Icon
            this.playBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z"/>
                </svg>`;
        }
    }

    handleTimeUpdate() {
        const current = this.audio.currentTime;
        const duration = this.audio.duration;

        // 1. Update Time Text
        if(this.currentTimeEl) this.currentTimeEl.innerText = formatTime(current);

        // 2. Update Progress Bar Width
        if (isFinite(duration) && duration > 0) {
            const percent = (current / duration) * 100;
            if(this.progressFill) this.progressFill.style.width = `${percent}%`;
        }

        // 3. Sync Lyrics
        if(this.lyricsManager) this.lyricsManager.sync(current);
    }

    seek(e) {
        e.preventDefault();
        if (!this.audio.src || !isFinite(this.audio.duration)) return;

        const rect = this.progressBarContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        const percentage = Math.max(0, Math.min(1, clickX / width));
        this.audio.currentTime = percentage * this.audio.duration;
    }

    adjustVolume(e) {
        const rect = this.volumeBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        let percentage = clickX / width;
        percentage = Math.max(0, Math.min(1, percentage));

        this.audio.volume = percentage;
        if(this.volumeFill) this.volumeFill.style.width = `${percentage * 100}%`;
    }
}
