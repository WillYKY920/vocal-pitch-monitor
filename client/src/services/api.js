const BASE_URL = "http://localhost:8080"

export const API = {
    async getArtists() {
        try {
            const response = await fetch(`${BASE_URL}/artist/all`)
            if (!response.ok) throw new Error('Failed to fetch artists')
            return await response.json()
        } catch (error) {
            console.error("API Error:", error)
            return { artists: [] }
        }
    },

    async getSongsByArtist(artistName) {
        try {
            const encodedName = encodeURIComponent(artistName)
            const response = await fetch(`${BASE_URL}/artist/${encodedName}`)
            if (!response.ok) throw new Error('Failed to fetch songs')
            return await response.json()
        } catch (error) {
            console.error("API Error:", error)
            return { songs: [] }
        }
    },

    async getLyrics(songId) {
        try {
            const response = await fetch(`${BASE_URL}/lyrics/${songId}`)
            if (!response.ok) throw new Error('Failed to fetch lyrics')
            return await response.json()
        } catch (error) {
            console.error("API Error:", error)
            return { lyrics: [] }
        }
    },

    async getVocalData(songId) {
        try {
            const response = await fetch(`${BASE_URL}/vocal/${songId}`)
            if (!response.ok) throw new Error('Failed to fetch vocal data')
            return await response.json()
        } catch (error) {
            console.error("API Error:", error)
            return null
        }
    },

    getAudioStreamUrl(songId) {
        return `${BASE_URL}/play/${songId}`
    }
}
