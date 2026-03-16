class RecorderProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 1024; // Strictly match ScriptProcessor size
        this.buffer = new Float32Array(this.bufferSize);
        this.bytesWritten = 0;
    }

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
