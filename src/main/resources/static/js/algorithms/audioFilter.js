/**
 * AudioFilter.js
 * Handles pitch smoothing and octave error correction.
 */

export class AudioFilter {
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
     * Checks if a pitch jump is likely an octave error (common in YIN algorithm)
     * and corrects it to the nearest likely true pitch based on history.
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
     * Main processing method.
     * Takes a raw MIDI value, applies octave correction and median smoothing.
     * Returns the smoothed pitch if valid, or null if the jump is too large/invalid.
     */
    process(midiFloat) {
        // 1. Correct potential octave errors
        const correctedPitch = this.correctOctaveJump(midiFloat);

        // 2. Add to smoothing buffer
        this.recentPitches.push(correctedPitch);
        if (this.recentPitches.length > this.medianWindowSize) {
            this.recentPitches.shift();
        }

        // 3. Apply median filter
        const smoothedPitch = this.getMedianPitch(this.recentPitches);

        // 4. Relaxed validation: allow larger jumps or reset if gap is huge
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

        // For jumps between 24-36 semitones, accept but don't update lastValidPitch
        // This allows the visualization to continue without enforcing strict continuity
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
