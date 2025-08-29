import React, { useState, useEffect } from 'react'
import { SessionStorage } from '../utils/sessionStorage'
import type { SessionData } from '../utils/sessionStorage'

/**
 * Authentication Service
 * Manages user authentication state and provides methods for login/logout
 */

interface AuthState {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean;
}

type AuthListener = (state: AuthState) => void;

export class AuthService {
  private authState: AuthState = {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    hasCompletedOnboarding: false
  };
  
  private listeners: AuthListener[] = [];
  private retryCount = 0;
  private maxRetries = 3;
  private isLoggingOut = false; // Add logout flag

  constructor() {
    console.log('🔍 [AuthService] Initializing AuthService');
    this.initializeAuth();
  }

  /**
   * Initialize authentication state
   * Called on service instantiation
   */
  private async initializeAuth(): Promise<void> {
    console.log('🔍 [AuthService] Starting auth initialization');
    
    // Don't restore session if we're in the middle of logging out
    if (this.isLoggingOut) {
      console.log('🔍 [AuthService] Logout in progress, skipping session restoration');
      return;
    }
    
    // First, try to restore session from localStorage
    const savedSession = SessionStorage.loadSession();
    if (savedSession) {
      console.log('🔍 [AuthService] Found saved session, restoring state');
      this.setAuthState({
        user: savedSession.user,
        isLoading: true,
        isAuthenticated: savedSession.isAuthenticated,
        error: null,
        hasCompletedOnboarding: savedSession.hasCompletedOnboarding
      });
    }
    
    // Check if we just came from an OAuth redirect
    const referrer = document.referrer;
    // Check multiple possible referrer patterns for OAuth
    const isFromOAuth = referrer.includes('accounts.google.com') || 
                       referrer.includes('localhost:3001/auth/google/callback') ||
                       window.location.search.includes('code=') ||
                       // Check if we're on channels page (common after OAuth)
                       window.location.pathname === '/channels' ||
                       sessionStorage.getItem('oauth_flow_in_progress') === 'true';
    
    if (isFromOAuth) {
      console.log('🔍 [AuthService] Detected OAuth redirect, forcing auth refresh');
      // Add a longer delay to ensure cookies are properly set after OAuth callback
      await new Promise(resolve => setTimeout(resolve, 2000)); // Increased to 2 seconds
    }
    
    try {
      await this.checkAuthStatus();
    } catch (error) {
      console.error('❌ [AuthService] Auth initialization failed:', error);
      this.setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: 'Initialization failed',
        hasCompletedOnboarding: false
      });
    }
  }

  /**
   * Set authentication state and notify listeners
   */
  private setAuthState(newState: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...newState };
    console.log('🔍 [AuthService] State updated:', this.authState);
    this.notifyListeners();
  }

  /**
   * Add a listener to be notified of auth state changes
   */
  addListener(listener: AuthListener): () => void {
    console.log('🔍 [AuthService] Adding listener');
    this.listeners.push(listener);
    
    // Immediately notify the new listener of current state
    listener(this.authState);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    console.log('🔍 [AuthService] Notifying listeners, state:', this.authState);
    this.listeners.forEach(listener => {
      try {
        listener(this.authState);
      } catch (error) {
        console.error('❌ [AuthService] Listener error:', error);
      }
    });
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Check authentication status by calling the /me endpoint
   * Updates the auth state based on the response
   */
  async checkAuthStatus(): Promise<void> {
    try {
      console.log('🔍 [AuthService] Checking /me endpoint');
      this.setAuthState({ isLoading: true, error: null });
      
      // Add a delay to ensure cookies are properly set if coming from OAuth
      const referrer = document.referrer;
      const isFromOAuth = referrer.includes('accounts.google.com') || 
                         referrer.includes('localhost:3001/auth/google/callback') ||
                         window.location.search.includes('code=') ||
                         window.location.pathname === '/dashboard';
                         
      if (isFromOAuth) {
        console.log('🔍 [AuthService] Adding delay for OAuth cookie sync');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Send cookies with the request
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 [AuthService] /me response status:', response.status);

      if (response.ok) {
        const user = await response.json();
        console.log('✅ [AuthService] User authenticated:', user);

        // Check if user has completed onboarding by checking channel selections
        let hasCompletedOnboarding = false;
        try {
          const channelsResponse = await fetch('/api/channels/selected', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          hasCompletedOnboarding = channelsResponse.ok && 
            (await channelsResponse.json()).length > 0;
        } catch (error) {
          console.warn('⚠️ [AuthService] Failed to check onboarding status:', error);
        }
        
        // Save session to localStorage
        const sessionData: SessionData = {
          user,
          isAuthenticated: true,
          lastChecked: Date.now(),
          hasCompletedOnboarding
        };
        SessionStorage.saveSession(sessionData);
        
        this.setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
          hasCompletedOnboarding
        });
        
        // Reset retry count on successful auth
        this.retryCount = 0;
      } else {
        console.log('🔍 [AuthService] User not authenticated, status:', response.status);
        
        // Try to get error message from response
        let errorMessage = 'Authentication failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Ignore JSON parsing errors
        }

        // Clear invalid session
        SessionStorage.clearSession();
        
        this.setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: errorMessage,
          hasCompletedOnboarding: false
        });
      }
    } catch (error) {
      console.error('❌ [AuthService] Error checking auth status:', error);
      
      // Implement retry logic for network errors
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔍 [AuthService] Retrying auth check (${this.retryCount}/${this.maxRetries})`);
        
        setTimeout(() => {
          this.checkAuthStatus();
        }, 1000 * this.retryCount); // Exponential backoff
        
        return;
      }
      
      // If there's a network error or backend is down, assume not authenticated
      this.setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: 'Network error - unable to verify authentication',
        hasCompletedOnboarding: false
      });
    }
  }

  /**
   * Logout user and clear authentication state
   * Clears local state and any stored session data
   * Calls backend logout endpoint to clear server-side session
   * Redirects to landing page after successful logout
   */
  async logout(): Promise<void> {
    try {
      console.log('🔍 [AuthService] Logout called')
      
      // Set logout flag to prevent session restoration
      this.isLoggingOut = true;

      // Clear any stored tokens or session data FIRST
      SessionStorage.clearSession();
      localStorage.removeItem('auth_token');
      sessionStorage.clear();

      // Clear local authentication state immediately
      this.setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
        hasCompletedOnboarding: false
      });

      // Call backend logout endpoint to clear server-side session
      const response = await fetch('/api/auth/logout', {
        method: 'POST', // Ensure POST method is used
        credentials: 'include', // Send cookies with the request
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 [AuthService] Logout response status:', response.status);

      if (response.ok) {
        console.log('✅ [AuthService] Logout successful');
      } else {
        console.warn('⚠️ [AuthService] Logout response not OK:', response.status);
      }

      // Force a hard redirect to prevent session restoration
      window.location.replace('/');
    } catch (error) {
      console.error('❌ [AuthService] Logout failed:', error);
      // Even if logout fails, force redirect to landing page
      window.location.replace('/');
    }
  }

  /**
   * Force refresh authentication state
   * Useful after OAuth callback or manual auth state changes
   */
  async refreshAuth(): Promise<void> {
    console.log('🔍 [AuthService] Force refreshing auth state');
    this.retryCount = 0; // Reset retry count
    await this.checkAuthStatus();
  }
}

// Create a singleton instance
const authService = new AuthService();

/**
 * React Hook for authentication
 * Provides authentication state and methods to components
 */
export function useAuth() {
  const [authState, setAuthState] = React.useState<AuthState>(authService.getAuthState());

  React.useEffect(() => {
    console.log('🔍 [useAuth] Hook initialized');
    
    // Subscribe to auth state changes
    const unsubscribe = authService.addListener((newState) => {
      console.log('🔍 [useAuth] State updated:', newState);
      setAuthState(newState);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  return {
    ...authState,
    logout: authService.logout.bind(authService),
    checkAuthStatus: authService.checkAuthStatus.bind(authService),
    refreshAuth: authService.refreshAuth.bind(authService)
  };
}

export default authService;