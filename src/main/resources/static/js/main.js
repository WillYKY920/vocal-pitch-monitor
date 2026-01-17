// js/main.js
import { LyricsManager } from './lyricsManager.js';
import { AudioPlayer } from './audioPlayer.js';
import { UIManager } from './uiManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lyrics Manager
    const lyricsManager = new LyricsManager();

    // 2. Initialize Audio Player (injects lyrics manager dependency)
    const audioPlayer = new AudioPlayer(lyricsManager);

    // 3. Initialize UI Manager (injects audio player dependency)
    const uiManager = new UIManager(audioPlayer);

    console.log("Pitch Detection Monitor UI Initialized");
});
