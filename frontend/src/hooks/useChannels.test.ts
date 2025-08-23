import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock console.error to avoid noise in tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('Channel Management API', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('fetchChannels', () => {
    it('should fetch channels successfully', async () => {
      const mockChannels = [
        { channelId: '1', title: 'Test Channel 1', thumbnail: 'http://example.com/thumb1.jpg' },
        { channelId: '2', title: 'Test Channel 2', thumbnail: 'http://example.com/thumb2.jpg' },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChannels,
      })

      const response = await fetch('/api/channels', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data).toEqual(mockChannels)
    })

    it('should handle authentication error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      const response = await fetch('/api/channels', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should handle YouTube API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      })

      const response = await fetch('/api/channels', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(503)
    })
  })

  describe('fetchSelectedChannels', () => {
    it('should fetch selected channels successfully', async () => {
      const mockSelectedChannels = [
        { channelId: '1', title: 'Selected Channel 1' },
        { channelId: '2', title: 'Selected Channel 2' },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSelectedChannels,
      })

      const response = await fetch('/api/channels/selected', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data).toEqual(mockSelectedChannels)
    })
  })

  describe('saveChannelSelection', () => {
    it('should save channel selection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      })

      const response = await fetch('/api/channels/select', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelIds: ['1', '2'],
          titles: { '1': 'Channel 1', '2': 'Channel 2' },
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data).toEqual({ ok: true })
    })

    it('should handle limit exceeded error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'limit_exceeded' }),
      })

      const response = await fetch('/api/channels/select', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
          titles: {},
        }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.message).toBe('limit_exceeded')
    })
  })
})
