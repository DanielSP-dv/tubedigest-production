import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Spin } from 'antd';

interface NavigationTransitionProps {
  children: React.ReactNode;
}

/**
 * Navigation Transition Component
 * Provides smooth transitions between pages with loading states
 */
const NavigationTransition: React.FC<NavigationTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPath, setCurrentPath] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== currentPath) {
      setIsTransitioning(true);
      
      // Simulate transition delay
      const transitionTimer = setTimeout(() => {
        setCurrentPath(location.pathname);
        setIsTransitioning(false);
      }, 300); // 300ms transition

      return () => clearTimeout(transitionTimer);
    }
  }, [location.pathname, currentPath]);

  if (isTransitioning) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        transition: 'opacity 0.3s ease-in-out',
        gap: '16px'
      }}>
        <Spin size="large" tip="Loading..." />
        <div style={{ fontSize: '14px', color: '#666' }}>
          Navigating to {location.pathname}...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      opacity: isTransitioning ? 0 : 1,
      transition: 'opacity 0.3s ease-in-out'
    }}>
      {children}
    </div>
  );
};

export default NavigationTransition;
