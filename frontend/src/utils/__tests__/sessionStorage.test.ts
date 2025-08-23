import { SessionStorage } from '../sessionStorage';
import type { SessionData } from '../sessionStorage';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('SessionStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

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

  describe('saveSession', () => {
    it('should save session data to localStorage', () => {
      SessionStorage.saveSession(mockSessionData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tubedigest_session',
        expect.stringContaining('"user"')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tubedigest_session_expiry',
        expect.any(String)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        SessionStorage.saveSession(mockSessionData);
      }).not.toThrow();
    });
  });

  describe('loadSession', () => {
    it('should load valid session data from localStorage', () => {
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({ ...mockSessionData, lastSaved: Date.now() }))
        .mockReturnValueOnce(expiryTime.toString());

      const result = SessionStorage.loadSession();

      expect(result).toEqual(mockSessionData);
    });

    it('should return null when no session data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = SessionStorage.loadSession();

      expect(result).toBeNull();
    });

    it('should return null when session has expired', () => {
      const expiredTime = Date.now() - (24 * 60 * 60 * 1000);
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({ ...mockSessionData, lastSaved: Date.now() }))
        .mockReturnValueOnce(expiredTime.toString());

      const result = SessionStorage.loadSession();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tubedigest_session');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tubedigest_session_expiry');
    });

    it('should handle JSON parsing errors gracefully', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('invalid json')
        .mockReturnValueOnce(Date.now().toString());

      const result = SessionStorage.loadSession();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tubedigest_session');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tubedigest_session_expiry');
    });
  });

  describe('clearSession', () => {
    it('should clear session data from localStorage', () => {
      SessionStorage.clearSession();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tubedigest_session');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tubedigest_session_expiry');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        SessionStorage.clearSession();
      }).not.toThrow();
    });
  });

  describe('hasValidSession', () => {
    it('should return true for valid session', () => {
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({ ...mockSessionData, lastSaved: Date.now() }))
        .mockReturnValueOnce(expiryTime.toString());

      const result = SessionStorage.hasValidSession();

      expect(result).toBe(true);
    });

    it('should return false for invalid session', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = SessionStorage.hasValidSession();

      expect(result).toBe(false);
    });
  });

  describe('updateSession', () => {
    it('should update existing session data', () => {
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({ ...mockSessionData, lastSaved: Date.now() }))
        .mockReturnValueOnce(expiryTime.toString());

      const updates = { hasCompletedOnboarding: false };
      SessionStorage.updateSession(updates);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tubedigest_session',
        expect.stringContaining('"hasCompletedOnboarding":false')
      );
    });

    it('should not update when no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const updates = { hasCompletedOnboarding: false };
      SessionStorage.updateSession(updates);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
});
