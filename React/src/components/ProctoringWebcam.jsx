import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

const ProctoringWebcam = ({ onStatusChange }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    // faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL), // Optional
                ]);
                setModelsLoaded(true);
                console.log("FaceAPI models loaded");
            } catch (err) {
                console.error("Error loading models:", err);
                setError("Failed to load AI models");
            }
        };
        loadModels();
    }, []);

    return (
        <div className="relative w-64 h-48 bg-black rounded-lg overflow-hidden border-2 border-slate-700 shadow-lg">
            {!modelsLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs z-20">
                    Loading AI...
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs z-20">
                    {error}
                </div>
            )}
            <Webcam
                ref={webcamRef}
                audio={false}
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay Canvas for bounding boxes */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Trigger detection loop manually once models are loaded and video is ready */}
            {modelsLoaded && <DetectionLoop webcamRef={webcamRef} canvasRef={canvasRef} onStatusChange={onStatusChange} />}
        </div>
    );
};

// Separated component to cleanly manage the interval effect
const DetectionLoop = ({ webcamRef, canvasRef, onStatusChange }) => {
    // Refs for debouncing/persistence
    const statusPersistenceRef = useRef({
        missing: 0,
        multiple: 0,
        ok: 0
    });
    const lastEmittedStatusRef = useRef({ status: 'ok', message: '' });

    useEffect(() => {
        const interval = setInterval(async () => {
            if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
                try {
                    const video = webcamRef.current.video;

                    // Reverting to TinyFaceDetector as SSD model files are missing
                    // Increased inputSize to 512 for 'stronger' detection (better at small/background faces)
                    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.1 });
                    const detections = await faceapi.detectAllFaces(video, options);

                    // Draw
                    if (canvasRef.current) {
                        const displaySize = { width: video.videoWidth, height: video.videoHeight };
                        faceapi.matchDimensions(canvasRef.current, displaySize);
                        const resizedDetections = faceapi.resizeResults(detections, displaySize);
                        canvasRef.current.getContext('2d').clearRect(0, 0, displaySize.width, displaySize.height);
                        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                    }

                    // Raw status for this frame
                    let currentFrameStatus = 'ok';
                    let currentFrameMessage = '';

                    if (detections.length === 0) {
                        currentFrameStatus = 'missing';
                        currentFrameMessage = 'Face not visible';
                    } else if (detections.length > 1) {
                        currentFrameStatus = 'multiple';
                        currentFrameMessage = 'Multiple people detected';
                    }

                    // Update persistence counters
                    const counters = statusPersistenceRef.current;
                    if (currentFrameStatus === 'missing') {
                        counters.missing++;
                        counters.multiple = 0;
                        counters.ok = 0;
                    } else if (currentFrameStatus === 'multiple') {
                        counters.multiple++;
                        counters.missing = 0;
                        counters.ok = 0;
                    } else {
                        counters.ok++;
                        counters.missing = 0;
                        counters.multiple = 0;
                    }

                    // Determination Logic with Persistence Thresholds
                    // We only switch to a new status if it has persisted for X frames
                    let outputStatus = lastEmittedStatusRef.current.status;
                    let outputMessage = lastEmittedStatusRef.current.message;

                    // Thresholds (assuming 500ms interval):
                    // missing: 3 frames (1.5s)
                    // multiple: 2 frames (1.0s) - quicker to catch cheaters, but debounced for noise
                    // ok: 2 frames (1.0s) - stable recovery

                    if (counters.missing >= 3) {
                        outputStatus = 'missing';
                        outputMessage = 'Face not visible';
                    } else if (counters.multiple >= 2) {
                        outputStatus = 'multiple';
                        outputMessage = 'Multiple people detected';
                    } else if (counters.ok >= 2) {
                        outputStatus = 'ok';
                        outputMessage = '';
                    }

                    // Emit event only if status has consistently changed from LAST EMITTED status
                    if (outputStatus !== lastEmittedStatusRef.current.status) {
                        lastEmittedStatusRef.current = { status: outputStatus, message: outputMessage };
                        if (onStatusChange) onStatusChange({ status: outputStatus, message: outputMessage });
                    }

                } catch (e) {
                    console.error("Detection Loop Error:", e);
                }
            }
        }, 500); // 500ms Check Interval
        return () => clearInterval(interval);
    }, [webcamRef, canvasRef, onStatusChange]);

    return null;
};

export default ProctoringWebcam;
