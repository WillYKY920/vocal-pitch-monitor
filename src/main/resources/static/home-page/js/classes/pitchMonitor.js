// js/pitchMonitor.js

export class PitchMonitor {
    constructor(canvasId = 'pitchCanvas') {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.noteDisplay = document.getElementById('note-display');

        // Configuration
        this.MIN_FREQ = 65;   // C2 (Lower bound for detection only)
        this.MAX_FREQ = 1050; // C6 (Upper bound for detection only)
        this.BUFFER_SIZE = 2048;
        this.GRAPH_SPEED = 4; // Increased speed for better flow
        this.VISIBLE_RANGE_SEMITONES = 32; // View height (1.5 octaves) - Makes rows taller

        this.noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        // State
        this.audioContext = null;
        this.analyser = null;
        this.isRunning = false;

        this.historyData = [];
        this.maxHistoryLen = 0;

        // Camera State for scrolling
        this.currentCenterPitch = 60; // Start at Middle C (C4)
        this.targetCenterPitch = 60;

        this.updatePitch = this.updatePitch.bind(this);
        this.resizeCanvas = this.resizeCanvas.bind(this);

        this.init();
    }

    init() {
        if (!this.canvas) return;
        window.addEventListener('resize', this.resizeCanvas);
        this.resizeCanvas();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
        }
        this.maxHistoryLen = Math.ceil(this.canvas.width / this.GRAPH_SPEED) + 1;
        if (!this.isRunning) this.draw();
    }

    start(audioContext, sourceNode) {
        if (this.isRunning) return;
        if (!audioContext || !sourceNode) return;

        this.audioContext = audioContext;
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.BUFFER_SIZE;

        sourceNode.connect(this.analyser);

        this.isRunning = true;
        this.updatePitch();
    }

    stop() {
        this.isRunning = false;
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
    }

    autoCorrelate(buffer, sampleRate) {
        let SIZE = buffer.length;
        let sumOfSquares = 0;
        for (let i = 0; i < SIZE; i++) {
            sumOfSquares += buffer[i] * buffer[i];
        }
        let rms = Math.sqrt(sumOfSquares / SIZE);
        if (rms < 0.01) return -1;

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
            if (this.noteDisplay) this.noteDisplay.innerText = this.midiToNoteName(midiFloat);

            // Update target to center this note
            this.targetCenterPitch = midiFloat;

            this.historyData.push({ val: midiFloat, active: true });
        } else {
            this.historyData.push({ val: null, active: false });
        }

        if (this.historyData.length > this.maxHistoryLen) this.historyData.shift();
        this.draw();
        requestAnimationFrame(this.updatePitch);
    }

    draw() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // --- Smooth Camera Movement ---
        // Lerp current center towards target (0.05 is the smoothing factor)
        // If no note is detected, we stay at the last known pitch
        this.currentCenterPitch += (this.targetCenterPitch - this.currentCenterPitch) * 0.05;

        // Calculate visible bounds based on dynamic center
        const halfRange = this.VISIBLE_RANGE_SEMITONES / 2;
        const minMidi = this.currentCenterPitch - halfRange;
        const maxMidi = this.currentCenterPitch + halfRange;
        const range = maxMidi - minMidi;

        // Function to map MIDI value to Y position
        const getY = (midiVal) => {
            return this.canvas.height - ((midiVal - minMidi) / range) * this.canvas.height;
        };

        // --- Draw Grid ---
        this.ctx.font = "14px sans-serif";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "middle";

        // We extend the loop slightly beyond view to ensure lines entering/leaving don't pop
        const startGrid = Math.floor(minMidi);
        const endGrid = Math.ceil(maxMidi);

        for (let m = startGrid; m <= endGrid; m++) {
            const name = this.midiToNoteName(m);
            const isC = name.startsWith("C "); // C notes
            const isSharp = name.includes("#");
            const y = getY(m);

            // Don't draw sharps as lines to keep it clean, only naturals
            if (!isSharp) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);

                // Style
                if (isC) {
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeStyle = "#666"; // Brighter for C
                } else {
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeStyle = "#333"; // Dim for others
                }
                this.ctx.stroke();

                // Labels
                this.ctx.fillStyle = isC ? "#DDD" : "#777";
                this.ctx.fillText(name, 10, y);
            }
        }

        // --- Draw Trace ---
        if (this.historyData.length > 1) {
            this.ctx.beginPath();
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = "#FFFF00"; // Yellow
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";
            // Glow effect
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = "#FFFF00";

            let started = false;

            for (let i = 0; i < this.historyData.length; i++) {
                // historyData is old -> new. Loop backwards to draw right -> left
                const point = this.historyData[this.historyData.length - 1 - i];
                const x = this.canvas.width - (i * this.GRAPH_SPEED);

                if (x < -10) break; // Off screen

                if (point.active) {
                    const y = getY(point.val);

                    // Don't draw if point is way off screen (optimization)
                    // but allow some buffer so lines don't clip abruptly
                    if (y < -50 || y > this.canvas.height + 50) {
                        if (started) started = false; // Break line if we go way off
                        continue;
                    }

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
                } else {
                    started = false; // Break line on silence
                }
            }
            this.ctx.stroke();

            // Reset shadow
            this.ctx.shadowBlur = 0;

            // Draw "Current Note" indicator line in the center
            this.ctx.beginPath();
            this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            this.ctx.moveTo(0, this.canvas.height / 2);
            this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }
}
