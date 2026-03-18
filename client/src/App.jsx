import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ScanFace, UserPlus, Camera, Lock, Home as HomeIcon } from 'lucide-react';
import Register from './pages/Register';
import Attendance from './pages/Attendance';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
import LiquidBackground from './components/LiquidBackground';
import ErrorBoundary from './components/ErrorBoundary';
import DesktopOnlyRoute from './components/DesktopOnlyRoute';
import './index.css';

// Protective wrapper for Admin routes
const ProtectedRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  // Obscure and secure the access route; only valid tokens survive
  return isAdmin ? children : <Navigate to="/admin-login" replace />;
};

// Nav Link component for active state styling
const NavLink = ({ to, label, className }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (location.pathname === '/admin' && to === '/admin-login');

  return (
    <Link
      to={to}
      className={`${isActive ? 'active' : ''} ${className || ''}`}
    >
      {label}
    </Link>
  );
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

function App() {
  const isMobile = useIsMobile();

  return (
    <ErrorBoundary>
      <Router>
        <div className="app-container">
          <LiquidBackground />

          <nav className="navbar" style={{ margin: '1rem', borderRadius: 'var(--radius-lg)' }}>
            <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
              <ScanFace className="text-primary" size={28} />
              FaceAttend
            </Link>

            <div className="nav-links">
              <NavLink to="/" label="Home" />
              <NavLink to="/register" label="Enroll" />
              {/* Only show Scanner and Lecturer on Desktop */}
              <NavLink to="/attendance" label="Scanner" className="hidden md:flex" />
              <NavLink to="/admin-login" label={<><Lock size={18} /> Lecturer</>} className="hidden md:flex" />
            </div>
          </nav>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              
              {/* Restricted Desktop Only Routes */}
              <Route path="/attendance" element={
                <DesktopOnlyRoute>
                  <Attendance />
                </DesktopOnlyRoute>
              } />
              
              <Route path="/admin-login" element={
                <DesktopOnlyRoute>
                  <AdminLogin />
                </DesktopOnlyRoute>
              } />
              
              <Route
                path="/admin"
                element={
                  <DesktopOnlyRoute>
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  </DesktopOnlyRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
