import type { SessionData } from './sessionStorage';

export interface UserState {
  isNewUser: boolean;
  isReturningUser: boolean;
  needsOnboarding: boolean;
  isFullyOnboarded: boolean;
}

/**
 * User State Detection Utility
 * Determines user state based on session data and onboarding status
 */
export class UserStateDetection {
  /**
   * Detect user state from session data
   */
  static detectUserState(sessionData: SessionData | null): UserState {
    if (!sessionData || !sessionData.isAuthenticated) {
      return {
        isNewUser: true,
        isReturningUser: false,
        needsOnboarding: true,
        isFullyOnboarded: false
      };
    }

    const hasCompletedOnboarding = sessionData.hasCompletedOnboarding;
    const hasUserData = !!sessionData.user;

    return {
      isNewUser: !hasUserData,
      isReturningUser: hasUserData && hasCompletedOnboarding,
      needsOnboarding: hasUserData && !hasCompletedOnboarding,
      isFullyOnboarded: hasUserData && hasCompletedOnboarding
    };
  }

  /**
   * Check if user should be redirected to onboarding
   */
  static shouldRedirectToOnboarding(sessionData: SessionData | null): boolean {
    const userState = this.detectUserState(sessionData);
    return userState.needsOnboarding;
  }

  /**
   * Check if user should be redirected to dashboard
   */
  static shouldRedirectToDashboard(sessionData: SessionData | null): boolean {
    const userState = this.detectUserState(sessionData);
    return userState.isFullyOnboarded;
  }

  /**
   * Get appropriate redirect path based on user state
   */
  static getRedirectPath(sessionData: SessionData | null): string {
    if (!sessionData || !sessionData.isAuthenticated) {
      return '/';
    }

    if (this.shouldRedirectToOnboarding(sessionData)) {
      return '/channels';
    }

    if (this.shouldRedirectToDashboard(sessionData)) {
      return '/dashboard';
    }

    return '/';
  }

  /**
   * Check if user has valid session that should persist
   */
  static hasValidPersistentSession(sessionData: SessionData | null): boolean {
    if (!sessionData) return false;
    
    // Check if session is recent (within last 24 hours)
    const sessionAge = Date.now() - sessionData.lastChecked;
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return sessionData.isAuthenticated && sessionAge < maxSessionAge;
  }
}
