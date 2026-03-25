// src/composables/useAudioRecorder.js
import { ref } from 'vue'
import workletUrl from '../services/recorderWorklet.js?url'

const audioContext = ref(null)
const workletNode = ref(null)
const sourceNode = ref(null)
const isActive = ref(false)
const listeners = new Map()
let listenerIdCounter = 0
let initPromise = null

export function useAudioRecorder() {
    const start = async (audioCtx, source) => {
        if (isActive.value) {
            return registerListener()
        }

        if (initPromise) {
            await initPromise
            return registerListener()
        }

        initPromise = (async () => {
            try {
                audioContext.value = audioCtx
                sourceNode.value = source

                await audioCtx.audioWorklet.addModule(workletUrl)

                const node = new AudioWorkletNode(audioCtx, 'recorder-worklet')
                workletNode.value = node

                node.port.onmessage = (e) => {
                    if (!isActive.value) return
                    const inputData = e.data.audioData

                    listeners.forEach((callback) => {
                        callback(inputData, e)
                    })
                }

                source.connect(node)
                node.connect(audioCtx.destination)
                isActive.value = true
            } catch (err) {
                console.error('Error starting audio recorder:', err)
            }
        })()

        await initPromise
        initPromise = null

        if (!isActive.value) return null

        return registerListener()
    }

    const registerListener = () => {
        const id = listenerIdCounter++

        const addListener = (callback) => {
            listeners.set(id, callback)
        }

        const removeListener = () => {
            listeners.delete(id)
            if (listeners.size === 0) {
                stop()
            }
        }

        return { addListener, removeListener, isActive }
    }

    const stop = () => {
        isActive.value = false
        listeners.clear()

        if (workletNode.value) {
            workletNode.value.port.onmessage = null
            workletNode.value.disconnect()
            workletNode.value = null
        }

        if (sourceNode.value) {
            sourceNode.value = null
        }
    }

    return {
        start,
        stop,
        isActive
    }
}
