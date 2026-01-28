/**
 * YIN Algorithm Implementation for F0 Detection in JavaScript
 *
 * Optimizations:
 * 1. Difference Function: Uses FFT to calculate autocorrelation in O(N log N)
 * 2. Normalization: Uses prefix-sum approach for O(N)
 * 3. Compatible with Web Audio API and Node.js
 *
 * Reference:
 * de Cheveigné, A., & Kawahara, H. (2002).
 * "YIN, a fundamental frequency estimator for speech and music."
 * The Journal of the Acoustical Society of America, 111(4), 1917-1930.
 */

class YinF0Detector {

    /**
     * Default parameters optimized for vocal pitch detection (80Hz - 1000Hz)
     */
    static DEFAULT_MIN_F0 = 80.0;
    static DEFAULT_MAX_F0 = 1000.0;
    static DEFAULT_THRESHOLD = 0.1; // Absolute threshold for dip picking
    static DEFAULT_SAMPLE_RATE = 16000;

    /**
     * Creates a new YinF0Detector instance
     * @param {number} sampleRate - Sample rate in Hz (default: 16000)
     * @param {number} minF0      - Minimum F0 frequency in Hz (default: 80)
     * @param {number} maxF0      - Maximum F0 frequency in Hz (default: 1000)
     * @param {number} threshold  - Threshold for dip picking (default: 0.1)
     */
    constructor(sampleRate = YinF0Detector.DEFAULT_SAMPLE_RATE,
                minF0 = YinF0Detector.DEFAULT_MIN_F0,
                maxF0 = YinF0Detector.DEFAULT_MAX_F0,
                threshold = YinF0Detector.DEFAULT_THRESHOLD) {
        this.sampleRate = sampleRate;
        this.minF0 = minF0;
        this.maxF0 = maxF0;
        this.threshold = threshold;

        // Validate parameters
        if (sampleRate <= 0) throw new Error('Sample rate must be positive');
        if (minF0 <= 0 || maxF0 <= minF0) throw new Error('Invalid frequency range');
        if (threshold < 0 || threshold > 1) throw new Error('Threshold must be between 0 and 1');
    }

    /**
     * Estimates the fundamental frequency (F0) of an audio frame
     * @param {Float32Array|Float64Array|Array} frame - The input audio buffer (PCM data)
     * @returns {number} The detected frequency in Hz, or 0.0 if no pitch is detected
     */
    estimateF0(frame) {
        if (!frame || frame.length < 2) return 0.0;

        const frameLength = frame.length;
        const minLag = Math.max(1, Math.floor(this.sampleRate / this.maxF0));
        const maxLag = Math.min(Math.floor(frameLength / 2), Math.floor(this.sampleRate / this.minF0));

        if (minLag >= maxLag) return 0.0;

        // Step 1 & 2: Calculate CMNDF using FFT Optimization
        const cmndf = this.computeCMNDF(frame, minLag, maxLag);

        // Step 3: Absolute Threshold Search
        const bestLag = this.findBestLag(cmndf, minLag, maxLag);

        if (bestLag > 0) {
            // Step 4: Parabolic Interpolation for sub-sample precision
            const refinedLag = this.parabolicInterpolation(cmndf, bestLag);
            const f0 = this.sampleRate / refinedLag;

            if (f0 >= this.minF0 && f0 <= this.maxF0) {
                return f0;
            }
        }

        return 0.0;
    }

    /**
     * Computes the Cumulative Mean Normalized Difference Function (CMNDF)
     * OPTIMIZATION: Uses FFT for difference function calculation (O(N log N))
     * and prefix sums for normalization (O(N))
     * @private
     */
    computeCMNDF(frame, minLag, maxLag) {
        const cmndfLength = maxLag - minLag + 1;
        const cmndf = new Float64Array(cmndfLength);

        // 1. Calculate Squared Difference Function using FFT
        const diff = this.computeDifferenceFunction(frame, maxLag);

        // 2. Calculate CMNDF using Cumulative Sum (Prefix Sum)
        let runningSum = 0.0;
        diff[0] = 1; // Avoid div by zero

        for (let tau = 1; tau <= maxLag; tau++) {
            runningSum += diff[tau];
            if (tau >= minLag) {
                // Formula: d'(tau) = d(tau) / [(1/tau) * sum(d(j))]
                const mean = runningSum / tau;
                const index = tau - minLag;
                if (mean < 1e-10) {
                    cmndf[index] = 1.0;
                } else {
                    cmndf[index] = diff[tau] / mean;
                }
            }
        }

        return cmndf;
    }

    /**
     * Calculates the Squared Difference Function d(tau) using FFT
     * d(tau) = sum(x[j]^2) + sum(x[j+tau]^2) - 2 * sum(x[j]*x[j+tau])
     * @private
     */
    computeDifferenceFunction(frame, maxLag) {
        const len = frame.length;

        // 1. Calculate power sums (prefix sum of squares)
        // powerSum[k] = sum_{i=0}^{k-1} x[i]^2
        const powerSum = new Float64Array(len + 1);
        powerSum[0] = 0.0;
        for (let i = 0; i < len; i++) {
            powerSum[i + 1] = powerSum[i] + frame[i] * frame[i];
        }

        // 2. Calculate Autocorrelation using FFT
        // Find next power of 2 >= 2*len to avoid circular convolution aliasing
        let fftSize = 1;
        while (fftSize < len * 2) {
            fftSize <<= 1;
        }

        // Pad with zeros
        const padded = new Float64Array(fftSize);
        for (let i = 0; i < len; i++) {
            padded[i] = frame[i];
        }

        // Perform FFT
        const fftResult = this.fft(padded);

        // Compute Power Spectrum P(f) = |X(f)|^2
        for (let i = 0; i < fftResult.length; i += 2) {
            const real = fftResult[i];
            const imag = fftResult[i + 1];
            const magnitudeSq = real * real + imag * imag;
            fftResult[i] = magnitudeSq;
            fftResult[i + 1] = 0;
        }

        // Inverse FFT to get autocorrelation
        const autocorr = this.ifft(fftResult);

        // 3. Assemble Difference Function
        const diff = new Float64Array(maxLag + 1);
        for (let tau = 1; tau <= maxLag; tau++) {
            // Term 1: sum_{j=0}^{len-1-tau} x[j]^2
            const term1 = powerSum[len - tau] - powerSum[0];

            // Term 2: sum_{j=tau}^{len-1} x[j]^2
            const term2 = powerSum[len] - powerSum[tau];

            // Term 3: Autocorrelation at lag tau
            const term3 = 2 * autocorr[tau * 2]; // Real part only

            diff[tau] = term1 + term2 - term3;

            // Fix potential floating point errors slightly below zero
            if (diff[tau] < 0) diff[tau] = 0;
        }

        return diff;
    }

    /**
     * Finds the first local minimum below the threshold
     * @private
     */
    findBestLag(cmndf, minLag, maxLag) {
        for (let i = 0; i < cmndf.length; i++) {
            if (cmndf[i] < this.threshold) {
                // Found a dip below threshold, now find the local minimum
                let bestIndex = i;
                while (bestIndex + 1 < cmndf.length && cmndf[bestIndex + 1] < cmndf[bestIndex]) {
                    bestIndex++;
                }
                return minLag + bestIndex;
            }
        }

        // Fallback: Global minimum if no threshold crossing found
        let minIndex = 0;
        let minVal = cmndf[0];
        for (let i = 1; i < cmndf.length; i++) {
            if (cmndf[i] < minVal) {
                minVal = cmndf[i];
                minIndex = i;
            }
        }

        // Reject if global minimum is still too poor (weak periodicity)
        return (minVal > 0.4) ? 0 : minLag + minIndex;
    }

    /**
     * Refines the integer lag using parabolic interpolation
     * @private
     */
    parabolicInterpolation(cmndf, bestLag) {
        const minLag = Math.floor(this.sampleRate / this.maxF0);
        const idx = bestLag - minLag;

        if (idx <= 0 || idx >= cmndf.length - 1) return bestLag;

        const y0 = cmndf[idx - 1];
        const y1 = cmndf[idx];
        const y2 = cmndf[idx + 1];

        const denom = 2 * y1 - y0 - y2;
        if (Math.abs(denom) < 1e-10) return bestLag;

        const delta = (y2 - y0) / (2 * denom);
        return bestLag + delta;
    }

    /**
     * Cooley-Tukey FFT implementation (in-place, decimation-in-time)
     * Input/Output format: [real0, imag0, real1, imag1, ...]
     * @private
     */
    fft(buffer) {
        const N = buffer.length / 2;
        if (N <= 1) return buffer;

        // Bit-reversal permutation
        for (let i = 1, j = 0; i < N; i++) {
            let bit = N >> 1;
            for (; j & bit; bit >>= 1) {
                j ^= bit;
            }
            j ^= bit;

            if (i < j) {
                // Swap complex numbers
                [buffer[i * 2], buffer[j * 2]] = [buffer[j * 2], buffer[i * 2]];
                [buffer[i * 2 + 1], buffer[j * 2 + 1]] = [buffer[j * 2 + 1], buffer[i * 2 + 1]];
            }
        }

        // Cooley-Tukey FFT
        for (let len = 2; len <= N; len <<= 1) {
            const step = N / len;
            const jump = len << 1;

            for (let i = 0; i < len; i += 2) {
                const wRe = Math.cos(-Math.PI * i / len);
                const wIm = Math.sin(-Math.PI * i / len);

                for (let j = i; j < buffer.length; j += jump) {
                    const tRe = wRe * buffer[j + len] - wIm * buffer[j + len + 1];
                    const tIm = wIm * buffer[j + len] + wRe * buffer[j + len + 1];

                    buffer[j + len] = buffer[j] - tRe;
                    buffer[j + len + 1] = buffer[j + 1] - tIm;
                    buffer[j] += tRe;
                    buffer[j + 1] += tIm;
                }
            }
        }

        return buffer;
    }

    /**
     * Inverse FFT implementation
     * @private
     */
    ifft(buffer) {
        const N = buffer.length / 2;

        // Conjugate the complex numbers
        for (let i = 1; i < buffer.length; i += 2) {
            buffer[i] = -buffer[i];
        }

        // Apply FFT
        this.fft(buffer);

        // Conjugate the complex numbers again and scale
        for (let i = 0; i < buffer.length; i += 2) {
            buffer[i] /= N;
            buffer[i + 1] = -buffer[i + 1] / N;
        }

        return buffer;
    }

    /**
     * Batch process multiple frames for F0 trajectory extraction
     * @param {Array<Float32Array>} frames - Array of audio frames
     * @returns {Array<number>} Array of F0 values
     */
    estimateF0Batch(frames) {
        return frames.map(frame => this.estimateF0(frame));
    }

    /**
     * Convert frequency to musical note
     * @param {number} frequency - Frequency in Hz
     * @returns {string} Musical note (e.g., "C4", "A#4")
     */
    static frequencyToNote(frequency) {
        if (frequency <= 0) return "";

        const A4_FREQUENCY = 440.0;
        const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        // Calculate semitones from A4
        const semitonesFromA4 = 12.0 * (Math.log(frequency / A4_FREQUENCY) / Math.log(2.0));

        // A4 is the 9th note (index 9) in the 4th octave
        let noteIndex = Math.round(semitonesFromA4) % 12;
        if (noteIndex < 0) noteIndex += 12;

        // Calculate octave
        const octave = 4 + Math.floor((Math.round(semitonesFromA4) + 9) / 12);

        return noteNames[noteIndex] + octave;
    }

    /**
     * Calculate cents deviation between two frequencies
     * @param {number} freq1 - Reference frequency in Hz
     * @param {number} freq2 - Target frequency in Hz
     * @returns {number} Deviation in cents
     */
    static calculateCentsDeviation(freq1, freq2) {
        if (freq1 <= 0 || freq2 <= 0) return 0.0;

        const ratio = freq2 / freq1;
        return 1200.0 * (Math.log(ratio) / Math.log(2.0));
    }

    /**
     * Get detector configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return {
            sampleRate: this.sampleRate,
            minF0: this.minF0,
            maxF0: this.maxF0,
            threshold: this.threshold
        };
    }

    /**
     * Update detector configuration
     * @param {Object} config - New configuration
     */
    updateConfig(config) {
        if (config.sampleRate !== undefined) this.sampleRate = config.sampleRate;
        if (config.minF0 !== undefined) this.minF0 = config.minF0;
        if (config.maxF0 !== undefined) this.maxF0 = config.maxF0;
        if (config.threshold !== undefined) this.threshold = config.threshold;
    }
}

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { YinF0Detector };
}

// For browser compatibility
if (typeof window !== 'undefined') {
    window.YinF0Detector = YinF0Detector;
}