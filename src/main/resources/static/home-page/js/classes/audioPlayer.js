// js/audioPlayer.js
import { API } from '../api.js';
import { formatTime } from './utils.js';
import { WaveformGen } from './waveformGen.js';
import { PitchMonitor } from "./pitchMonitor.js";

export class AudioPlayer {
    constructor(lyricsManager) {
        this.audio = new Audio();
        this.lyricsManager = lyricsManager;

        // Visualizers
        this.waveformGen = new WaveformGen('waveformCanvas');
        this.pitchMonitor = new PitchMonitor('pitchCanvas');

        // Shared Audio Context State
        this.audioContext = null;
        this.micStreamNode = null;

        // UI Elements
        this.playBtn = document.querySelector('.play-btn');
        this.progressBarContainer = document.querySelector('.progress-bar-container');
        this.progressFill = document.querySelector('.progress-fill');
        this.volumeContainer = document.querySelector('.volume-control');
        this.volumeBar = document.querySelector('.volume-bar');
        this.volumeFill = document.querySelector('.volume-fill');
        this.trackTitle = document.querySelector('.track-info h4');
        this.trackArtist = document.querySelector('.track-info span');

        this.currentTimeEl = document.querySelector('.time-current');
        this.durationEl = document.querySelector('.time-duration');

        if (!this.currentTimeEl) {
            this.createTimeLabels();
        }

        this.isPlaying = false;
        this.initializeEvents();
    }

    createTimeLabels() {
        const rowContainer = document.createElement('div');
        rowContainer.className = 'progress-row';
        rowContainer.style.display = 'flex';
        rowContainer.style.alignItems = 'center';
        rowContainer.style.gap = '10px';
        rowContainer.style.marginBottom = '15px';
        rowContainer.style.width = '100%';

        this.currentTimeEl = document.createElement('span');
        this.currentTimeEl.innerText = "00:00";
        this.currentTimeEl.style.fontSize = '0.8rem';
        this.currentTimeEl.style.color = '#B0B0B0';
        this.currentTimeEl.style.minWidth = '35px';

        this.durationEl = document.createElement('span');
        this.durationEl.innerText = "00:00";
        this.durationEl.style.fontSize = '0.8rem';
        this.durationEl.style.color = '#B0B0B0';
        this.durationEl.style.minWidth = '35px';

        if (this.progressBarContainer && this.progressBarContainer.parentNode) {
            const parent = this.progressBarContainer.parentNode;
            parent.insertBefore(rowContainer, this.progressBarContainer);
            rowContainer.appendChild(this.currentTimeEl);
            rowContainer.appendChild(this.progressBarContainer);
            rowContainer.appendChild(this.durationEl);
            this.progressBarContainer.style.flex = '1';
            this.progressBarContainer.style.marginBottom = '0';
        }
    }

    initializeEvents() {
        if(this.playBtn) {
            this.playBtn.addEventListener('click', () => this.togglePlay());
        }

        document.addEventListener('keydown', (e) => {
            // Prevent triggering if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.code) {
                case 'Space':
                    e.preventDefault(); // Prevents page scrolling when pressing space
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    // Rewind 5s, ensuring we don't go below 0
                    this.audio.currentTime = Math.max(0, this.audio.currentTime - 5);
                    break;
                case 'ArrowRight':
                    // Forward 5s, ensuring we don't exceed duration
                    if (isFinite(this.audio.duration)) {
                        this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 5);
                    }
                    break;
            }
        });

        this.audio.addEventListener('timeupdate', () => this.handleTimeUpdate());
        this.audio.addEventListener('loadedmetadata', () => {
            if (isFinite(this.audio.duration)) {
                this.durationEl.innerText = formatTime(this.audio.duration);
            }
        });
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.progressFill.style.width = '0%';

            // Stop visualizers
            this.waveformGen.stop();
            this.pitchMonitor.stop();
        });

        if(this.progressBarContainer) {
            this.progressBarContainer.addEventListener('mousedown', (e) => this.seek(e));
        }
        if(this.volumeBar) {
            this.volumeBar.addEventListener('click', (e) => this.adjustVolume(e));
        }
    }

    // --- SHARED AUDIO SETUP ---
    async initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        if (!this.micStreamNode) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.micStreamNode = this.audioContext.createMediaStreamSource(stream);
            } catch (err) {
                console.error("Microphone access failed:", err);
                alert("Please enable microphone access for visualizers.");
                return null;
            }
        }
        return { context: this.audioContext, source: this.micStreamNode };
    }

    async loadSong(song, artistName) {
        this.trackTitle.innerText = song.title || "Unknown Title";
        this.trackArtist.innerText = artistName || "Unknown Artist";

        this.lyricsManager.reset();
        this.waveformGen.clear();
        this.pitchMonitor.stop();

        this.audio.src = API.getAudioStreamUrl(song.id);
        this.audio.load();

        const lyricsResponse = await API.getLyrics(song.id);
        if(lyricsResponse && lyricsResponse.lyrics) {
            this.lyricsManager.setLyrics(lyricsResponse.lyrics);
        }

        this.play();
    }

    async play() {
        try {
            await this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();

            // Initialize shared audio and start both visualizers
            const audioSetup = await this.initAudioContext();
            if (audioSetup) {
                this.waveformGen.start(audioSetup.context, audioSetup.source);
                this.pitchMonitor.start(audioSetup.context, audioSetup.source);
            }
        } catch (err) {
            console.warn('Play blocked or failed:', err);
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();

        this.waveformGen.stop();
        this.pitchMonitor.stop();
    }

    togglePlay() {
        if (!this.audio.src) return;
        if (this.isPlaying) this.pause();
        else this.play();
    }

    updatePlayButton() {
        if (!this.playBtn) return;
        this.playBtn.innerHTML = this.isPlaying
            ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
            : `<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>`;
    }

    handleTimeUpdate() {
        const current = this.audio.currentTime;
        const duration = this.audio.duration;
        if(this.currentTimeEl) this.currentTimeEl.innerText = formatTime(current);
        if (isFinite(duration) && duration > 0) {
            const percent = (current / duration) * 100;
            if(this.progressFill) this.progressFill.style.width = `${percent}%`;
        }
        if(this.lyricsManager) this.lyricsManager.sync(current);
    }

    seek(e) {
        e.preventDefault();
        if (!this.audio.src || !isFinite(this.audio.duration)) return;
        const rect = this.progressBarContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        this.audio.currentTime = percentage * this.audio.duration;
    }

    adjustVolume(e) {
        const rect = this.volumeBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        let percentage = Math.max(0, Math.min(1, clickX / rect.width));
        this.audio.volume = percentage;
        if(this.volumeFill) this.volumeFill.style.width = `${percentage * 100}%`;
    }
}
