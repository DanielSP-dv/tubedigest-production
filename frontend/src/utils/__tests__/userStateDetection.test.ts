import { UserStateDetection } from '../userStateDetection';
import type { SessionData } from '../sessionStorage';

describe('UserStateDetection', () => {
  const mockSessionData: SessionData = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
      createdAt: '2025-01-01T00:00:00.000Z',
      tz: 'UTC',
      cadence: 'daily-09:00'
    },
    isAuthenticated: true,
    lastChecked: Date.now(),
    hasCompletedOnboarding: true
  };

  describe('detectUserState', () => {
    it('should detect new user when no session data', () => {
      const userState = UserStateDetection.detectUserState(null);

      expect(userState).toEqual({
        isNewUser: true,
        isReturningUser: false,
        needsOnboarding: true,
        isFullyOnboarded: false
      });
    });

    it('should detect returning user when authenticated and onboarded', () => {
      const userState = UserStateDetection.detectUserState(mockSessionData);

      expect(userState).toEqual({
        isNewUser: false,
        isReturningUser: true,
        needsOnboarding: false,
        isFullyOnboarded: true
      });
    });

    it('should detect user needing onboarding when authenticated but not onboarded', () => {
      const sessionDataNeedingOnboarding: SessionData = {
        ...mockSessionData,
        hasCompletedOnboarding: false
      };

      const userState = UserStateDetection.detectUserState(sessionDataNeedingOnboarding);

      expect(userState).toEqual({
        isNewUser: false,
        isReturningUser: false,
        needsOnboarding: true,
        isFullyOnboarded: false
      });
    });

    it('should detect new user when not authenticated', () => {
      const unauthenticatedSession: SessionData = {
        ...mockSessionData,
        isAuthenticated: false
      };

      const userState = UserStateDetection.detectUserState(unauthenticatedSession);

      expect(userState).toEqual({
        isNewUser: true,
        isReturningUser: false,
        needsOnboarding: true,
        isFullyOnboarded: false
      });
    });
  });

  describe('shouldRedirectToOnboarding', () => {
    it('should return true when user needs onboarding', () => {
      const sessionDataNeedingOnboarding: SessionData = {
        ...mockSessionData,
        hasCompletedOnboarding: false
      };

      const result = UserStateDetection.shouldRedirectToOnboarding(sessionDataNeedingOnboarding);

      expect(result).toBe(true);
    });

    it('should return false when user is fully onboarded', () => {
      const result = UserStateDetection.shouldRedirectToOnboarding(mockSessionData);

      expect(result).toBe(false);
    });

    it('should return true when no session data', () => {
      const result = UserStateDetection.shouldRedirectToOnboarding(null);

      expect(result).toBe(true);
    });
  });

  describe('shouldRedirectToDashboard', () => {
    it('should return true when user is fully onboarded', () => {
      const result = UserStateDetection.shouldRedirectToDashboard(mockSessionData);

      expect(result).toBe(true);
    });

    it('should return false when user needs onboarding', () => {
      const sessionDataNeedingOnboarding: SessionData = {
        ...mockSessionData,
        hasCompletedOnboarding: false
      };

      const result = UserStateDetection.shouldRedirectToDashboard(sessionDataNeedingOnboarding);

      expect(result).toBe(false);
    });

    it('should return false when no session data', () => {
      const result = UserStateDetection.shouldRedirectToDashboard(null);

      expect(result).toBe(false);
    });
  });

  describe('getRedirectPath', () => {
    it('should return landing page for unauthenticated users', () => {
      const result = UserStateDetection.getRedirectPath(null);

      expect(result).toBe('/');
    });

    it('should return channels for users needing onboarding', () => {
      const sessionDataNeedingOnboarding: SessionData = {
        ...mockSessionData,
        hasCompletedOnboarding: false
      };

      const result = UserStateDetection.getRedirectPath(sessionDataNeedingOnboarding);

      expect(result).toBe('/channels');
    });

    it('should return dashboard for fully onboarded users', () => {
      const result = UserStateDetection.getRedirectPath(mockSessionData);

      expect(result).toBe('/dashboard');
    });
  });

  describe('hasValidPersistentSession', () => {
    it('should return true for recent valid session', () => {
      const recentSession: SessionData = {
        ...mockSessionData,
        lastChecked: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
      };

      const result = UserStateDetection.hasValidPersistentSession(recentSession);

      expect(result).toBe(true);
    });

    it('should return false for expired session', () => {
      const expiredSession: SessionData = {
        ...mockSessionData,
        lastChecked: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      const result = UserStateDetection.hasValidPersistentSession(expiredSession);

      expect(result).toBe(false);
    });

    it('should return false for unauthenticated session', () => {
      const unauthenticatedSession: SessionData = {
        ...mockSessionData,
        isAuthenticated: false
      };

      const result = UserStateDetection.hasValidPersistentSession(unauthenticatedSession);

      expect(result).toBe(false);
    });

    it('should return false for null session', () => {
      const result = UserStateDetection.hasValidPersistentSession(null);

      expect(result).toBe(false);
    });
  });
});

