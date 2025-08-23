import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { authService, useAuth } from '../auth'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.location
const mockLocation = {
  href: '',
  search: '',
  pathname: '/',
  replaceState: vi.fn()
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

// Mock window.history
const mockHistory = {
  replaceState: vi.fn()
}
Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true
})

// Mock console methods to reduce noise in tests
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
}
global.console = mockConsole

describe('AuthService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    mockLocation.href = ''
    mockLocation.search = ''
    mockLocation.pathname = '/'
    
    // Reset auth service state
    const instance = authService as any
    instance.authState = {
      user: null,
      isLoading: true,
      isAuthenticated: false
    }
    instance.listeners = []
  })

  afterEach(() => {
    // Clean up environment variables
    delete import.meta.env.VITE_API_URL
  })

  describe('getInstance', () => {
    it('should return the same instance (singleton pattern)', () => {
      const instance1 = authService
      const instance2 = authService
      expect(instance1).toBe(instance2)
    })
  })

  describe('login', () => {
    it('should redirect to backend OAuth endpoint', async () => {
      // Set environment variable
      import.meta.env.VITE_API_URL = 'http://localhost:3001'

      await authService.login()

      expect(mockLocation.href).toBe('http://localhost:3001/auth/google')
    })

    it('should use default API URL when VITE_API_URL is not set', async () => {
      await authService.login()

      expect(mockLocation.href).toBe('http://localhost:3001/auth/google')
    })

    it('should handle login errors gracefully', async () => {
      // Mock window.location.href to throw an error
      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          href: {
            set: () => {
              throw new Error('Navigation blocked')
            }
          }
        },
        writable: true
      })

      await expect(authService.login()).rejects.toThrow('Navigation blocked')
    })
  })

  describe('logout', () => {
    it('should clear authentication state and call backend logout', async () => {
      // Set up initial authenticated state
      const instance = authService as any
      instance.authState = {
        user: { id: '1', email: 'test@example.com', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true
      }

      // Mock successful backend logout
      mockFetch.mockResolvedValueOnce({ ok: true })

      await authService.logout()

      // Check that state was cleared
      expect(authService.getAuthState()).toEqual({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })

      // Check that backend logout was called
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/auth/logout',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include'
        })
      )
    })

    it('should handle backend logout errors gracefully', async () => {
      // Mock failed backend logout
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await authService.logout()

      // Should still clear local state even if backend call fails
      expect(authService.getAuthState()).toEqual({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    })
  })

  describe('checkAuthStatus', () => {
    it('should handle OAuth success callback', async () => {
      // Mock OAuth success callback
      mockLocation.search = '?auth=success'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', email: 'test@example.com', createdAt: '2023-01-01' })
      })

      await authService.checkAuthStatus()

      // Check that URL was cleaned up
      expect(mockHistory.replaceState).toHaveBeenCalledWith({}, document.title, '/')

      // Check that user was authenticated
      expect(authService.getAuthState()).toEqual({
        user: { id: '1', email: 'test@example.com', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true
      })
    })

    it('should handle OAuth error callback', async () => {
      // Mock OAuth error callback
      mockLocation.search = '?auth=error'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', email: 'test@example.com', createdAt: '2023-01-01' })
      })

      await authService.checkAuthStatus()

      // Check that URL was cleaned up
      expect(mockHistory.replaceState).toHaveBeenCalledWith({}, document.title, '/')

      // Check that user was not authenticated
      expect(authService.getAuthState()).toEqual({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    })

    it('should handle successful authentication', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', email: 'test@example.com', createdAt: '2023-01-01' })
      })

      await authService.checkAuthStatus()

      expect(authService.getAuthState()).toEqual({
        user: { id: '1', email: 'test@example.com', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true
      })
    })

    it('should handle 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      })

      await authService.checkAuthStatus()

      expect(authService.getAuthState()).toEqual({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await authService.checkAuthStatus()

      expect(authService.getAuthState()).toEqual({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    })

    it('should handle unexpected HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      await authService.checkAuthStatus()

      expect(authService.getAuthState()).toEqual({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    })
  })

  describe('subscribe and notifyListeners', () => {
    it('should notify listeners when state changes', async () => {
      const listener = vi.fn()
      const unsubscribe = authService.subscribe(listener)

      // Trigger state change
      await authService.checkAuthStatus()

      expect(listener).toHaveBeenCalled()
      unsubscribe()
    })

    it('should allow unsubscribing from notifications', async () => {
      const listener = vi.fn()
      const unsubscribe = authService.subscribe(listener)
      unsubscribe()

      // Trigger state change
      await authService.checkAuthStatus()

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('utility methods', () => {
    it('should return correct authentication status', () => {
      const instance = authService as any
      
      // Test unauthenticated state
      instance.authState = {
        user: null,
        isLoading: false,
        isAuthenticated: false
      }
      expect(authService.isAuthenticated()).toBe(false)

      // Test authenticated state
      instance.authState = {
        user: { id: '1', email: 'test@example.com', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true
      }
      expect(authService.isAuthenticated()).toBe(true)
    })

    it('should return current user data', () => {
      const user = { id: '1', email: 'test@example.com', createdAt: '2023-01-01' }
      const instance = authService as any
      instance.authState = {
        user,
        isLoading: false,
        isAuthenticated: true
      }

      expect(authService.getCurrentUser()).toEqual(user)
    })

    it('should return null for current user when not authenticated', () => {
      const instance = authService as any
      instance.authState = {
        user: null,
        isLoading: false,
        isAuthenticated: false
      }

      expect(authService.getCurrentUser()).toBeNull()
    })
  })
})

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.search = ''
  })

  it('should initialize with auth service state', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isAuthenticated')
    expect(result.current).toHaveProperty('login')
    expect(result.current).toHaveProperty('logout')
    expect(result.current).toHaveProperty('isAuthenticated')
    expect(result.current).toHaveProperty('getCurrentUser')
  })

  it('should call checkAuthStatus on mount', () => {
    const checkAuthSpy = vi.spyOn(authService, 'checkAuthStatus')
    
    renderHook(() => useAuth())

    expect(checkAuthSpy).toHaveBeenCalled()
  })

  it('should subscribe to auth state changes', () => {
    const subscribeSpy = vi.spyOn(authService, 'subscribe')
    
    renderHook(() => useAuth())

    expect(subscribeSpy).toHaveBeenCalled()
  })

  it('should provide bound methods', () => {
    const { result } = renderHook(() => useAuth())

    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.logout).toBe('function')
    expect(typeof result.current.isAuthenticated).toBe('function')
    expect(typeof result.current.getCurrentUser).toBe('function')
  })
})
