import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSession } from '../useSession';
import { SessionStorage } from '../../utils/sessionStorage';

// Mock SessionStorage
vi.mock('../../utils/sessionStorage');
const mockSessionStorage = vi.mocked(SessionStorage);

// Mock fetch
global.fetch = vi.fn();

describe('useSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.loadSession.mockReturnValue(null);
    mockSessionStorage.saveSession.mockImplementation(() => {});
    mockSessionStorage.clearSession.mockImplementation(() => {});
  });

  describe('logout', () => {
    it('should clear session and redirect to landing page on successful logout', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useSession());

      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' };

      await act(async () => {
        await result.current.logout();
      });

      // Verify session was cleared
      expect(mockSessionStorage.clearSession).toHaveBeenCalled();

      // Verify logout API was called
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Verify redirect to landing page
      expect(window.location.href).toBe('/');
    });

    it('should handle logout API failure gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useSession());

      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' };

      await act(async () => {
        await result.current.logout();
      });

      // Verify session was still cleared
      expect(mockSessionStorage.clearSession).toHaveBeenCalled();

      // Verify logout API was called
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Verify redirect to landing page even on failure
      expect(window.location.href).toBe('/');
    });

    it('should handle network errors during logout', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const { result } = renderHook(() => useSession());

      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' };

      await act(async () => {
        await result.current.logout();
      });

      // Verify session was still cleared
      expect(mockSessionStorage.clearSession).toHaveBeenCalled();

      // Verify redirect to landing page even on network error
      expect(window.location.href).toBe('/');
    });
  });

  describe('clearSession', () => {
    it('should clear session data and reset state', () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.clearSession();
      });

      expect(mockSessionStorage.clearSession).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.hasCompletedOnboarding).toBe(false);
    });
  });

  describe('validateSession', () => {
    it('should validate session with backend and update state', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        createdAt: '2025-01-01T00:00:00.000Z',
        tz: 'UTC'
      };

      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUser)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ id: 'channel-1' }])
        });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useSession());

      await act(async () => {
        await result.current.validateSession();
      });

      // Verify API calls were made
      expect(mockFetch).toHaveBeenCalledWith('/api/me', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/channels/selected', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Verify session was saved
      expect(mockSessionStorage.saveSession).toHaveBeenCalled();
    });

    it('should handle session validation failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useSession());

      await act(async () => {
        await result.current.validateSession();
      });

      // Verify session was cleared on failure
      expect(mockSessionStorage.clearSession).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});

