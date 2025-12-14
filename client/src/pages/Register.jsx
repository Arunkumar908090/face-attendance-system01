import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        matric_no: '',
        level: '',
        department: '',
        course: ''
    });
    const [initializing, setInitializing] = useState(true);
    const [faceDetected, setFaceDetected] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [capturedPhoto, setCapturedPhoto] = useState(null);

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
                setErrorMsg("Failed to load face models.");
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

                setFaceDetected(detections.length > 0);
            }
        }, 100);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const capturePhoto = () => {
        if (!videoRef.current) return null;
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 240);
        return canvas.toDataURL('image/jpeg', 0.7);
    };

    const handleRegister = async () => {
        if (!formData.name || !formData.matric_no) return setErrorMsg("Name and Matric No are required.");
        if (!faceDetected) return setErrorMsg("No face detected.");

        // Capture single descriptor
        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detection) {
            const descriptor = Array.from(detection.descriptor);
            const photo = capturePhoto();
            setCapturedPhoto(photo);

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, descriptor, photo })
                });
                const data = await response.json();
                if (data.success) {
                    setSuccessMsg(`User ${formData.name} registered successfully!`);
                    setFormData({ name: '', matric_no: '', level: '', department: '', course: '' });
                    setCapturedPhoto(null);
                } else {
                    setErrorMsg(data.error || 'Registration failed.');
                }
            } catch (err) {
                setErrorMsg('Network error.');
            }
        }
    };

    return (
        <div className="page-container" style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: '2rem' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <h2>Register User</h2>
                {errorMsg && <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{errorMsg}</div>}
                {successMsg && <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>{successMsg}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input name="name" placeholder="Full Name *" value={formData.name} onChange={handleChange} />
                    <input name="matric_no" placeholder="Matric No *" value={formData.matric_no} onChange={handleChange} />
                    <input name="level" placeholder="Level (e.g., 400)" value={formData.level} onChange={handleChange} />
                    <input name="department" placeholder="Department" value={formData.department} onChange={handleChange} />
                    <input name="course" placeholder="Course of Study" value={formData.course} onChange={handleChange} />
                </div>

                <button
                    className="btn btn-primary"
                    style={{ marginTop: '1.5rem', width: '100%' }}
                    onClick={handleRegister}
                    disabled={!faceDetected || !formData.name || !formData.matric_no}
                >
                    Capture & Register
                </button>
            </div>

            <div className="video-container" style={{ width: '640px', height: '480px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                {initializing && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>Loading AI...</div>}
                <video ref={videoRef} autoPlay muted onPlay={handleVideoPlay} width="640" height="480" />
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                {capturedPhoto && (
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', border: '2px solid white', borderRadius: '4px' }}>
                        <img src={capturedPhoto} width="100" />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Register;
