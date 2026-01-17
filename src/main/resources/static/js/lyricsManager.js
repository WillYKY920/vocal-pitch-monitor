// js/lyricsManager.js

export class LyricsManager {
    constructor() {
        this.container = document.querySelector('.lyrics-area');
        this.lyricsData = [];
        this.currentIndex = -1;
    }

    reset() {
        this.container.innerHTML = '<div class="lyric-line placeholder">Waiting for music...</div>';
        this.lyricsData = [];
        this.currentIndex = -1;
    }

    setLyrics(lyrics) {
        this.lyricsData = lyrics || [];
        this.currentIndex = -1;
        this.renderThreeLines(-1);
    }

    /**
     * Main Sync Function
     */
    sync(currentTimeSeconds) {
        if (!this.lyricsData.length) return;

        const currentTimeMs = currentTimeSeconds * 1000;

        // Find the index of the line that should be active right now
        let activeIndex = -1;
        for (let i = 0; i < this.lyricsData.length; i++) {
            if (currentTimeMs >= this.lyricsData[i].timestamp) {
                activeIndex = i;
            } else {
                break;
            }
        }

        // Only re-render if the line changed
        if (activeIndex !== this.currentIndex) {
            this.currentIndex = activeIndex;
            this.renderThreeLines(activeIndex);
        }
    }

    /**
     * Renders strictly 3 lines: Previous, Current (Active), Next
     */
    renderThreeLines(index) {
        this.container.innerHTML = ''; // Clear previous content

        if (this.lyricsData.length === 0) {
            this.container.innerHTML = '<div class="lyric-line placeholder">No Lyrics Found</div>';
            return;
        }

        // Define indices
        const prevIndex = index - 1;
        const currIndex = index;
        const nextIndex = index + 1;

        // 1. Render Previous Line (if exists)
        if (prevIndex >= 0) {
            this.createLyricLine(this.lyricsData[prevIndex].text, 'prev');
        } else {
            // Placeholder to keep spacing consistent if no previous line
            this.createLyricLine('', 'empty');
        }

        // 2. Render Current Line (if exists, or show start text)
        if (currIndex >= 0 && currIndex < this.lyricsData.length) {
            this.createLyricLine(this.lyricsData[currIndex].text, 'active');
        } else if (index === -1) {
            this.createLyricLine('...', 'active'); // Ready state
        }

        // 3. Render Next Line (if exists)
        if (nextIndex < this.lyricsData.length) {
            this.createLyricLine(this.lyricsData[nextIndex].text, 'next');
        } else {
            this.createLyricLine('', 'empty');
        }
    }

    createLyricLine(text, type) {
        const div = document.createElement('div');
        div.classList.add('lyric-line', type);
        div.innerText = text;
        this.container.appendChild(div);
    }
}
