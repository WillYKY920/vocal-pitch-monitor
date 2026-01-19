// js/pitchMonitor.js

export class PitchMonitor {
    constructor(canvasId = 'pitchCanvas') {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.noteDisplay = document.getElementById('note-display');

        // Configuration
        this.MIN_FREQ = 65;   // C2
        this.MAX_FREQ = 1050; // C6
        this.BUFFER_SIZE = 2048;
        this.GRAPH_SPEED = 2;
        this.noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        // State
        this.audioContext = null;
        this.analyser = null;
        this.mediaStreamSource = null;
        this.isRunning = false;
        this.historyData = [];
        this.maxHistoryLen = 0;
        this.microphoneGranted = false;

        this.init();
    }

    init() {
        if (!this.canvas) {
            console.warn("PitchMonitor: Canvas not found.");
            return;
        }

        // Handle window resizing
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
            this.maxHistoryLen = Math.ceil(this.canvas.width / this.GRAPH_SPEED) + 1;
        }
    }

    // Public method to start monitoring
    async start() {
        if (this.isRunning) return; // Already running

        try {
            // Request microphone permission only once
            if (!this.microphoneGranted) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = this.BUFFER_SIZE;
                this.mediaStreamSource.connect(this.analyser);

                this.microphoneGranted = true;
            }

            this.isRunning = true;
            this.updatePitch(); // Start the loop
        } catch (err) {
            console.error("PitchMonitor Error:", err);
            alert("Could not access microphone. Please grant permission.");
        }
    }

    // Public method to stop monitoring
    stop() {
        this.isRunning = false;
    }

    autoCorrelate(buffer, sampleRate) {
        let SIZE = buffer.length;
        let sumOfSquares = 0;
        for (let i = 0; i < SIZE; i++) {
            let val = buffer[i];
            sumOfSquares += val * val;
        }
        let rootMeanSquare = Math.sqrt(sumOfSquares / SIZE);
        if (rootMeanSquare < 0.01) return -1;

        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
        }

        buffer = buffer.slice(r1, r2);
        SIZE = buffer.length;

        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + buffer[j] * buffer[j + i];
            }
        }

        let d = 0; while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
        }

        let T0 = maxpos;
        let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2;
        let b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    }

    frequencyToMidi(frequency) {
        return 69 + 12 * Math.log2(frequency / 440);
    }

    midiToNoteName(midi) {
        const noteIndex = Math.round(midi) % 12;
        const octave = Math.floor(Math.round(midi) / 12) - 1;
        return this.noteStrings[noteIndex] + " " + octave;
    }

    updatePitch() {
        if (!this.isRunning) return;

        const buffer = new Float32Array(this.analyser.fftSize);
        this.analyser.getFloatTimeDomainData(buffer);

        const frequency = this.autoCorrelate(buffer, this.audioContext.sampleRate);

        if (frequency !== -1 && frequency > this.MIN_FREQ && frequency < this.MAX_FREQ) {
            const midiFloat = this.frequencyToMidi(frequency);
            if(this.noteDisplay) this.noteDisplay.innerText = this.midiToNoteName(midiFloat);
            this.historyData.push({ val: midiFloat, active: true });
        } else {
            this.historyData.push({ val: null, active: false });
        }

        if (this.historyData.length > this.maxHistoryLen) this.historyData.shift();

        this.draw();
        requestAnimationFrame(() => this.updatePitch());
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const minMidi = this.frequencyToMidi(this.MIN_FREQ);
        const maxMidi = this.frequencyToMidi(this.MAX_FREQ);
        const range = maxMidi - minMidi;

        const getY = (midiVal) => {
            return this.canvas.height - ((midiVal - minMidi) / range) * this.canvas.height;
        }

        // Draw Grid
        this.ctx.font = "11px sans-serif";
        this.ctx.textAlign = "left";

        for (let m = Math.ceil(minMidi); m <= maxMidi; m++) {
            const name = this.midiToNoteName(m);
            const isC = name.startsWith("C ");
            const y = getY(m);

            if (!name.includes("#")) {
                this.ctx.strokeStyle = isC ? "#444" : "#2a2a2a";
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();

                if (isC) {
                    this.ctx.fillStyle = "#666";
                    this.ctx.fillText(name, 5, y - 2);
                }
            }
        }

        // Draw Trace
        if (this.historyData.length > 1) {
            this.ctx.beginPath();
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = "#7C4DFF";
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = "#7C4DFF";

            let started = false;
            for (let i = 0; i < this.historyData.length; i++) {
                const point = this.historyData[this.historyData.length - 1 - i];
                const x = this.canvas.width - (i * this.GRAPH_SPEED);
                if (x < -10) break;

                if (point.active) {
                    const y = getY(point.val);
                    if (!started) {
                        this.ctx.moveTo(x, y);
                        started = true;
                    } else {
                        const nextPoint = this.historyData[this.historyData.length - i];
                        if (nextPoint && nextPoint.active) {
                            this.ctx.lineTo(x, y);
                        } else {
                            this.ctx.moveTo(x, y);
                        }
                    }
                }
            }
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
    }
}
