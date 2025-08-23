import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDigests } from '../useDigests'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock console methods to reduce noise in tests
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
}
global.console = mockConsole

// Create a wrapper component for testing React Query hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for testing
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useDigests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('successful API calls', () => {
    it('should fetch and transform digests data successfully', async () => {
      const mockDigests = [
        {
          id: '1',
          title: 'Test Video 1',
          channel: 'Test Channel',
          summary: 'Test summary 1',
          chapters: [{ title: 'Chapter 1', startTime: 0 }],
          thumbnail: 'test-thumbnail-1.jpg',
          url: 'https://youtube.com/watch?v=1',
          duration: '10:30',
          publishedAt: '2023-01-01T00:00:00Z'
        },
        {
          id: '2',
          title: 'Test Video 2',
          channel: 'Test Channel',
          summary: 'Test summary 2',
          chapters: [{ title: 'Chapter 1', startTime: 0 }],
          thumbnail: 'test-thumbnail-2.jpg',
          url: 'https://youtube.com/watch?v=2',
          duration: '15:45',
          publishedAt: '2023-01-02T00:00:00Z'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDigests
      })

      const { result } = renderHook(() => useDigests(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockDigests)
      expect(mockFetch).toHaveBeenCalledWith('/api/videos/digest', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should handle empty digests array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

      const { result } = renderHook(() => useDigests(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
    })
  })

  describe('authentication errors', () => {
    it('should handle 401 authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const { result } = renderHook(() => useDigests(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toContain('Authentication required')
    })

    it('should not retry authentication errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const { result } = renderHook(() => useDigests(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Should only be called once (no retries for auth errors)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('other API errors', () => {
    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const { result } = renderHook(() => useDigests(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toContain('Failed to fetch digests: 500')
    })

    it('should handle 404 not found errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const { result } = renderHook(() => useDigests(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toContain('Failed to fetch digests: 404')
    })
  })

  describe('network errors', () => {
    it('should handle network connection errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useDigests(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toContain('Network error')
    })

    it('should retry network errors (with retries enabled)', async () => {
      // Create a query client with retries enabled for this test
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
          },
        },
      })
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )

      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useDigests(), {
        wrapper
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      }, { timeout: 5000 })

      // Should be called multiple times due to retries
      expect(mockFetch).toHaveBeenCalledTimes(4) // Initial call + 3 retries
    })
  })

  describe('data transformation', () => {
    it('should transform API response to match Video interface', async () => {
      const apiResponse = [
        {
          id: '1',
          title: 'Test Video',
          channel: 'Test Channel',
          summary: 'Test summary',
          chapters: [
            { title: 'Introduction', startTime: 0 },
            { title: 'Main Content', startTime: 120 }
          ],
          thumbnail: 'test-thumbnail.jpg',
          url: 'https://youtube.com/watch?v=1',
          duration: '10:30',
          publishedAt: '2023-01-01T00:00:00Z'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse
      })

      const { result } = renderHook(() => useDigests(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(apiResponse)
      expect(result.current.data?.[0]).toHaveProperty('id')
      expect(result.current.data?.[0]).toHaveProperty('title')
      expect(result.current.data?.[0]).toHaveProperty('channel')
      expect(result.current.data?.[0]).toHaveProperty('summary')
      expect(result.current.data?.[0]).toHaveProperty('chapters')
      expect(result.current.data?.[0]).toHaveProperty('thumbnail')
      expect(result.current.data?.[0]).toHaveProperty('url')
      expect(result.current.data?.[0]).toHaveProperty('duration')
      expect(result.current.data?.[0]).toHaveProperty('publishedAt')
    })
  })

  describe('query configuration', () => {
    it('should use correct query key', () => {
      const { result } = renderHook(() => useDigests(), {
        wrapper: createWrapper()
      })

      expect(result.current.queryKey).toEqual(['digests'])
    })

    it('should have appropriate stale time and cache time', () => {
      const { result } = renderHook(() => useDigests(), {
        wrapper: createWrapper()
      })

      // These values are set in the hook configuration
      // staleTime: 5 * 60 * 1000 (5 minutes)
      // gcTime: 10 * 60 * 1000 (10 minutes)
      expect(result.current.staleTime).toBe(5 * 60 * 1000)
      expect(result.current.gcTime).toBe(10 * 60 * 1000)
    })
  })
})
