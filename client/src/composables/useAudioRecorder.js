import { ref, onUnmounted } from 'vue'

const audioContext = ref(null)
const scriptProcessor = ref(null)
const sourceNode = ref(null)
const isActive = ref(false)
const listeners = new Map()
let listenerIdCounter = 0

export function useAudioRecorder() {
    const start = async (audioCtx, source) => {
        if (isActive.value) {
            return registerListener()
        }

        try {
            audioContext.value = audioCtx
            sourceNode.value = source

            const node = audioCtx.createScriptProcessor(1024, 1, 1)
            scriptProcessor.value = node

            node.onaudioprocess = (e) => {
                if (!isActive.value) return
                const inputData = e.inputBuffer.getChannelData(0)

                listeners.forEach((callback) => {
                    callback(inputData, e)
                })
            }

            source.connect(node)
            node.connect(audioCtx.destination)
            isActive.value = true

            return registerListener()
        } catch (err) {
            console.error('Error starting audio recorder:', err)
            return null
        }
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

        if (scriptProcessor.value) {
            scriptProcessor.value.onaudioprocess = null
            scriptProcessor.value.disconnect()
            scriptProcessor.value = null
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
