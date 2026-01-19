// js/pitchRecorder.js

export class PitchRecorder {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.scriptProcessor = null;

        this.isRecording = false;
        this.amplitudeHistory = [];
        this.maxHistory = 400; // Number of data points to display

        // Set canvas size to match container
        this.resizeCanvas();
        this.drawGraph();
    }

    resizeCanvas() {
        // Match parent container size
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth - 40;
            this.canvas.height = parent.clientHeight - 40;
        }
    }

    async start() {
        if (this.isRecording) return;

        try {
            // Setup Audio Context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Get Microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);

            // Setup Analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            // Setup Script Processor
            const bufferSize = 2048;
            this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

            // Connect: Mic -> Analyser -> ScriptProcessor -> Destination
            this.microphone.connect(this.analyser);
            this.analyser.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination);

            // Process audio frames
            this.scriptProcessor.onaudioprocess = (event) => {
                if (!this.isRecording) return;

                const inputData = event.inputBuffer.getChannelData(0);

                // Calculate RMS (Root Mean Square)
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);

                // Scale for visibility (RMS is typically 0.01 - 0.5)
                const displayValue = Math.min(rms * 10, 1.0);

                // Store in history
                this.amplitudeHistory.push({
                    timestamp: Date.now(),
                    value: rms,
                    display: displayValue
                });

                // Keep size manageable
                if (this.amplitudeHistory.length > this.maxHistory) {
                    this.amplitudeHistory.shift();
                }

                this.drawGraph();
            };

            this.isRecording = true;
            console.log('Pitch recording started');

        } catch (err) {
            console.error('Microphone access error:', err);
            alert('Cannot access microphone. Please allow microphone permission.');
        }
    }

    stop() {
        this.isRecording = false;

        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
        }

        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }

        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        console.log('Pitch recording stopped');
    }

    clear() {
        this.amplitudeHistory = [];
        this.drawGraph();
    }

    drawGraph() {
        const width  = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;

        // Background
        this.ctx.fillStyle = '#1E1E1EFF';
        this.ctx.fillRect(0, 0, width, height);

        // Optional center line
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(width, centerY);
        this.ctx.stroke();

        this.ctx.strokeStyle = this.isRecording ? '#7C4DFF' : '#444';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round'; // Rounded ends for the line too
        this.ctx.beginPath();
        this.ctx.moveTo(width - 4, centerY - height * 0.5);
        this.ctx.lineTo(width - 4, centerY + height * 0.5);
        this.ctx.stroke();

        if (this.amplitudeHistory.length === 0) return;


        const barColor   = '#7C4DFFFF';
        const barWidth   = 3;           // thickness of each bar
        const gap        = 2;           // gap between bars
        const slotWidth  = barWidth + gap;
        const maxBars    = Math.floor(width / slotWidth);
        const startIndex = Math.max(0, this.amplitudeHistory.length - maxBars);

        // Draw vertical bars (historical waveform)
        this.ctx.fillStyle = barColor;

        for (let i = startIndex; i < this.amplitudeHistory.length; i++) {
            const idx   = i - startIndex;
            const x     = idx * slotWidth;
            const amp   = this.amplitudeHistory[i].display;   // 0..1
            const h     = amp * (height * 0.8);               // 80% of canvas height
            const topY  = centerY - h / 2;

            this.ctx.fillRect(x, topY, barWidth, h);
        }
    }

    exportData() {
        if (this.amplitudeHistory.length === 0) {
            alert('No data to export');
            return;
        }

        const dataStr = "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(this.amplitudeHistory));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "pitch_data.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }
}
