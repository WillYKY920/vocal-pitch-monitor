// src/composables/usePitchMonitor.js

import { ref, shallowRef, computed, onMounted, onUnmounted, watch } from 'vue'
import { YinF0Detector } from '../algorithms/pitchDetector.js'
import { AudioFilter } from '../algorithms/audioFilter.js'
import { ErrorDetector } from '../algorithms/errorDetector.js'
import { useAudioRecorder } from './useAudioRecorder.js'
import { mapPitchesToNotes } from '../services/utils.js'
import { buildPitchErrorsPayload, downloadJson } from './usePitchExport.js'

export function usePitchCanvas(props, canvasRef) {
    // --- Export state ---
    const songEnded = ref(false)
    const exported = ref(false)
    const offKeyEvents = shallowRef([]) // [{timeMs, freq}]

    const showExport = computed(() => songEnded.value && !exported.value)

    // --- Monitor state ---
    const currentNote = ref('')
    const ctx = shallowRef(null)
    const audioFilter = shallowRef(new AudioFilter(5, 24))
    const errorDetector = shallowRef(new ErrorDetector())
    const errorMarkers = shallowRef([])

    const audioRecorder = useAudioRecorder()
    const listenerHandle = shallowRef(null)
    const isRunning = ref(false)
    const yinDetector = shallowRef(null)

    const historyData = shallowRef([])
    const maxHistoryLen = ref(0)
    const currentCenterPitch = ref(60)
    const targetCenterPitch = ref(60)
    const referencePitchData = shallowRef(null)

    const sampleRate = ref(44100)
    const hopSize = ref(512)

    const animationFrameId = ref(null)
    const lastDrawTime = ref(0)
    let latestDetectedNote = ''

    const DRAW_INTERVAL     = 16

    // --- Constants ---
    const MIN_FREQ          = 80
    const MAX_FREQ          = 1000
    const THRESHOLD         = 0.2
    const GRAPH_SPEED       = 4
    const VISIBLE_NOTE_RANGE= 32
    const MAX_HISTORY       = 1000
    const MAX_ERROR_MARKERS = 50

    // --- Handlers: audio element ---
    const handleSeek = () => {
        historyData.value.length = 0
        errorMarkers.value.length = 0
        offKeyEvents.value.length = 0
        songEnded.value = false
        exported.value = false

        latestDetectedNote = ''
        currentNote.value = ''

        audioFilter.value.reset()
        errorDetector.value.reset()
    }

    const handleEnded = () => {
        songEnded.value = true
    }

    watch(
        () => props.audioElement,
        (newEl, oldEl) => {
            if (oldEl) {
                oldEl.removeEventListener('seeking', handleSeek)
                oldEl.removeEventListener('ended', handleEnded)
            }
            if (newEl) {
                newEl.addEventListener('seeking', handleSeek)
                newEl.addEventListener('ended', handleEnded)
            }
        },
        { immediate: true }
    )

    // --- Canvas sizing ---
    const resizeCanvas = () => {
        if (!canvasRef.value) return
        const parent = canvasRef.value.parentElement
        if (parent) {
            canvasRef.value.width = parent.clientWidth
            canvasRef.value.height = parent.clientHeight
        }
        maxHistoryLen.value = MAX_HISTORY
        if (!isRunning.value) draw()
    }

    let resizeTimeout = null
    const debouncedResize = () => {
        if (resizeTimeout) clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(resizeCanvas, 150)
    }

    // --- Audio processing ---
    const processAudio = (inputData) => {
        if (!isRunning.value) return

        const currentTime = props.audioElement
            ? props.audioElement.currentTime
            : (Date.now() / 1000)

        let frequency = 0
        if (yinDetector.value) {
            frequency = yinDetector.value.estimateF0(inputData)
        }

        let smoothedPitch = null
        if (frequency > MIN_FREQ && frequency < MAX_FREQ) {
            const rawMidi = 69 + 12 * Math.log2(frequency / 440)
            smoothedPitch = audioFilter.value.process(rawMidi)
        }

        if (smoothedPitch !== null) {
            const smoothedFreq = 440 * Math.pow(2, (smoothedPitch - 69) / 12)
            latestDetectedNote = YinF0Detector.frequencyToNote(smoothedFreq)

            targetCenterPitch.value = smoothedPitch
            historyData.value.push({ val: smoothedPitch, time: currentTime, active: true })

            const error = errorDetector.value.processUserPitch(smoothedPitch, currentTime)
            if (error) {
                errorMarkers.value.push({ time: currentTime, errorInfo: error })
                if (errorMarkers.value.length > MAX_ERROR_MARKERS) errorMarkers.value.shift()

                offKeyEvents.value.push({
                    timeMs: currentTime * 1000,
                    freq: Number(smoothedFreq.toFixed(2))
                })
            }
        } else {
            if (historyData.value.length > 0 && historyData.value[historyData.value.length - 1].active) {
                latestDetectedNote = ''
            }
            historyData.value.push({ val: null, time: currentTime, active: false })
        }

        if (historyData.value.length > maxHistoryLen.value) historyData.value.shift()

        const retentionTime = 10
        if (historyData.value.length > 0 && (currentTime - historyData.value[0].time > retentionTime)) {
            historyData.value.shift()
        }

        errorDetector.value.clearOldErrors(10000)
    }

    // --- Controls ---
    const start = async (audioCtx, source) => {
        if (isRunning.value) return
        try {
            yinDetector.value = new YinF0Detector(audioCtx.sampleRate, MIN_FREQ, MAX_FREQ, THRESHOLD)

            listenerHandle.value = await audioRecorder.start(audioCtx, source)
            if (listenerHandle.value) listenerHandle.value.addListener(processAudio)

            isRunning.value = true
            lastDrawTime.value = performance.now()
            updatePitch()
        } catch (err) {
            console.error('Error starting pitch monitor:', err)
        }
    }

    const stop = () => {
        isRunning.value = false

        if (animationFrameId.value) {
            cancelAnimationFrame(animationFrameId.value)
            animationFrameId.value = null
        }

        if (listenerHandle.value) {
            listenerHandle.value.removeListener()
            listenerHandle.value = null
        }
    }

    const updatePitch = () => {
        if (!isRunning.value) return

        if (currentNote.value !== latestDetectedNote) {
            currentNote.value = latestDetectedNote
        }

        const now = performance.now()
        if (now - lastDrawTime.value >= DRAW_INTERVAL) {
            draw()
            lastDrawTime.value = now
        }

        animationFrameId.value = requestAnimationFrame(updatePitch)
    }

    // --- Drawing ---
    const draw = () => {
        if (!ctx.value || !canvasRef.value) return

        const { width, height } = canvasRef.value
        ctx.value.clearRect(0, 0, width, height)

        ctx.value.fillStyle = '#111111'
        ctx.value.fillRect(0, 0, width, height)

        const PLAYHEAD_X = width * 0.8
        const PX_PER_SEC = (sampleRate.value / hopSize.value) * GRAPH_SPEED
        const currentTime = props.audioElement
            ? props.audioElement.currentTime
            : (historyData.value.length > 0 ? historyData.value[historyData.value.length - 1].time : 0)

        currentCenterPitch.value += (targetCenterPitch.value - currentCenterPitch.value) * 0.05
        const halfRange = VISIBLE_NOTE_RANGE / 2
        const minMidi = currentCenterPitch.value - halfRange
        const maxMidi = currentCenterPitch.value + halfRange
        const range = maxMidi - minMidi
        const getY = (midiVal) => height - ((midiVal - minMidi) / range) * height

        // Grid
        ctx.value.font = '14px sans-serif'
        ctx.value.textAlign = 'left'
        ctx.value.textBaseline = 'middle'
        const startGrid = Math.floor(minMidi)
        const endGrid = Math.ceil(maxMidi)

        for (let m = startGrid; m <= endGrid; m++) {
            const gridFreq = 440 * Math.pow(2, (m - 69) / 12)
            const name = YinF0Detector.frequencyToNote(gridFreq)
            const isC = name.startsWith('C') && !name.includes('#')
            const isSharp = name.includes('#')
            const y = getY(m)

            if (!isSharp) {
                ctx.value.beginPath()
                ctx.value.moveTo(0, y)
                ctx.value.lineTo(width, y)
                ctx.value.lineWidth = isC ? 2 : 1
                ctx.value.strokeStyle = isC ? '#666' : '#333'
                ctx.value.stroke()
                ctx.value.fillStyle = isC ? '#DDD' : '#777'
                ctx.value.fillText(name, 10, y)
            }
        }

        // Reference line
        if (referencePitchData.value) {
            const frameDuration = hopSize.value / sampleRate.value
            const totalFrames = referencePitchData.value.length

            const maxVisibleOffset = (width - PLAYHEAD_X)
            const minVisibleOffset = -PLAYHEAD_X

            const startFrame = Math.floor((currentTime + (minVisibleOffset / PX_PER_SEC)) / frameDuration)
            const endFrame = Math.ceil((currentTime + (maxVisibleOffset / PX_PER_SEC)) / frameDuration)

            const clampStart = Math.max(0, startFrame)
            const clampEnd = Math.min(totalFrames - 1, endFrame)

            ctx.value.beginPath()
            ctx.value.lineWidth = 3
            ctx.value.strokeStyle = 'rgba(150, 150, 150, 0.6)'
            ctx.value.lineCap = 'round'
            ctx.value.lineJoin = 'round'
            let pathStarted = false

            for (let i = clampStart; i <= clampEnd; i++) {
                const pitch = referencePitchData.value[i]
                const frameTime = i * frameDuration

                if (pitch !== null && pitch > 0) {
                    const x = PLAYHEAD_X + (frameTime - currentTime) * PX_PER_SEC
                    const y = getY(pitch)

                    if (y >= -50 && y <= height + 50) {
                        if (!pathStarted) {
                            ctx.value.moveTo(x, y)
                            pathStarted = true
                        } else {
                            ctx.value.lineTo(x, y)
                        }
                    } else {
                        pathStarted = false
                    }
                } else {
                    pathStarted = false
                }
            }
            ctx.value.stroke()
        }

        // Error markers
        errorMarkers.value.forEach(marker => {
            const timeDiff = marker.time - currentTime
            const x = PLAYHEAD_X + (timeDiff * PX_PER_SEC)
            if (x >= 0 && x <= width) {
                ctx.value.beginPath()
                ctx.value.strokeStyle = 'rgb(60,35,128)'
                ctx.value.lineWidth = 3
                ctx.value.moveTo(x, 0)
                ctx.value.lineTo(x, height)
                ctx.value.stroke()
            }
        })

        // User pitch history
        if (historyData.value.length > 1) {
            ctx.value.beginPath()
            ctx.value.lineWidth = 4
            ctx.value.strokeStyle = '#FFFF00'
            ctx.value.lineCap = 'round'
            ctx.value.lineJoin = 'round'
            ctx.value.shadowBlur = 10
            ctx.value.shadowColor = '#FFFF00'
            let started = false

            for (let i = 0; i < historyData.value.length; i++) {
                const point = historyData.value[i]
                const timeDiff = point.time - currentTime
                const x = PLAYHEAD_X + (timeDiff * PX_PER_SEC)

                if (x > PLAYHEAD_X) continue
                if (x < -10) continue

                if (point.active && point.val !== null) {
                    const y = getY(point.val)
                    if (y < -50 || y > height + 50) {
                        started = false
                        continue
                    }
                    if (!started) {
                        ctx.value.moveTo(x, y)
                        started = true
                    } else {
                        ctx.value.lineTo(x, y)
                    }
                } else {
                    started = false
                }
            }
            ctx.value.stroke()
            ctx.value.shadowBlur = 0
        }

        // Center line
        ctx.value.beginPath()
        ctx.value.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.value.lineWidth = 1
        ctx.value.setLineDash([5, 5])
        ctx.value.moveTo(0, height / 2)
        ctx.value.lineTo(width, height / 2)
        ctx.value.stroke()
        ctx.value.setLineDash([])
    }

    // --- Export ---
    const exportJson = () => {
        const payload = buildPitchErrorsPayload(offKeyEvents.value, props.lyrics)
        const fileName = `pitch-errors-${Date.now()}.json`
        downloadJson(payload, fileName)
        exported.value = true
    }

    const reset = () => {
        stop()

        historyData.value.length = 0
        errorMarkers.value.length = 0
        offKeyEvents.value.length = 0

        songEnded.value = false
        exported.value = false

        currentNote.value = ''
        latestDetectedNote = ''

        currentCenterPitch.value = 60
        targetCenterPitch.value = 60

        audioFilter.value.reset()
        errorDetector.value.reset()

        if (ctx.value && canvasRef.value) {
            ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
            draw()
        }
    }

    // --- Load vocalData / reference line ---
    watch(() => props.vocalData, (newData) => {
        if (!newData) return

        const mappedPitches = mapPitchesToNotes(newData.pitchData)
        const processedData = { ...newData, pitchData: mappedPitches }

        if (errorDetector.value.loadSampleData(processedData)) {
            errorMarkers.value.length = 0
            referencePitchData.value = mappedPitches.map(freq => {
                if (freq > 0) return 69 + 12 * Math.log2(freq / 440)
                return null
            })
            sampleRate.value = newData.sampleRate || 44100
            hopSize.value = 512
        }
    }, { immediate: true })

    // --- Lifecycle ---
    onMounted(() => {
        if (canvasRef.value) {
            ctx.value = canvasRef.value.getContext('2d', { alpha: false })
            resizeCanvas()
            window.addEventListener('resize', debouncedResize)
        }
    })

    onUnmounted(() => {
        window.removeEventListener('resize', debouncedResize)
        if (resizeTimeout) clearTimeout(resizeTimeout)

        stop()

        if (props.audioElement) {
            props.audioElement.removeEventListener('seeking', handleSeek)
            props.audioElement.removeEventListener('ended', handleEnded)
        }
    })

    return {
        // template state
        canvasRef,
        currentNote,
        isRunning,
        showExport,

        // actions
        start,
        stop,
        reset,
        exportJson
    }
}
