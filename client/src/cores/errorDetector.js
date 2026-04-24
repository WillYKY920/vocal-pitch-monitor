/**
 * responsible for analyzing a user's live pitch against a pre-loaded reference vocal track.
 * It calculates moving averages of both the user's pitch and the reference pitch over a specific window size,
 * and flags an error if the percentage deviation exceeds a defined threshold.
 */
export class ErrorDetector {
    /**
     * Initializes the error detector with default settings for window size and deviation thresholds.
     */
    constructor() {
        this.WINDOW_SIZE = 50;
        this.DEVIATION_THRESHOLD = 0.30;
        this.samplePitchData = null;
        this.userPitchBuffer = [];
        this.errorMarkers = [];
        this.isEnabled = false;

        this.sampleRate = 44100;
        this.hopSize = 512;
    }

    /**
     * Loads reference vocal data (pitch array, sample rate) into the detector to be used as the target baseline.
     *
     * @param {Object} vocalData - An object containing `pitchData`, `samples`, `fileName`, and optionally `sampleRate`.
     * @returns {boolean} True if data was successfully loaded; otherwise false.
     */
    loadSampleData(vocalData) {
        if (!vocalData || !vocalData.pitchData) {
            console.warn("Invalid vocal data provided");
            return false;
        }

        this.samplePitchData = vocalData.pitchData;
        this.samples = vocalData.samples;
        this.fileName = vocalData.fileName;

        // Calculate sample rate if not explicitly provided
        if (vocalData.sampleRate) {
            this.sampleRate = vocalData.sampleRate;
        }

        this.reset();
        this.isEnabled = true;

        console.log(`Loaded sample data: ${this.fileName} with ${this.samplePitchData.length} frames`);
        console.log(`Duration: ${(this.samplePitchData.length * this.hopSize / this.sampleRate).toFixed(2)}s`);
        return true;
    }

    reset() {
        this.userPitchBuffer = [];
        this.errorMarkers = [];
    }

    calculateMean(pitchArray, startIndex, windowSize) {
        const endIndex = Math.min(startIndex + windowSize, pitchArray.length);
        let sum = 0;
        let count = 0;

        for (let i = startIndex; i < endIndex; i++) {
            const pitch = pitchArray[i];
            if (pitch > 0) {
                sum += pitch;
                count++;
            }
        }
        return count > 0 ? sum / count : 0;
    }

    midiToFrequency(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    /**
     * Compares the user's current pitch to the reference pitch at the exact current playback time.
     * Calculates the mean of recent pitches for both user and sample, and flags an error if the deviation is too high.
     *
     * @param {Number} midiPitch - The user's current detected pitch in MIDI note notation.
     * @param {Number} currentTime - The current playback time of the audio element in seconds.
     * @returns {Object|null} An object containing error details (deviation, frame index, type) if an error is detected, or null if within acceptable bounds.
     */
    processUserPitch(midiPitch, currentTime) {
        if (!this.isEnabled || !this.samplePitchData) {
            return null;
        }

        const currentFrameIndex = Math.floor((currentTime * this.sampleRate) / this.hopSize);

        if (currentFrameIndex >= this.samplePitchData.length) {
            console.warn(`Frame index ${currentFrameIndex} exceeds sample data length ${this.samplePitchData.length}`);
            return null;
        }
        const userFreq = midiPitch ? this.midiToFrequency(midiPitch) : 0;

        this.userPitchBuffer.push({
            freq: userFreq,
            frameIndex: currentFrameIndex,
            timestamp: Date.now()
        });

        if (this.userPitchBuffer.length > 100) {
            this.userPitchBuffer.shift();
        }

        if (this.userPitchBuffer.length < this.WINDOW_SIZE) {
            return null;
        }

        const recentUserPitches = this.userPitchBuffer
            .slice(-this.WINDOW_SIZE)
            .map(item => item.freq);

        let userSum = 0, userCount = 0;
        for (let pitch of recentUserPitches) {
            if (pitch > 0) {
                userSum += pitch;
                userCount++;
            }
        }
        const userMean = userCount > 0 ? userSum / userCount : 0;

        // Calculate sample mean from corresponding window
        const sampleStartIndex = Math.max(0, currentFrameIndex - this.WINDOW_SIZE);
        const sampleMean = this.calculateMean(this.samplePitchData, sampleStartIndex, this.WINDOW_SIZE);

        // Only compare if both have valid pitch data
        if (userMean === 0 || sampleMean === 0) {
            return null;
        }
        // Calculate deviation percentage
        const deviation = Math.abs(userMean - sampleMean) / sampleMean;

        if (deviation > this.DEVIATION_THRESHOLD) {
            const errorInfo = {
                frameIndex: currentFrameIndex,
                playbackTime: currentTime,
                userMean: userMean,
                sampleMean: sampleMean,
                deviation: deviation,
                deviationPercent: (deviation * 100).toFixed(1),
                timestamp: Date.now(),
                type: userMean > sampleMean ? 'too_high' : 'too_low'
            };

            this.errorMarkers.push(errorInfo);

            //console.log(`Pitch error at ${currentTime.toFixed(2)}s (frame ${errorInfo.frameIndex}): ` +
            //    `User=${userMean.toFixed(1)}Hz, Sample=${sampleMean.toFixed(1)}Hz, ` +
            //    `Deviation=${errorInfo.deviationPercent}% (${errorInfo.type})`);

            return errorInfo;
        }

        return null;
    }

    getRecentErrors(maxAge = 5000) {
        const now = Date.now();
        return this.errorMarkers.filter(error => (now - error.timestamp) < maxAge);
    }

    getAllErrors() {
        return this.errorMarkers;
    }

    clearOldErrors(maxAge = 10000) {
        const now = Date.now();
        this.errorMarkers = this.errorMarkers.filter(error => (now - error.timestamp) < maxAge);
    }

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
