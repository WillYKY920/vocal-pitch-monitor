/**
 * An AudioWorkletProcessor that captures raw audio data from the microphone and groups it into fixed-size buffers.
 *
 * This processor accumulates the standard 128-frame audio chunks provided by the AudioWorklet API
 * into larger, 1024-frame chunks to maintain compatibility with systems designed around the legacy
 * ScriptProcessorNode buffer sizes. Once a 1024-frame buffer is full, it sends the `Float32Array`
 * audio data back to the main thread via the `postMessage` API.
 *
 * @extends AudioWorkletProcessor
 */


class RecorderProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 1024; // Strictly match ScriptProcessor size
        this.buffer = new Float32Array(this.bufferSize);
        this.bytesWritten = 0;
    }

    /**
     * Processes incoming audio streams and accumulates them into a 1024-frame buffer.
     *
     * @param {Float32Array[][]} inputs - A 2D array of audio inputs, where `inputs[0]` is the primary audio source and `inputs[0][0]` is the first channel.
     * @param {Float32Array[][]} outputs - A 2D array of audio outputs (unused in this recorder).
     * @param {Object} parameters - An object containing audio parameter values (unused).
     * @returns {boolean} Returns `true` to keep the processor alive and actively processing audio.
     */

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input.length) return true;

        const channelData = input[0];
        if (!channelData) return true;

        // Accumulate 128-frame chunks into 1024-frame chunks
        for (let i = 0; i < channelData.length; i++) {
            this.buffer[this.bytesWritten++] = channelData[i];

            if (this.bytesWritten >= this.bufferSize) {
                this.port.postMessage({ audioData: this.buffer });
                this.buffer = new Float32Array(this.bufferSize);
                this.bytesWritten = 0;
            }
        }
        return true;
    }
}

registerProcessor('recorder-worklet', RecorderProcessor);
