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

    const handleVideoOnPlay = () => {
        const interval = setInterval(async () => {
            if (webcamRef.current && webcamRef.current.video.readyState === 4) {
                const video = webcamRef.current.video;
                const videoWidth = webcamRef.current.video.videoWidth;
                const videoHeight = webcamRef.current.video.videoHeight;

                // Set canvas dimensions
                if (canvasRef.current) {
                    canvasRef.current.width = videoWidth;
                    canvasRef.current.height = videoHeight;
                }

                try {
                    // Detect faces
                    const detections = await faceapi.detectAllFaces(
                        video,
                        new faceapi.TinyFaceDetectorOptions()
                    );
                    // .withFaceLandmarks(); // Optional: heavier, add if needed for "looking away"

                    // Resize detections to match video size
                    const resizedDetections = faceapi.resizeResults(detections, { width: videoWidth, height: videoHeight });

                    // Draw detections on canvas
                    if (canvasRef.current) {
                        const context = canvasRef.current.getContext('2d');
                        context.clearRect(0, 0, videoWidth, videoHeight);
                        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                    }

                    // Evaluate Status
                    let status = 'ok';
                    let message = '';
                    if (detections.length === 0) {
                        status = 'missing';
                        message = 'No face detected';
                    } else if (detections.length > 1) {
                        status = 'multiple';
                        message = 'Multiple faces detected';
                    }

                    if (onStatusChange) {
                        onStatusChange({ status, message });
                    }
                } catch (err) {
                    console.error("Detection error:", err);
                }
            }
        }, 1000); // Check every 1s to save performance

        return () => clearInterval(interval);
    };

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
                onUserMedia={handleVideoOnPlay} // Simplified trigger
            // onPlay is better but sometimes tricky with react-webcam, using onUserMedia + Effect or just internal interval ok
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
    const missingFramesRef = useRef(0);

    useEffect(() => {
        const interval = setInterval(async () => {
            if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
                try {
                    const video = webcamRef.current.video;

                    // Ultra-lenient settings for low-quality cameras
                    // scoreThreshold: 0.1 allows very poor quality faces to be detected
                    // inputSize: 224 improves performance on low-end devices while maintaining decent detection
                    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.1 });
                    const detections = await faceapi.detectAllFaces(video, options);

                    // Draw
                    if (canvasRef.current) {
                        const displaySize = { width: video.videoWidth, height: video.videoHeight };
                        faceapi.matchDimensions(canvasRef.current, displaySize);
                        const resizedDetections = faceapi.resizeResults(detections, displaySize);
                        canvasRef.current.getContext('2d').clearRect(0, 0, displaySize.width, displaySize.height);
                        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                    }

                    // Logic with Debounce
                    let status = 'ok';
                    let message = '';

                    if (detections.length === 0) {
                        missingFramesRef.current += 1;
                        // Only fail after ~3 seconds (6 checks * 500ms) of consistent failure to handle camera glitch/lag
                        if (missingFramesRef.current < 6) {
                            // Keep previous status or assume ok during grace period
                            // We return early to avoid sending a 'missing' update
                            return;
                        }
                        status = 'missing';
                        message = 'Face not visible';
                    } else {
                        // Face found, reset counter immediately
                        missingFramesRef.current = 0;

                        if (detections.length > 1) {
                            status = 'multiple';
                            message = 'Multiple people detected';
                        }
                    }

                    if (onStatusChange) onStatusChange({ status, message });

                } catch (e) {
                    console.error("Detection Loop Error:", e);
                }
            }
        }, 500);
        return () => clearInterval(interval);
    }, [webcamRef, canvasRef, onStatusChange]);

    return null;
};

export default ProctoringWebcam;
