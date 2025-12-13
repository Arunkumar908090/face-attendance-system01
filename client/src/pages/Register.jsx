import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

function Register() {
    const [name, setName] = useState('');
    const [initializing, setInitializing] = useState(true);
    const [faceDetected, setFaceDetected] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const videoRef = useRef();
    const canvasRef = useRef();
    const streamRef = useRef();

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                startVideo();
            } catch (err) {
                console.error("Model load error:", err);
                setErrorMsg("Failed to load face models. Ensure they are in /public/models.");
            }
        };
        loadModels();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            })
            .catch(err => {
                console.error("Camera error:", err);
                setErrorMsg("Camera access denied.");
            });
    };

    const handleVideoPlay = () => {
        setInitializing(false);
        setInterval(async () => {
            if (videoRef.current && canvasRef.current) {
                const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                faceapi.draw.drawDetections(canvasRef.current, resizedDetections);

                if (detections.length > 0) {
                    setFaceDetected(true);
                } else {
                    setFaceDetected(false);
                }
            }
        }, 100);
    };

    const handleRegister = async () => {
        if (!name) return setErrorMsg("Please enter a name.");
        if (!faceDetected) return setErrorMsg("No face detected.");

        // Capture single descriptor
        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detection) {
            const descriptor = Array.from(detection.descriptor); // Convert Float32Array to Array

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, descriptor })
                });
                const data = await response.json();
                if (data.success) {
                    setSuccessMsg(`User ${name} registered successfully!`);
                    setName('');
                } else {
                    setErrorMsg(data.error || 'Registration failed.');
                }
            } catch (err) {
                setErrorMsg('Network error.');
            }
        }
    };

    return (
        <div className="page-container">
            <h2>Register New User</h2>
            <div className="card">
                {errorMsg && <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{errorMsg}</div>}
                {successMsg && <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>{successMsg}</div>}

                <input
                    type="text"
                    placeholder="Enter Full Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />

                <div className="video-container" style={{ width: '100%', maxWidth: '640px', height: '480px', background: '#000' }}>
                    {initializing && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>Loading AI...</div>}
                    <video ref={videoRef} autoPlay muted onPlay={handleVideoPlay} width="640" height="480" />
                    <canvas ref={canvasRef} />
                </div>

                <button
                    className="btn btn-primary"
                    style={{ marginTop: '1rem', width: '100%' }}
                    onClick={handleRegister}
                    disabled={!faceDetected || !name}
                >
                    Capture & Register
                </button>
            </div>
        </div>
    );
}

export default Register;
