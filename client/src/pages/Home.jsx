import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="page-container home-page">
            <h1>Welcome to FaceAttend</h1>
            <p>Secure Facial Recognition Attendance System</p>
            <div className="action-buttons">
                <Link to="/attendance" className="btn btn-primary">Mark Attendance</Link>
                <Link to="/register" className="btn btn-secondary">Register New User</Link>
            </div>
        </div>
    );
}

export default Home;
