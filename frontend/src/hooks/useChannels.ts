import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCSRF } from './useCSRF'
import { apiClient } from '../utils/apiClient'

interface Channel {
  id: string
  title: string
  subscriberCount: number
  videoCount: number
  isSubscribed: boolean
  lastUpdated: string
  thumbnail?: string
}

interface BackendChannel {
  channelId: string
  title: string
  thumbnail?: string
}

interface SelectedChannel {
  channelId: string
  title: string
}

const API_BASE_URL = '/api'

// Fetch all user's YouTube subscriptions
const fetchChannels = async (): Promise<Channel[]> => {
  const response = await fetch(`${API_BASE_URL}/channels`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required. Please sign in.')
    }
    if (response.status === 503) {
      throw new Error('YouTube API temporarily unavailable. Please try again later.')
    }
    throw new Error(`Failed to fetch channels: ${response.statusText}`)
  }
  
  const data: BackendChannel[] = await response.json()
  
  // Transform API response to match Channel interface
  return data.map((item) => ({
    id: item.channelId,
    title: item.title,
    subscriberCount: 0, // Not available in current API
    videoCount: 0, // Not available in current API
    isSubscribed: false, // Will be determined by selected channels
    lastUpdated: new Date().toISOString(),
    thumbnail: item.thumbnail,
  }))
}

// Fetch user's selected channels for digests
const fetchSelectedChannels = async (): Promise<SelectedChannel[]> => {
  const response = await fetch(`${API_BASE_URL}/channels/selected`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required. Please sign in.')
    }
    throw new Error(`Failed to fetch selected channels: ${response.statusText}`)
  }
  
  return await response.json()
}

export const useChannels = () => {
  const queryClient = useQueryClient()
  const { getCSRFToken } = useCSRF()

  // Save channel selection
  const saveChannelSelection = async (params: { channelIds: string[]; titles: Record<string, string> }): Promise<void> => {
    // Get CSRF token
    const csrfToken = await getCSRFToken();
    if (!csrfToken) {
      throw new Error('Failed to get CSRF token');
    }

    // Set the token in the API client
    apiClient.setCSRFToken(csrfToken);
    
    // Use the secure API client
    const response = await apiClient.post('/channels/select', params);
    
    // Handle specific error cases
    if (response.error) {
      if (response.error.includes('limit_exceeded')) {
        throw new Error('Maximum 10 channels allowed. Please remove some channels first.')
      }
      if (response.error.includes('Authentication required')) {
        throw new Error('Authentication required. Please sign in.')
      }
      throw new Error(`Failed to save channel selection: ${response.error}`)
    }
  }

  // Fetch all available channels
  const { 
    data: allChannels, 
    isLoading: isLoadingChannels, 
    error: channelsError 
  } = useQuery({
    queryKey: ['channels'],
    queryFn: fetchChannels,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message.includes('Authentication required')) {
        return false
      }
      return failureCount < 3
    },
  })

  // Fetch selected channels
  const { 
    data: selectedChannels, 
    isLoading: isLoadingSelected, 
    error: selectedError 
  } = useQuery({
    queryKey: ['selected-channels'],
    queryFn: fetchSelectedChannels,
    staleTime: 0, // Always refetch to ensure fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('Authentication required')) {
        return false
      }
      return failureCount < 3
    },
  })

  // Combine data and mark selected channels
  const channels = allChannels?.map(channel => ({
    ...channel,
    isSubscribed: selectedChannels?.some(selected => selected.channelId === channel.id) ?? false,
  })) ?? []
  


  // Save channel selection mutation
  const saveSelectionMutation = useMutation({
    mutationFn: saveChannelSelection,
    onSuccess: () => {
      // Invalidate and refetch selected channels
      queryClient.invalidateQueries({ queryKey: ['selected-channels'] })
    },
    onError: (error: Error) => {
      console.error('Failed to save channel selection:', error)
    },
  })

  // Legacy functions for backward compatibility
  const subscribeToChannel = async (channelId: string): Promise<void> => {
    const channel = channels.find(c => c.id === channelId)
    if (!channel) {
      throw new Error('Channel not found')
    }
    
    const currentSelected = selectedChannels?.map(c => c.channelId) ?? []
    const newSelection = [...currentSelected, channelId]
    
    if (newSelection.length > 10) {
      throw new Error('Maximum 10 channels allowed')
    }
    
    const titles: Record<string, string> = {}
    newSelection.forEach(id => {
      const ch = channels.find(c => c.id === id)
      if (ch) titles[id] = ch.title
    })
    
    await saveSelectionMutation.mutateAsync({ channelIds: newSelection, titles })
  }

  const unsubscribeFromChannel = async (channelId: string): Promise<void> => {
    const currentSelected = selectedChannels?.map(c => c.channelId) ?? []
    const newSelection = currentSelected.filter(id => id !== channelId)
    
    const titles: Record<string, string> = {}
    newSelection.forEach(id => {
      const ch = channels.find(c => c.id === id)
      if (ch) titles[id] = ch.title
    })
    
    await saveSelectionMutation.mutateAsync({ channelIds: newSelection, titles })
  }

  // Manual cache invalidation function
  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: ['selected-channels'] });
    queryClient.invalidateQueries({ queryKey: ['channels'] });
  };

  return {
    data: channels,
    isLoading: isLoadingChannels || isLoadingSelected,
    error: channelsError || selectedError,
    selectedChannels,
    subscribeToChannel: subscribeToChannel,
    unsubscribeFromChannel: unsubscribeFromChannel,
    saveChannelSelection: saveSelectionMutation.mutateAsync,
    isSaving: saveSelectionMutation.isPending,
    saveError: saveSelectionMutation.error,
    invalidateCache,
  }
}
