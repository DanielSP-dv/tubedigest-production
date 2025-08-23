/**
 * Session Storage Utility
 * Handles browser localStorage operations for session persistence
 */

export interface SessionData {
  user: {
    id: string;
    email: string;
    createdAt: string;
    tz: string;
    cadence?: string;
  } | null;
  isAuthenticated: boolean;
  lastChecked: number;
  hasCompletedOnboarding: boolean;
}

const SESSION_KEY = 'tubedigest_session';
const SESSION_EXPIRY_KEY = 'tubedigest_session_expiry';

export class SessionStorage {
  /**
   * Save session data to localStorage
   */
  static saveSession(sessionData: SessionData): void {
    try {
      const sessionWithTimestamp = {
        ...sessionData,
        lastSaved: Date.now()
      };
      
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionWithTimestamp));
      
      // Set expiry for 24 hours
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
      localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
      
      console.log('🔍 [SessionStorage] Session saved successfully');
    } catch (error) {
      console.error('❌ [SessionStorage] Failed to save session:', error);
    }
  }

  /**
   * Load session data from localStorage
   */
  static loadSession(): SessionData | null {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      const expiryTime = localStorage.getItem(SESSION_EXPIRY_KEY);
      
      if (!sessionData || !expiryTime) {
        console.log('🔍 [SessionStorage] No session data found');
        return null;
      }
      
      // Check if session has expired
      const now = Date.now();
      const expiry = parseInt(expiryTime, 10);
      
      if (now > expiry) {
        console.log('🔍 [SessionStorage] Session expired, clearing');
        this.clearSession();
        return null;
      }
      
      const parsedSession = JSON.parse(sessionData);
      console.log('🔍 [SessionStorage] Session loaded successfully');
      
      return {
        user: parsedSession.user,
        isAuthenticated: parsedSession.isAuthenticated,
        lastChecked: parsedSession.lastChecked || 0,
        hasCompletedOnboarding: parsedSession.hasCompletedOnboarding || false
      };
    } catch (error) {
      console.error('❌ [SessionStorage] Failed to load session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Clear session data from localStorage
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      console.log('🔍 [SessionStorage] Session cleared successfully');
    } catch (error) {
      console.error('❌ [SessionStorage] Failed to clear session:', error);
    }
  }

  /**
   * Check if session exists and is valid
   */
  static hasValidSession(): boolean {
    const session = this.loadSession();
    return session !== null && session.isAuthenticated;
  }

  /**
   * Update specific session properties
   */
  static updateSession(updates: Partial<SessionData>): void {
    const currentSession = this.loadSession();
    if (currentSession) {
      const updatedSession = { ...currentSession, ...updates };
      this.saveSession(updatedSession);
    }
  }
}
