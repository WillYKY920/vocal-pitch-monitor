// composables/useWaveformVisualizer.js
import { ref, onMounted, onUnmounted } from 'vue'
import { useAudioRecorder } from './useAudioRecorder.js'
/**
 * A Vue composable that renders a real-time amplitude waveform visualization on an HTML5 canvas.
 * It connects to the `useAudioRecorder` composable to receive raw audio data, calculates the
 * Root Mean Square (RMS) to determine volume, and draws scrolling vertical bars representing audio intensity.
 *
 * @param {import('vue').Ref<HTMLCanvasElement|null>} canvasRef - A Vue ref pointing to the target HTML5 canvas element.
 * @returns {Object} State and control methods including `isRecording`, `start`, `stop`, `clear`, and `reset`.
 */
export function useWaveformCanvas(canvasRef) {
    const ctx = ref(null)
    const isRecording = ref(false)
    const amplitudeHistory = ref([])
    const maxHistory = 400
    const audioRecorder = useAudioRecorder()
    const listenerHandle = ref(null)

    const resizeCanvas = () => {
        const parent = canvasRef.value?.parentElement
        if (parent) {
            canvasRef.value.width = Math.max(100, parent.clientWidth - 40)
            canvasRef.value.height = Math.max(100, parent.clientHeight - 40)
        }
    }
    /**
     * Renders the amplitude history onto the canvas as a series of scrolling vertical bars.
     */
    const drawGraph = () => {
        if (!ctx.value || !canvasRef.value) return
        const width = canvasRef.value.width
        const height = canvasRef.value.height
        const centerY = height / 2

        // Background
        ctx.value.fillStyle = '#1e1e1e'
        ctx.value.fillRect(0, 0, width, height)

        // Center Line
        ctx.value.strokeStyle = '#333'
        ctx.value.lineWidth = 2
        ctx.value.beginPath()
        ctx.value.moveTo(0, centerY)
        ctx.value.lineTo(width, centerY)
        ctx.value.stroke()

        if (amplitudeHistory.value.length === 0) return

        // Bars
        const barColor = '#633CCEFF'
        const barWidth = 3
        const gap = 2
        const slotWidth = barWidth + gap
        const maxBars = Math.floor(width / slotWidth)
        const startIndex = Math.max(0, amplitudeHistory.value.length - maxBars)

        ctx.value.fillStyle = barColor
        for (let i = startIndex; i < amplitudeHistory.value.length; i++) {
            const idx = i - startIndex
            const x = idx * slotWidth
            const amp = amplitudeHistory.value[i].display
            const h = amp * (height * 0.8)
            const topY = centerY - h / 2
            ctx.value.fillRect(x, topY, barWidth, h)
        }
    }
    /**
     * Calculates the Root Mean Square (RMS) of the incoming audio buffer to determine the amplitude,
     * stores the result in a history array, and triggers a canvas redraw.
     *
     * @param {Float32Array} inputData - Raw audio sample data from the microphone.
     */
    const processAudio = (inputData) => {
        if (!isRecording.value) return

        let sum = 0
        for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i]
        }

        const rms = Math.sqrt(sum / inputData.length)
        const displayValue = Math.min(rms * 10, 1.0)

        amplitudeHistory.value.push({
            timestamp: Date.now(),
            value: rms,
            display: displayValue
        })

        if (amplitudeHistory.value.length > maxHistory) {
            amplitudeHistory.value.shift()
        }

        drawGraph()
    }

    const start = async (audioContext, sourceNode) => {
        if (isRecording.value) return
        if (!audioContext || !sourceNode) return

        try {
            listenerHandle.value = await audioRecorder.start(audioContext, sourceNode)
            if (listenerHandle.value) {
                listenerHandle.value.addListener(processAudio)
            }
            isRecording.value = true
        } catch (err) {
            console.error('WaveformGenerator Error:', err)
        }
    }

    const stop = () => {
        isRecording.value = false
        if (listenerHandle.value) {
            listenerHandle.value.removeListener()
            listenerHandle.value = null
        }
    }

    const clear = () => {
        amplitudeHistory.value = []
        drawGraph()
    }

    const reset = () => {
        clear()
    }

    // Lifecycle hooks can be safely used inside setup composables
    onMounted(() => {
        if (canvasRef.value) {
            ctx.value = canvasRef.value.getContext('2d')
            resizeCanvas()
            drawGraph()
        }
    })

    onUnmounted(() => {
        stop()
    })

    return {
        isRecording,
        start,
        stop,
        clear,
        reset
    }
}
