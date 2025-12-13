import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

function Attendance() {
    const [initializing, setInitializing] = useState(true);
    const [logs, setLogs] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    const videoRef = useRef();
    const canvasRef = useRef();
    const streamRef = useRef();
    const matcherRef = useRef(null);
    const usersMapRef = useRef({}); // Map name -> userId for logging time stamp 2:03 Story of OJ, Jay Z
    const lastLogRef = useRef({}); // Debounce logging: name -> timestamp

    useEffect(() => {
        const setup = async () => {
            const MODEL_URL = '/models';
            try {
                // Load models
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);

                // Fetch users and build matcher
                const usersRes = await fetch('/api/users');
                const users = await usersRes.json();

                if (users.length > 0) {
                    const labeledDescriptors = users.map(user => {
                        usersMapRef.current[user.name] = user.id;
                        return new faceapi.LabeledFaceDescriptors(
                            user.name,
                            [new Float32Array(user.descriptor)]
                        );
                    });
                    matcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
                }

                startVideo();
            } catch (err) {
                console.error("Setup error:", err);
                setErrorMsg("Failed to load system resources.");
            }
        };
        setup();

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
            .catch(err => setErrorMsg("Camera access denied."));
    };

    const logAttendance = async (name) => {
        const now = Date.now();
        // Debounce: Only log once every minute per user
        if (lastLogRef.current[name] && (now - lastLogRef.current[name] < 60000)) {
            return;
        }

        const userId = usersMapRef.current[name];
        if (userId) {
            lastLogRef.current[name] = now;
            try {
                const res = await fetch('/api/attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, type: 'in' })
                });
                if (res.ok) {
                    setLogs(prev => [{ name, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
                }
            } catch (err) {
                console.error("Log error", err);
            }
        }
    };

    const handleVideoPlay = () => {
        setInitializing(false);
        setInterval(async () => {
            if (videoRef.current && canvasRef.current && matcherRef.current) {
                const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                const results = resizedDetections.map(d => matcherRef.current.findBestMatch(d.descriptor));

                results.forEach((result, i) => {
                    const box = resizedDetections[i].detection.box;
                    const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
                    drawBox.draw(canvasRef.current);

                    if (result.label !== 'unknown') {
                        logAttendance(result.label);
                    }
                });
            }
        }, 100);
    };

    return (
        <div className="page-container">
            <h2>Attendance Scanner</h2>
            {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div className="video-container" style={{ width: '640px', height: '480px', background: '#000' }}>
                    {initializing && <div style={{ color: 'white', textAlign: 'center', paddingTop: '200px' }}>Loading System...</div>}
                    <video ref={videoRef} autoPlay muted onPlay={handleVideoPlay} width="640" height="480" />
                    <canvas ref={canvasRef} />
                </div>

                <div className="card" style={{ width: '300px', height: '480px', overflowY: 'auto' }}>
                    <h3>Recent Logs</h3>
                    {logs.length === 0 && <p style={{ opacity: 0.7 }}>Waiting for scans...</p>}
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {logs.map((log, i) => (
                            <li key={i} style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{log.name}</strong>
                                <span>{log.time}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Attendance;
