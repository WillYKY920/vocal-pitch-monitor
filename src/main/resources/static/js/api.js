// js/api.js

const BASE_URL = "http://localhost:8080";

export const API = {
    /**
     * Fetch all artists
     */
    async getArtists() {
        try {
            const response = await fetch(`${BASE_URL}/artist/all`);
            if (!response.ok) throw new Error('Failed to fetch artists');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            return { artists: [] };
        }
    },

    /**
     * Fetch songs for a specific artist
     */
    async getSongsByArtist(artistName) {
        try {
            const encodedName = encodeURIComponent(artistName);
            const response = await fetch(`${BASE_URL}/artist/${encodedName}`);
            if (!response.ok) throw new Error('Failed to fetch songs');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            return { songs: [] };
        }
    },

    /**
     * Fetch lyrics for a specific song
     */
    async getLyrics(songId) {
        try {
            const response = await fetch(`${BASE_URL}/lyrics/${songId}`);
            if (!response.ok) throw new Error('Failed to fetch lyrics');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            return { lyrics: [] };
        }
    },

    /**
     * Get the audio stream URL
     */
    getAudioStreamUrl(songId) {
        return `${BASE_URL}/play/${songId}`;
    }
};
