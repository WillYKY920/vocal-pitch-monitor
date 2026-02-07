/**
 * Formats seconds or milliseconds into MM:SS string
 * @param {number} timeValue - Time in seconds or milliseconds
 * @param {boolean} isMs - If true, treats input as milliseconds
 * @returns {string} Formatted string "MM:SS"
 */
export function formatTime(timeValue, isMs = false) {
    if (!timeValue || isNaN(timeValue)) return "00:00";
    const totalSeconds = isMs ? Math.floor(timeValue / 1000) : Math.floor(timeValue);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Maps an array of raw pitch frequencies to the nearest musical note frequencies
 * within the range of E2 to C6 (Standard Equal Temperament, A4 = 440Hz).
 *
 * Zeros in the input array (representing silence or unvoiced segments) are preserved as 0.
 *
 * @param {number[]} pitchData - Array of pitch frequencies (Hz) to process.
 * @returns {number[]} A new array where each frequency is replaced by the nearest note's standard frequency.
 */
export function mapPitchesToNotes(pitchData) {

    const NOTE_REFERENCES = [
        { note: 'E2', freq: 82.41 },
        { note: 'F2', freq: 87.31 },
        { note: 'F#2', freq: 92.50 },
        { note: 'G2', freq: 98.00 },
        { note: 'G#2', freq: 103.83 },
        { note: 'A2', freq: 110.00 },
        { note: 'A#2', freq: 116.54 },
        { note: 'B2', freq: 123.47 },
        { note: 'C3', freq: 130.81 },
        { note: 'C#3', freq: 138.59 },
        { note: 'D3', freq: 146.83 },
        { note: 'D#3', freq: 155.56 },
        { note: 'E3', freq: 164.81 },
        { note: 'F3', freq: 174.61 },
        { note: 'F#3', freq: 185.00 },
        { note: 'G3', freq: 196.00 },
        { note: 'G#3', freq: 207.65 },
        { note: 'A3', freq: 220.00 },
        { note: 'A#3', freq: 233.08 },
        { note: 'B3', freq: 246.94 },
        { note: 'C4', freq: 261.63 },
        { note: 'C#4', freq: 277.18 },
        { note: 'D4', freq: 293.66 },
        { note: 'D#4', freq: 311.13 },
        { note: 'E4', freq: 329.63 },
        { note: 'F4', freq: 349.23 },
        { note: 'F#4', freq: 369.99 },
        { note: 'G4', freq: 392.00 },
        { note: 'G#4', freq: 415.30 },
        { note: 'A4', freq: 440.00 },
        { note: 'A#4', freq: 466.16 },
        { note: 'B4', freq: 493.88 },
        { note: 'C5', freq: 523.25 },
        { note: 'C#5', freq: 554.37 },
        { note: 'D5', freq: 587.33 },
        { note: 'D#5', freq: 622.25 },
        { note: 'E5', freq: 659.26 },
        { note: 'F5', freq: 698.46 },
        { note: 'F#5', freq: 739.99 },
        { note: 'G5', freq: 783.99 },
        { note: 'G#5', freq: 830.61 },
        { note: 'A5', freq: 880.00 },
        { note: 'A#5', freq: 932.33 },
        { note: 'B5', freq: 987.77 },
        { note: 'C6', freq: 1046.50 },
    ];

    return pitchData.map((pitch) => {
        // Preserve silence/unvoiced segments
        if (pitch === 0) return 0;

        // Find the closest note by comparing absolute difference
        const closest = NOTE_REFERENCES.reduce((prev, curr) => {
            return Math.abs(curr.freq - pitch) < Math.abs(prev.freq - pitch)
                ? curr
                : prev;
        });

        return closest.freq;
    });
}
