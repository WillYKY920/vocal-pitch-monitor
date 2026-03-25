// src/composables/usePitchResults.js
import { computed } from 'vue'
import { formatTime } from '../services/utils.js'

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
