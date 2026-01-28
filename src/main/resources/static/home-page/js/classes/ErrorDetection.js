// js/ErrorDetection.js

export class ErrorDetection {
    constructor() {
        this.WINDOW_SIZE = 50; // Frames to sum for mean calculation
        this.DEVIATION_THRESHOLD = 0.30; // 30% deviation threshold
        this.samplePitchData = null; // Reference vocal pitch data from database
        this.userPitchBuffer = []; // Circular buffer for user's pitch data
        this.errorMarkers = []; // Store error positions for visualization
        this.currentFrameIndex = 0;
        this.isEnabled = false;
    }

    /**
     * Load the reference vocal data from API
     * @param {Object} vocalData - Data returned from API.getVocalData(songId)
     */
    loadSampleData(vocalData) {
        if (!vocalData || !vocalData.pitchData) {
            console.warn("Invalid vocal data provided");
            return false;
        }

        this.samplePitchData = vocalData.pitchData;
        this.samples = vocalData.samples;
        this.fileName = vocalData.fileName;
        this.reset();
        this.isEnabled = true;

        console.log(`Loaded sample data: ${this.fileName} with ${this.samplePitchData.length} frames`);
        return true;
    }

    /**
     * Reset the error detection state
     */
    reset() {
        this.userPitchBuffer = [];
        this.errorMarkers = [];
        this.currentFrameIndex = 0;
    }

    /**
     * Calculate mean of non-zero pitch values in a window
     * @param {Array} pitchArray - Array of pitch values (in Hz)
     * @param {Number} startIndex - Start index of window
     * @param {Number} windowSize - Size of window
     */
    calculateMean(pitchArray, startIndex, windowSize) {
        const endIndex = Math.min(startIndex + windowSize, pitchArray.length);
        let sum = 0;
        let count = 0;

        for (let i = startIndex; i < endIndex; i++) {
            const pitch = pitchArray[i];
            // Only include non-zero pitch values (0 means no vocal detected)
            if (pitch > 0) {
                sum += pitch;
                count++;
            }
        }

        return count > 0 ? sum / count : 0;
    }

    /**
     * Convert MIDI pitch to frequency (Hz)
     * @param {Number} midi - MIDI note number
     */
    midiToFrequency(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    /**
     * Process new user pitch data and detect errors
     * @param {Number} midiPitch - User's current pitch in MIDI notation (from PitchMonitor)
     * @returns {Object|null} Error information if deviation detected, null otherwise
     */
    processUserPitch(midiPitch) {
        if (!this.isEnabled || !this.samplePitchData) {
            return null;
        }

        // Convert MIDI to frequency for comparison
        const userFreq = midiPitch ? this.midiToFrequency(midiPitch) : 0;

        // Add to user pitch buffer
        this.userPitchBuffer.push(userFreq);

        // Check if we have enough data for comparison
        if (this.userPitchBuffer.length < this.WINDOW_SIZE) {
            this.currentFrameIndex++;
            return null;
        }

        // Keep buffer size manageable
        if (this.userPitchBuffer.length > this.WINDOW_SIZE * 2) {
            this.userPitchBuffer.shift();
        }

        // Calculate means for both user and sample data
        const userStartIndex = Math.max(0, this.userPitchBuffer.length - this.WINDOW_SIZE);
        const sampleStartIndex = Math.max(0, this.currentFrameIndex - this.WINDOW_SIZE);

        const userMean = this.calculateMean(this.userPitchBuffer, userStartIndex, this.WINDOW_SIZE);
        const sampleMean = this.calculateMean(this.samplePitchData, sampleStartIndex, this.WINDOW_SIZE);

        this.currentFrameIndex++;

        // Only compare if both have valid pitch data
        if (userMean === 0 || sampleMean === 0) {
            return null;
        }

        // Calculate deviation percentage
        const deviation = Math.abs(userMean - sampleMean) / sampleMean;

        // Check if deviation exceeds threshold
        if (deviation > this.DEVIATION_THRESHOLD) {
            const errorInfo = {
                frameIndex: this.currentFrameIndex,
                userMean: userMean,
                sampleMean: sampleMean,
                deviation: deviation,
                deviationPercent: (deviation * 100).toFixed(1),
                timestamp: Date.now(),
                type: userMean > sampleMean ? 'too_high' : 'too_low'
            };

            this.errorMarkers.push(errorInfo);

            console.log(`Pitch error detected at frame ${errorInfo.frameIndex}: ` +
                `User=${userMean.toFixed(1)}Hz, Sample=${sampleMean.toFixed(1)}Hz, ` +
                `Deviation=${errorInfo.deviationPercent}% (${errorInfo.type})`);

            return errorInfo;
        }

        return null;
    }

    /**
     * Sync frame index with audio playback time
     * @param {Number} currentTime - Current playback time in seconds
     * @param {Number} sampleRate - Audio sample rate
     * @param {Number} hopSize - Hop size used for pitch detection (typically BUFFER_SIZE / 2)
     */
    syncWithAudioTime(currentTime, sampleRate = 44100, hopSize = 1024) {
        const totalSamples = currentTime * sampleRate;
        this.currentFrameIndex = Math.floor(totalSamples / hopSize);
    }

    /**
     * Get recent error markers for visualization
     * @param {Number} maxAge - Maximum age in milliseconds (default 5000ms)
     */
    getRecentErrors(maxAge = 5000) {
        const now = Date.now();
        return this.errorMarkers.filter(error => (now - error.timestamp) < maxAge);
    }

    /**
     * Get all error markers
     */
    getAllErrors() {
        return this.errorMarkers;
    }

    /**
     * Clear error markers older than specified time
     * @param {Number} maxAge - Maximum age in milliseconds
     */
    clearOldErrors(maxAge = 10000) {
        const now = Date.now();
        this.errorMarkers = this.errorMarkers.filter(error => (now - error.timestamp) < maxAge);
    }

    /**
     * Get statistics about detected errors
     */
    getStatistics() {
        if (this.errorMarkers.length === 0) {
            return {
                totalErrors: 0,
                avgDeviation: 0,
                maxDeviation: 0,
                tooHigh: 0,
                tooLow: 0
            };
        }

        const deviations = this.errorMarkers.map(e => e.deviation);
        const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
        const maxDeviation = Math.max(...deviations);

        return {
            totalErrors: this.errorMarkers.length,
            avgDeviation: (avgDeviation * 100).toFixed(1),
            maxDeviation: (maxDeviation * 100).toFixed(1),
            tooHigh: this.errorMarkers.filter(e => e.type === 'too_high').length,
            tooLow: this.errorMarkers.filter(e => e.type === 'too_low').length
        };
    }
}
