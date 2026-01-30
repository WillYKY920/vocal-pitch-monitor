// js/pitchMonitor.js

import { ErrorDetector } from '../../algorithms/errorDetector.js';
import { YinF0Detector } from '../../algorithms/pitchDetector.js';
import { AudioFilter } from '../../algorithms/audioFilter.js';

export class PitchMonitor {
    constructor(canvasId = 'pitchCanvas') {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.noteDisplay = document.getElementById('note-display');
        this.audioFilter = new AudioFilter(5, 24);
        this.errorDetector = new ErrorDetector();
        this.errorMarkers = []; // Store error positions relative to history
        this.audioElement = null; // ADD: Store reference to audio element
        this.referencePitchData = null; // Sample vocal data in MIDI
        this.sampleRate = 44100;
        this.hopSize = 512;

        // Configuration
        this.MIN_FREQ = 80; // Updated to match test-main.js
        this.MAX_FREQ = 1000; // Updated to match test-main.js
        this.GRAPH_SPEED = 4;
        this.VISIBLE_RANGE_SEMITONES = 32;

        // State
        this.audioContext = null;
        this.stream = null;
        this.scriptProcessor = null;
        this.sourceNode = null;
        this.isRunning = false;

        // Pitch Detector
        this.yinDetector = null;
        this.historyData = [];
        this.maxHistoryLen = 0;

        // Camera State for scrolling
        this.currentCenterPitch = 60; // Start at Middle C (C4)
        this.targetCenterPitch = 60;

        this.updatePitch = this.updatePitch.bind(this);
        this.resizeCanvas = this.resizeCanvas.bind(this);
        this.processAudio = this.processAudio.bind(this);
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
                    return 69 + 12 * Math.log2(freq / 440);
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

    async start() {
        if (this.isRunning) return;

        try {
            // Get microphone stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Create audio context
            const ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Create source from stream
            const source = ctx.createMediaStreamSource(stream);

            // Create script processor node
            const node = ctx.createScriptProcessor(2048, 1, 1);

            // Create YIN detector with parameters from test-main.js
            const yin = new YinF0Detector(ctx.sampleRate, 80, 1000, 0.15);

            // Store references
            this.audioContext = ctx;
            this.stream = stream;
            this.scriptProcessor = node;
            this.sourceNode = source;
            this.yinDetector = yin;

            // Set up audio processing callback
            node.onaudioprocess = this.processAudio;

            // Connect nodes
            source.connect(node);
            node.connect(ctx.destination);

            this.isRunning = true;

            // Start animation loop for drawing
            this.updatePitch();

        } catch (err) {
            console.error('Error starting pitch monitor:', err);
            alert('Error accessing microphone: ' + err.message);
        }
    }

    processAudio(e) {
        if (!this.isRunning) return;

        const inputData = e.inputBuffer.getChannelData(0);
        let frequency = 0;

        if (this.yinDetector) {
            frequency = this.yinDetector.estimateF0(inputData);
            console.log('Pitch Hz:', frequency > 0 ? frequency.toFixed(2) : 0);
        }

        // Default to "no pitch found" state
        let smoothedPitch = null;

        // Only attempt processing if we have a raw frequency signal
        if (frequency > 0 && frequency > this.MIN_FREQ && frequency < this.MAX_FREQ) {
            const rawMidi = 69 + 12 * Math.log2(frequency / 440);
            // SINGLE CALL: Delegate all logic to the filter
            smoothedPitch = this.audioFilter.process(rawMidi);
        }

        if (smoothedPitch !== null) {
            // Valid pitch logic
            if (this.noteDisplay) {
                const smoothedFreq = 440 * Math.pow(2, (smoothedPitch - 69) / 12);
                this.noteDisplay.innerText = YinF0Detector.frequencyToNote(smoothedFreq);
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
            // Silence/Noise logic
            this.historyData.push({ val: null, active: false });
        }

        // Cleanup history
        if (this.historyData.length > this.maxHistoryLen) {
            this.historyData.shift();
            this.errorMarkers = this.errorMarkers.map(marker => ({
                ...marker,
                historyIndex: marker.historyIndex - 1
            })).filter(marker => marker.historyIndex >= 0);
        }
        this.errorDetector.clearOldErrors(10000);
    }

    stop() {
        this.isRunning = false;

        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor.onaudioprocess = null;
            this.scriptProcessor = null;
        }

        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    updatePitch() {
        if (!this.isRunning) return;

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
            const gridFreq = 440 * Math.pow(2, (m - 69) / 12);
            const name = YinF0Detector.frequencyToNote(gridFreq);
            const isC = name.startsWith("C") && !name.includes("#");
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
                this.ctx.strokeStyle = "rgb(60,35,128)";
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

                if (point.active && point.val !== null) {
                    const y = getY(point.val);

                    // Skip if out of visible bounds
                    if (y < -50 || y > this.canvas.height + 50) {
                        started = false;
                        continue;
                    }

                    // Draw continuous line
                    if (!started) {
                        this.ctx.moveTo(x, y);
                        started = true;
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                } else {
                    // Silence/no pitch detected - break the line
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
