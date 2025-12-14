import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

function Attendance() {
    const [initializing, setInitializing] = useState(true);
    const [logs, setLogs] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [session, setSession] = useState(null);
    // mode is now derived exclusively from the session

    const videoRef = useRef();
    const canvasRef = useRef();
    const streamRef = useRef();
    const matcherRef = useRef(null);
    const usersMapRef = useRef({}); // Map name -> userId
    const lastLogRef = useRef({}); // Debounce logging: name -> timestamp

    useEffect(() => {
        const setup = async () => {
            const MODEL_URL = '/models';
            try {
                // Load models and session
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    fetchActiveSession()
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
                    // Increased threshold for strictness (lower is stricter)
                    // Default was 0.6, trying 0.45 for better accuracy as requested
                    matcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
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

    // Poll for session status occasionally? Or just rely on initial load?
    // User requested "Attendance cannot be started without a session"
    // Let's poll active session every 10 seconds to detect mode changes
    useEffect(() => {
        const interval = setInterval(fetchActiveSession, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchActiveSession = async () => {
        try {
            const res = await fetch('/api/sessions/active');
            const data = await res.json();
            setSession(data); // data is object or null
        } catch (err) {
            console.error("Failed to fetch session", err);
        }
    };

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            })
            .catch(err => setErrorMsg("Camera access denied."));
    };

    const logAttendance = async (name, detectionBox) => {
        if (!session) return; // Cannot log without session

        const now = Date.now();
        // Debounce: Only log once every minute per user
        if (lastLogRef.current[name] && (now - lastLogRef.current[name] < 60000)) {
            return;
        }

        const userId = usersMapRef.current[name];
        if (userId) {
            lastLogRef.current[name] = now;

            // Capture image
            let imageBase64 = null;
            if (videoRef.current && detectionBox) {
                const logCanvas = document.createElement('canvas');
                logCanvas.width = 320;
                logCanvas.height = 240;
                logCanvas.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 240);
                imageBase64 = logCanvas.toDataURL('image/jpeg', 0.5);
            }

            try {
                // Determine mode from session
                const currentMode = session.type || 'in';

                const res = await fetch('/api/attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, type: currentMode, image: imageBase64 })
                });

                if (res.ok) {
                    setLogs(prev => [{ name, time: new Date().toLocaleTimeString(), type: currentMode }, ...prev].slice(0, 10));
                } else if (res.status === 409) {
                    setLogs(prev => [{ name, time: 'Already logged', type: 'error' }, ...prev].slice(0, 10));
                } else if (res.status === 403) {
                    setLogs(prev => [{ name, time: 'Session inactive', type: 'error' }, ...prev].slice(0, 10));
                }
            } catch (err) {
                console.error("Log error", err);
            }
        }
    };

    const handleVideoPlay = () => {
        setInitializing(false);
        setInterval(async () => {
            if (videoRef.current && canvasRef.current && matcherRef.current && session) {
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
                        logAttendance(result.label, box);
                    }
                });
            } else if (!session && videoRef.current) {
                // If no session, clear canvas and maybe show "Waiting" text on it?
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    ctx.font = "30px Arial";
                    ctx.fillStyle = "red";
                    ctx.fillText("No Active Session", 50, 50);
                }
            }
        }, 100);
    };

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                <h2>Attendance Scanner</h2>
                <div style={{ textAlign: 'right' }}>
                    {session ? (
                        <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.2rem' }}>
                            Active: {session.name} ({session.type === 'in' ? 'SIGN IN' : 'SIGN OUT'})
                        </div>
                    ) : (
                        <div style={{ color: '#f87171', fontWeight: 'bold' }}>OFFLINE: Waiting for Lecturer...</div>
                    )}
                </div>
            </div>

            {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div className="video-container" style={{ width: '640px', height: '480px', background: '#000', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                    {initializing && <div style={{ color: 'white', textAlign: 'center', paddingTop: '200px' }}>Loading System...</div>}
                    <video ref={videoRef} autoPlay muted onPlay={handleVideoPlay} width="640" height="480" />
                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                </div>

                <div className="card" style={{ width: '300px', height: '480px', overflowY: 'auto' }}>
                    <h3>Recent Logs</h3>
                    {logs.length === 0 && <p style={{ opacity: 0.7 }}>Waiting for scans...</p>}
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {logs.map((log, i) => (
                            <li key={i} style={{
                                padding: '0.5rem',
                                borderBottom: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                color: log.type === 'error' ? 'red' : 'inherit'
                            }}>
                                <strong>{log.name}</strong>
                                <span>{log.time} <small>({log.type})</small></span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Attendance;
