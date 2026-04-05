// src/composables/usePitchResults.js
import { computed, onUnmounted } from 'vue'
import { encodeWAV } from '../services/wavEncoder.js'
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

export function usePitchResults(songEnded, props, offKeyEvents, rawAudioChunks, sampleRate) {

    // Store generated URLs so we can revoke them later
    const generatedUrls = []

    const pitchResults = computed(() => {
        if (!songEnded.value) return []
        const lines = Array.isArray(props.lyrics) ? props.lyrics : []
        const results = []

        for (let i = 0; i < lines.length; i++) {
            const startTs = lines[i]?.timestamp ?? 0
            const endTs = i < lines.length - 1 ? (lines[i + 1]?.timestamp ?? Infinity) : Infinity

            const eventsInLine = offKeyEvents.value.filter(e => e.timeMs >= startTs && e.timeMs < endTs)

            if (eventsInLine.length > 0) {
                const avgDev = eventsInLine.reduce((sum, e) => sum + e.deviation, 0) / eventsInLine.length
                const offKeyPercent = Math.round(avgDev * 100)

                let audioUrl = null

                // Only generate audio if deviation is > 30%
                if (offKeyPercent > 30) {
                    const lineChunks = rawAudioChunks.value.filter(c => c.timeMs >= startTs && c.timeMs < endTs)

                    if (lineChunks.length > 0) {
                        // Concatenate the chunks into one single Float32Array
                        const totalLength = lineChunks.reduce((acc, chunk) => acc + chunk.data.length, 0)
                        const combinedData = new Float32Array(totalLength)
                        let offset = 0

                        for (const chunk of lineChunks) {
                            combinedData.set(chunk.data, offset)
                            offset += chunk.data.length
                        }

                        // Encode and create a Blob URL
                        const wavBlob = encodeWAV(combinedData, sampleRate.value || 44100)
                        audioUrl = URL.createObjectURL(wavBlob)
                        generatedUrls.push(audioUrl)
                    }
                }

                results.push({
                    timeStr: `[${formatTime(startTs, true)}]`,
                    text: lines[i]?.text ?? '',
                    offKeyPercent: offKeyPercent,
                    audioUrl: audioUrl
                })
            }
        }
        return results
    })

    // Clean up Blob URLs when the component unmounts to prevent memory leaks
    const cleanupUrls = () => {
        generatedUrls.forEach(url => URL.revokeObjectURL(url))
        generatedUrls.length = 0
    }

    onUnmounted(() => {
        cleanupUrls()
    })

    return { pitchResults, cleanupUrls }
}