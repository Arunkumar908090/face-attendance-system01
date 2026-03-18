import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const DesktopOnlyRoute = ({ children }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade">
        <div 
          className="card" 
          style={{ 
            maxWidth: '500px', 
            padding: '3rem', 
            background: 'var(--bg-glass-strong)', 
            backdropFilter: 'blur(15px)',
            borderRadius: '24px',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--glass-shadow)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem'
          }}
        >
          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'rgba(239, 68, 68, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#ef4444' 
            }}
          >
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}>
            The Scanner and Lecturer Dashboards are restricted to desktop computers for biometric security and hardware reasons.
          </p>
          <Link 
            to="/" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              borderRadius: '50px', 
              textDecoration: 'none',
              marginTop: '1rem'
            }}
          >
            <HomeIcon size={20} style={{ marginRight: '8px' }} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default DesktopOnlyRoute;
