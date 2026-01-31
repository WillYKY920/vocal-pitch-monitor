// js/waveformGenerator.js

export class WaveformGenerator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Waveform Canvas not found:', canvasId);
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        // State
        this.audioContext = null;
        this.analyser = null;
        this.scriptProcessor = null;
        this.isRecording = false;

        this.amplitudeHistory = [];
        this.maxHistory = 400;

        this.resizeCanvas();
        this.drawGraph(); // Draw initial background
    }

    resizeCanvas() {
        const parent = this.canvas.parentElement;
        if (parent) {
            // Ensure non-zero size
            this.canvas.width = Math.max(100, parent.clientWidth - 40);
            this.canvas.height = Math.max(100, parent.clientHeight - 40);
        }
    }

    // UPDATED: Accepts context and source from AudioPlayer
    start(audioContext, sourceNode) {
        if (this.isRecording) return;
        if (!audioContext || !sourceNode) return;

        try {
            this.audioContext = audioContext;
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            const bufferSize = 2048;
            this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

            // Connect shared source -> Analyser -> Processor -> Destination (muted)
            sourceNode.connect(this.analyser);
            this.analyser.connect(this.scriptProcessor);

            // ScriptProcessor needs a destination to fire events, but we don't want feedback.
            // Connecting to destination is required in some browsers.
            // Since it's a mic, we rely on the fact that we aren't outputting the audio buffer to the speakers here,
            // or we can create a GainNode with 0 gain.
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0; // Mute feedback
            this.scriptProcessor.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            this.scriptProcessor.onaudioprocess = (event) => {
                if (!this.isRecording) return;
                const inputData = event.inputBuffer.getChannelData(0);

                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                const displayValue = Math.min(rms * 10, 1.0);

                this.amplitudeHistory.push({
                    timestamp: Date.now(),
                    value: rms,
                    display: displayValue
                });

                if (this.amplitudeHistory.length > this.maxHistory) {
                    this.amplitudeHistory.shift();
                }
                this.drawGraph();
            };

            this.isRecording = true;
        } catch (err) {
            console.error('WaveformGenerator Error:', err);
        }
    }

    stop() {
        this.isRecording = false;
        // We disconnect nodes but do NOT close the AudioContext (it's shared)
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
        }
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        // Do NOT nullify this.audioContext here as it belongs to AudioPlayer
    }

    clear() {
        this.amplitudeHistory = [];
        this.drawGraph();
    }

    drawGraph() {
        if (!this.ctx) return;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;

        this.ctx.fillStyle = '#1E1E1EFF';
        this.ctx.fillRect(0, 0, width, height);

        // Center line
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(width, centerY);
        this.ctx.stroke();

        // Recording Indicator
        this.ctx.strokeStyle = this.isRecording ? '#7C4DFF' : '#444';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(width - 4, centerY - height * 0.5);
        this.ctx.lineTo(width - 4, centerY + height * 0.5);
        this.ctx.stroke();

        if (this.amplitudeHistory.length === 0) return;

        const barColor = '#7C4DFFFF';
        const barWidth = 3;
        const gap = 2;
        const slotWidth = barWidth + gap;
        const maxBars = Math.floor(width / slotWidth);
        const startIndex = Math.max(0, this.amplitudeHistory.length - maxBars);

        this.ctx.fillStyle = barColor;
        for (let i = startIndex; i < this.amplitudeHistory.length; i++) {
            const idx = i - startIndex;
            const x = idx * slotWidth;
            const amp = this.amplitudeHistory[i].display;
            const h = amp * (height * 0.8);
            const topY = centerY - h / 2;
            this.ctx.fillRect(x, topY, barWidth, h);
        }
    }
}
