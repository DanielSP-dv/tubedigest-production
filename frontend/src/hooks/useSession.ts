import { useState, useEffect, useCallback } from 'react';
import { SessionStorage } from '../utils/sessionStorage';
import type { SessionData } from '../utils/sessionStorage';

export interface SessionState extends SessionData {
  isLoading: boolean;
  error: string | null;
}

export interface UseSessionReturn extends SessionState {
  validateSession: () => Promise<void>;
  clearSession: () => void;
  updateSession: (updates: Partial<SessionData>) => void;
  restoreSession: () => void;
  logout: () => Promise<void>;
}

/**
 * Session Management Hook
 * Handles session state, persistence, and validation
 */
export const useSession = (): UseSessionReturn => {
  const [sessionState, setSessionState] = useState<SessionState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    lastChecked: 0,
    hasCompletedOnboarding: false,
    error: null
  });

  /**
   * Validate session with backend
   */
  const validateSession = useCallback(async (): Promise<void> => {
    // Prevent multiple simultaneous validations
    if (sessionState.isLoading) return;
    
    try {
      setSessionState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/me', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const user = await response.json();
        
        // Check if user has completed onboarding by checking channel selections
        const channelsResponse = await fetch('/api/channels/selected', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const hasCompletedOnboarding = channelsResponse.ok && 
          (await channelsResponse.json()).length > 0;
        
        const newSessionData: SessionData = {
          user,
          isAuthenticated: true,
          lastChecked: Date.now(),
          hasCompletedOnboarding
        };
        
        // Save to localStorage
        SessionStorage.saveSession(newSessionData);
        
        setSessionState({
          ...newSessionData,
          isLoading: false,
          error: null
        });
      } else {
        // Clear invalid session
        SessionStorage.clearSession();
        
        setSessionState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          lastChecked: 0,
          hasCompletedOnboarding: false,
          error: 'Session validation failed'
        });
      }
    } catch (error) {
      console.error('❌ [useSession] Session validation error:', error);
      
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Network error during session validation'
      }));
    }
  }, [sessionState.isLoading]);

  /**
   * Clear session data
   */
  const clearSession = useCallback((): void => {
    console.log('🔍 [useSession] Clearing session');
    
    SessionStorage.clearSession();
    
    setSessionState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastChecked: 0,
      hasCompletedOnboarding: false,
      error: null
    });
  }, []);

  /**
   * Logout user and clear all session data
   */
  const logout = useCallback(async (): Promise<void> => {
    console.log('🔍 [useSession] Logout called');
    
    try {
      // Clear session data
      clearSession();
      
      // Call backend logout endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 [useSession] Logout response status:', response.status);

      if (response.ok) {
        console.log('✅ [useSession] Logout successful');
      } else {
        console.warn('⚠️ [useSession] Logout response not OK:', response.status);
      }

      // Redirect to landing page
      window.location.href = '/';
    } catch (error) {
      console.error('❌ [useSession] Logout failed:', error);
      // Even if logout fails, redirect to landing page
      window.location.href = '/';
    }
  }, [clearSession]);

  /**
   * Update session data
   */
  const updateSession = useCallback((updates: Partial<SessionData>): void => {
    console.log('🔍 [useSession] Updating session:', updates);
    
    const currentSession = SessionStorage.loadSession();
    if (currentSession) {
      const updatedSession = { ...currentSession, ...updates };
      SessionStorage.saveSession(updatedSession);
      
      setSessionState(prev => ({
        ...prev,
        ...updatedSession
      }));
    }
  }, []);

  /**
   * Restore session from localStorage
   */
  const restoreSession = useCallback((): void => {
    const savedSession = SessionStorage.loadSession();
    
    if (savedSession) {
      setSessionState({
        ...savedSession,
        isLoading: true,
        error: null
      });
      
      // Validate with backend
      validateSession();
    } else {
      setSessionState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        lastChecked: 0,
        hasCompletedOnboarding: false,
        error: null
      });
    }
  }, []);

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    restoreSession();
  }, []);

  return {
    ...sessionState,
    validateSession,
    clearSession,
    updateSession,
    restoreSession,
    logout
  };
};
