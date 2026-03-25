// src/composables/usePitchResults.js
import { computed } from 'vue'
import { formatTime } from '../services/utils.js'
/**
 *
 * computes the average pitch deviation for each line of lyrics based on recorded
 * off-key events. It maps the events to specific lyric lines using timestamps and returns
 * an array of formatted results only for the lines where pitch deviations occurred.
 * The results are only evaluated once the song has ended.
 *
 * @param {import('vue').Ref<boolean>} songEnded - A reactive reference indicating whether the song has finished playing.
 * @param {Object} props - The component properties.
 * @param {Array<{timestamp: number, text: string}>} [props.lyrics] - An array of lyric objects containing timestamps (in milliseconds) and text.
 * @param {import('vue').Ref<Array<{timeMs: number, deviation: number}>>} offKeyEvents - A reactive reference to an array of recorded off-key events, each containing a timestamp and a deviation value.
 * @returns {{ pitchResults: import('vue').ComputedRef<Array<{timeStr: string, text: string, offKeyPercent: number}>> }} An object containing the `pitchResults` computed property.
 */

export function usePitchResults(songEnded, props, offKeyEvents) {
    const pitchResults = computed(() => {
        if (!songEnded.value) return []
        const lines = Array.isArray(props.lyrics) ? props.lyrics : []
        const results = []

        for (let i = 0; i < lines.length; i++) {
            const startTs = lines[i]?.timestamp ?? 0
            const endTs = i < lines.length - 1 ? (lines[i + 1]?.timestamp ?? Infinity) : Infinity
            const text = lines[i]?.text ?? ''

            const eventsInLine = offKeyEvents.value.filter(e => e.timeMs >= startTs && e.timeMs < endTs)

            if (eventsInLine.length > 0) {
                // Calculate average deviation for the line
                const avgDev = eventsInLine.reduce((sum, e) => sum + e.deviation, 0) / eventsInLine.length

                // Use the utility function to format the timestamp (passing true because timestamps are in ms)
                const formattedTime = formatTime(startTs, true)

                results.push({
                    timeStr: `[${formattedTime}]`,
                    text: text,
                    offKeyPercent: Math.round(avgDev * 100)
                })
            }
        }
        return results
    })

    return { pitchResults }
}
