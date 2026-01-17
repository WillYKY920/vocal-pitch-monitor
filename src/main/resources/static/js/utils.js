// js/utils.js

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
