// js/pitchMonitor.js
import { ErrorDetector } from '../../algorithms/errorDetector.js';
import { YinF0Detector } from '../../algorithms/pitchDetector.js';

export class PitchMonitor {

    constructor(canvasId = 'pitchCanvas') {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.noteDisplay = document.getElementById('note-display');
        this.errorDetector = new ErrorDetector();
        this.errorMarkers = []; // Store error positions relative to history
        this.audioElement = null; // ADD: Store reference to audio element

        this.referencePitchData = null; // Sample vocal data in MIDI
        this.sampleRate = 44100;
        this.hopSize = 512;

        // Configuration
        this.MIN_FREQ = 65; // C2 (Lower bound for detection only)
        this.MAX_FREQ = 1050; // C6 (Upper bound for detection only)
        this.BUFFER_SIZE = 2048;
        this.GRAPH_SPEED = 4;
        this.VISIBLE_RANGE_SEMITONES = 32;
        this.noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        // State
        this.audioContext = null;
        this.analyser = null;
        this.isRunning = false;

        // Pitch Detector
        this.yinDetector = null;
        this.historyData = [];
        this.maxHistoryLen = 0;

        // Camera State for scrolling
        this.currentCenterPitch = 60; // Start at Middle C (C4)
        this.targetCenterPitch = 60;

        // **NEW: Octave jump filtering**
        this.recentPitches = []; // Store recent valid pitches for median filtering
        this.medianWindowSize = 5; // Use last 5 detections
        this.maxJumpSemitones = 12; // Max allowed jump (1 octave)
        this.lastValidPitch = null;

        this.updatePitch = this.updatePitch.bind(this);
        this.resizeCanvas = this.resizeCanvas.bind(this);
        this.init();
    }

    init() {
        if (!this.canvas) return;
        window.addEventListener('resize', this.resizeCanvas);
        this.resizeCanvas();
    }

    setAudioElement(audioElement) {
        this.audioElement = audioElement;
    }

    loadSampleData(vocalData) {
        if (this.errorDetector.loadSampleData(vocalData)) {
            console.log("Sample vocal data loaded for error detection");
            this.errorMarkers = [];

            // ADD: Convert sample frequency data to MIDI for visualization
            this.referencePitchData = vocalData.pitchData.map(freq => {
                if (freq > 0) {
                    return this.frequencyToMidi(freq);
                }
                return null; // null for silence/unvoiced
            });

            // Store timing parameters
            this.sampleRate = vocalData.sampleRate || 44100;
            this.hopSize = 512; // Must match extraction

            console.log(`Loaded ${this.referencePitchData.length} reference pitch frames`);
        }
    }

    // ADD: Convert current time to frame index in reference data
    timeToFrameIndex(currentTime) {
        return Math.floor((currentTime * this.sampleRate) / this.hopSize);
    }

    // ADD: Convert frame index to x position on canvas
    frameToCanvasX(frameIndex, currentFrameIndex) {
        const frameDiff = frameIndex - currentFrameIndex;
        return this.canvas.width - (frameDiff * this.GRAPH_SPEED);
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

        this.yinDetector = new YinF0Detector(
            this.audioContext.sampleRate,
            this.MIN_FREQ,
            this.MAX_FREQ
        );

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

    frequencyToMidi(frequency) {
        return 69 + 12 * Math.log2(frequency / 440);
    }

    midiToNoteName(midi) {
        const noteIndex = Math.round(midi) % 12;
        const octave = Math.floor(Math.round(midi) / 12) - 1;
        return this.noteStrings[noteIndex] + " " + octave;
    }

// **NEW: Median filter to smooth out octave jumps**
    getMedianPitch(pitches) {
        if (pitches.length === 0) return null;
        const sorted = [...pitches].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

// **NEW: Check if pitch jump is an octave error**
    correctOctaveJump(midiFloat) {
        if (this.lastValidPitch === null) return midiFloat;

        const diff = midiFloat - this.lastValidPitch;
        const absDiff = Math.abs(diff);

        // If jump is close to 1 or 2 octaves (11-13 or 23-25 semitones), correct it
        if (absDiff >= 11 && absDiff <= 13) {
            // Likely 1-octave error
            return diff > 0 ? midiFloat - 12 : midiFloat + 12;
        } else if (absDiff >= 23 && absDiff <= 25) {
            // Likely 2-octave error
            return diff > 0 ? midiFloat - 24 : midiFloat + 24;
        }

        return midiFloat;
    }

    updatePitch() {
        if (!this.isRunning) return;

        const buffer = new Float32Array(this.analyser.fftSize);
        this.analyser.getFloatTimeDomainData(buffer);

        let frequency = 0;
        if (this.yinDetector) {
            frequency = this.yinDetector.estimateF0(buffer);
        }

        if (frequency > 0 && frequency > this.MIN_FREQ && frequency < this.MAX_FREQ) {
            let midiFloat = this.frequencyToMidi(frequency);
            midiFloat = this.correctOctaveJump(midiFloat);

            this.recentPitches.push(midiFloat);
            if (this.recentPitches.length > this.medianWindowSize) {
                this.recentPitches.shift();
            }

            const smoothedPitch = this.getMedianPitch(this.recentPitches);

            if (this.lastValidPitch === null ||
                Math.abs(smoothedPitch - this.lastValidPitch) < this.maxJumpSemitones) {

                this.lastValidPitch = smoothedPitch;

                if (this.noteDisplay) {
                    this.noteDisplay.innerText = this.midiToNoteName(smoothedPitch);
                }

                this.targetCenterPitch = smoothedPitch;
                this.historyData.push({ val: smoothedPitch, active: true });

                const currentTime = this.audioElement ? this.audioElement.currentTime : 0;
                const error = this.errorDetector.processUserPitch(smoothedPitch, currentTime);

                if (error) {
                    this.errorMarkers.push({
                        historyIndex: this.historyData.length - 1,
                        errorInfo: error
                    });
                }

            } else {
                this.historyData.push({ val: null, active: false });
            }

        } else {
            this.historyData.push({ val: null, active: false });
        }

        if (this.historyData.length > this.maxHistoryLen) {
            this.historyData.shift();
            this.errorMarkers = this.errorMarkers.map(marker => ({
                ...marker,
                historyIndex: marker.historyIndex - 1
            })).filter(marker => marker.historyIndex >= 0);
        }

        this.errorDetector.clearOldErrors(10000);

        this.draw();
        requestAnimationFrame(this.updatePitch);
    }

    draw() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Smooth Camera Movement
        this.currentCenterPitch += (this.targetCenterPitch - this.currentCenterPitch) * 0.05;

        const halfRange = this.VISIBLE_RANGE_SEMITONES / 2;
        const minMidi = this.currentCenterPitch - halfRange;
        const maxMidi = this.currentCenterPitch + halfRange;
        const range = maxMidi - minMidi;

        const getY = (midiVal) => {
            return this.canvas.height - ((midiVal - minMidi) / range) * this.canvas.height;
        };

        // Draw Grid
        this.ctx.font = "14px sans-serif";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "middle";

        const startGrid = Math.floor(minMidi);
        const endGrid = Math.ceil(maxMidi);

        for (let m = startGrid; m <= endGrid; m++) {
            const name = this.midiToNoteName(m);
            const isC = name.startsWith("C ");
            const isSharp = name.includes("#");
            const y = getY(m);

            if (!isSharp) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);

                if (isC) {
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeStyle = "#666";
                } else {
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeStyle = "#333";
                }

                this.ctx.stroke();
                this.ctx.fillStyle = isC ? "#DDD" : "#777";
                this.ctx.fillText(name, 10, y);
            }
        }

        // ADD: Draw reference pitch line (grey) - BEFORE user trace
        if (this.referencePitchData && this.audioElement) {
            const currentTime = this.audioElement.currentTime;
            const currentFrameIndex = this.timeToFrameIndex(currentTime);

            // Show reference data aligned with history (scrolling right to left)
            const framesToShow = this.maxHistoryLen;

            this.ctx.beginPath();
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = "rgba(150, 150, 150, 0.6)";
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";

            let pathStarted = false;

            // Draw from right (current) to left (past)
            for (let i = 0; i < framesToShow; i++) {
                // Calculate which frame in reference data to show
                const refFrameIndex = currentFrameIndex - i;

                // Skip if out of bounds
                if (refFrameIndex < 0 || refFrameIndex >= this.referencePitchData.length) {
                    pathStarted = false;
                    continue;
                }

                const pitch = this.referencePitchData[refFrameIndex];

                if (pitch !== null && pitch > 0) {
                    // x position matches user pitch trace: right edge minus offset
                    const x = this.canvas.width - (i * this.GRAPH_SPEED);
                    const y = getY(pitch);

                    // Only draw if within visible range
                    if (y >= -50 && y <= this.canvas.height + 50 && x >= -10 && x <= this.canvas.width + 10) {
                        if (!pathStarted) {
                            this.ctx.moveTo(x, y);
                            pathStarted = true;
                        } else {
                            this.ctx.lineTo(x, y);
                        }
                    } else {
                        pathStarted = false;
                    }
                } else {
                    pathStarted = false;
                }
            }

            this.ctx.stroke();
        }

        // Draw error markers (red vertical lines)
        this.errorMarkers.forEach(marker => {
            const historyPosition = this.historyData.length - 1 - marker.historyIndex;
            const x = this.canvas.width - (historyPosition * this.GRAPH_SPEED);

            if (x >= 0 && x <= this.canvas.width) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
                this.ctx.lineWidth = 3;
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }
        });

        // Draw user's pitch trace (yellow) - ON TOP
        if (this.historyData.length > 1) {
            this.ctx.beginPath();
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = "#FFFF00";
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = "#FFFF00";

            let started = false;

            for (let i = 0; i < this.historyData.length; i++) {
                const point = this.historyData[this.historyData.length - 1 - i];
                const x = this.canvas.width - (i * this.GRAPH_SPEED);

                if (x < -10) break;

                if (point.active) {
                    const y = getY(point.val);

                    if (y < -50 || y > this.canvas.height + 50) {
                        if (started) started = false;
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
                    started = false;
                }
            }

            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }

        // Draw center indicator
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

