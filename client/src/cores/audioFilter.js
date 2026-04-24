/**
 * smooth raw pitch data and correct common tracking artifacts,
 * specifically octave jumps that frequently occur with the YIN pitch detection algorithm.
 */
export class AudioFilter {
    /**
     * Initializes the audio filter with settings for median smoothing and jump limits.
     *
     * @param {number} [medianWindowSize=5] - The number of recent pitch values to use when calculating the median.
     * @param {number} [maxJumpSemitones=24] - The maximum allowable jump in semitones before an anomaly is suspected or rejected.
     */
    constructor(medianWindowSize = 5, maxJumpSemitones = 24) {
        this.recentPitches = []; // Store recent valid pitches for median filtering
        this.medianWindowSize = medianWindowSize;
        this.maxJumpSemitones = maxJumpSemitones; // Increased to 24 (2 octaves)
        this.lastValidPitch = null;
    }

    /**
     * Calculates the median value from an array of pitches.
     * Useful for removing outliers in pitch detection.
     */
    getMedianPitch(pitches) {
        if (pitches.length === 0) return null;
        const sorted = [...pitches].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    /**
     * Evaluates a sudden jump in pitch to determine if it is an artificial octave error (common in YIN).
     * If the jump is exactly 1 or 2 octaves (12 or 24 semitones), it corrects the pitch back to the previous register.
     *
     * @param {number} midiFloat - The raw detected MIDI pitch value.
     * @returns {number} The corrected MIDI pitch value.
     */
    correctOctaveJump(midiFloat) {
        if (this.lastValidPitch === null) return midiFloat;

        const diff = midiFloat - this.lastValidPitch;
        const absDiff = Math.abs(diff);
        // If jump is close to 1 octave (11-13 semitones)
        if (absDiff >= 11 && absDiff <= 13) {
            return diff > 0 ? midiFloat - 12 : midiFloat + 12;
        }
        // If jump is close to 2 octaves (23-25 semitones)
        else if (absDiff >= 23 && absDiff <= 25) {
            return diff > 0 ? midiFloat - 24 : midiFloat + 24;
        }
        return midiFloat;
    }

    /**
     * Processes a raw MIDI pitch value by applying octave correction, adding it to a rolling buffer,
     * and applying a median filter to remove transient spikes/outliers.
     *
     * @param {number} midiFloat - The raw detected MIDI pitch value.
     * @returns {number|null} The smoothed MIDI pitch value, or null if the pitch jump was impossibly large (likely noise).
     */
    process(midiFloat) {
        const correctedPitch = this.correctOctaveJump(midiFloat);

        this.recentPitches.push(correctedPitch);
        if (this.recentPitches.length > this.medianWindowSize) {
            this.recentPitches.shift();
        }

        const smoothedPitch = this.getMedianPitch(this.recentPitches);

        if (this.lastValidPitch === null) {
            this.lastValidPitch = smoothedPitch;
            return smoothedPitch;
        }

        const jump = Math.abs(smoothedPitch - this.lastValidPitch);

        // If jump is reasonable (< maxJumpSemitones), accept it
        if (jump < this.maxJumpSemitones) {
            this.lastValidPitch = smoothedPitch;
            return smoothedPitch;
        }

        // If jump is huge (> 36 semitones / 3 octaves), it's likely noise - reject
        if (jump > 36) {
            return null;
        }

        return smoothedPitch;
    }

    /**
     * Resets the filter state (e.g., when silence is detected or detection restarts).
     */
    reset() {
        this.recentPitches = [];
        this.lastValidPitch = null;
    }
}
