import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth';

interface NavigationGuardProps {
  children: React.ReactNode;
}

const NavigationGuard: React.FC<NavigationGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsInitialized(false);
      return;
    }

    const currentPath = location.pathname;
    
    // Check if this is an OAuth callback
    const isOAuthCallback = location.search.includes('code=') && currentPath === '/channels';

    // Skip navigation logic during OAuth callback
    if (isOAuthCallback) {
      console.log('NavigationGuard: OAuth callback detected, allowing access to /channels');
      setIsInitialized(true);
      return;
    }

    console.log('NavigationGuard: Current path:', currentPath, 'Auth:', isAuthenticated);

    // Public routes that don't require authentication
    const publicRoutes = ['/'];
    
    if (publicRoutes.includes(currentPath)) {
      // If user is authenticated and on a public route, redirect to dashboard
      if (isAuthenticated) {
        console.log('NavigationGuard: Redirecting authenticated user from public route to dashboard');
        navigate('/dashboard', { replace: true });
        return;
      }
      // For unauthenticated users on public routes, allow access
    } else {
      // Protected routes - check authentication
      if (!isAuthenticated) {
        console.log('NavigationGuard: User not authenticated, redirecting to landing page');
        navigate('/', { replace: true });
        return;
      }
      // For authenticated users on protected routes, allow access
    }

    setIsInitialized(true);
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return (
      <div 
        data-testid="loading-spinner"
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '16px',
          color: '#666'
        }}
      >
        Loading...
      </div>
    );
  }

  return <>{children}</>;
};

export default NavigationGuard;
