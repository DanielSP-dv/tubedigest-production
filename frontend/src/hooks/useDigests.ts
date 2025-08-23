import { useQuery } from '@tanstack/react-query'
import type { Video } from '../components/molecules/VideoCard'

/**
 * Base API URL for backend requests
 * Uses Vite proxy configuration to forward /api requests to backend
 */
const API_BASE_URL = '/api'

/**
 * Custom error class for authentication-related errors
 * Helps distinguish auth errors from other API errors
 */
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/**
 * Fetch video digests from the backend API
 * Requires authentication - uses session cookies for auth
 * Transforms backend response to match frontend Video interface
 * 
 * @throws {AuthenticationError} When user is not authenticated (401)
 * @throws {Error} For other API errors
 * @returns Promise<Video[]> Array of video digest data
 */
const fetchDigests = async (): Promise<Video[]> => {
  console.log('🔍 [useDigests] Fetching digests from:', `${API_BASE_URL}/videos/digest`)
  
  const response = await fetch(`${API_BASE_URL}/videos/digest`, {
    credentials: 'include', // Include session cookies for authentication
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  console.log('🔍 [useDigests] Response status:', response.status)
  
  if (response.status === 401) {
    // User is not authenticated - throw specific auth error
    console.log('❌ [useDigests] Authentication required')
    throw new AuthenticationError('Authentication required. Please sign in to view your digests.')
  }
  
  if (!response.ok) {
    // Other API errors
    console.log('❌ [useDigests] API error:', response.status, response.statusText)
    throw new Error(`Failed to fetch digests: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  console.log('✅ [useDigests] Received data:', data)
  
  // Transform the API response to match the Video interface
  // Ensures type safety and consistent data structure
  const transformedData = data.map((item: any) => ({
    id: item.id,
    title: item.title,
    channel: item.channel,
    summary: item.summary,
    chapters: item.chapters,
    thumbnail: item.thumbnail,
    url: item.url,
    duration: item.duration,
    publishedAt: item.publishedAt,
  }))
  
  console.log('✅ [useDigests] Transformed data:', transformedData)
  return transformedData
}

/**
 * React Query hook for fetching video digests
 * Handles caching, retries, and error states
 * Automatically handles authentication errors
 * 
 * @returns Query result with digests data, loading state, and error handling
 */
export const useDigests = () => {
  console.log('🔍 [useDigests] Hook called')
  
  const result = useQuery({
    queryKey: ['digests'],
    queryFn: fetchDigests,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection
    retry: (failureCount, error) => {
      // Don't retry authentication errors - user needs to sign in
      if (error instanceof AuthenticationError) {
        return false
      }
      
      // Retry up to 3 times for network errors, but not for 4xx errors
      if (failureCount >= 3) return false
      
      // Only retry network-related errors, not client errors
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        return true
      }
      
      return false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
  
  console.log('🔍 [useDigests] Query result:', {
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    data: result.data
  })
  
  return result
}
