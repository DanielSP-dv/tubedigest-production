import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import ChannelManagementSidebar from '../ChannelManagementSidebar'

// Mock the useChannels hook
const mockUseChannels = vi.fn()

vi.mock('../../../hooks/useChannels', () => ({
  useChannels: () => mockUseChannels(),
}))

// Create a wrapper component for testing
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(component, { wrapper: createWrapper() })
}

describe('ChannelManagementSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading skeleton when channels are loading', () => {
      mockUseChannels.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        selectedChannels: [],
        saveChannelSelection: vi.fn(),
        isSaving: false,
      })

      renderWithProviders(<ChannelManagementSidebar />)

      // Check that skeleton elements are rendered
      expect(screen.getByTestId('skeleton-loading')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error message when channels fail to load', () => {
      mockUseChannels.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch channels'),
        selectedChannels: [],
        saveChannelSelection: vi.fn(),
        isSaving: false,
      })

      renderWithProviders(<ChannelManagementSidebar />)

      expect(screen.getByText('Error loading channels')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch channels')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })
  })

  describe('Channel List', () => {
    const mockChannels = [
      {
        id: 'channel1',
        title: 'Test Channel 1',
        thumbnail: 'test-thumbnail-1.jpg',
        subscriberCount: 1000,
        videoCount: 50,
        isSubscribed: true,
        lastUpdated: '2023-01-01T00:00:00Z',
      },
      {
        id: 'channel2',
        title: 'Test Channel 2',
        thumbnail: 'test-thumbnail-2.jpg',
        subscriberCount: 2000,
        videoCount: 100,
        isSubscribed: true,
        lastUpdated: '2023-01-02T00:00:00Z',
      },
    ]

    const mockSelectedChannels = [
      { channelId: 'channel1', title: 'Test Channel 1' },
    ]

    it('renders channel list with toggle switches', () => {
      mockUseChannels.mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
        selectedChannels: mockSelectedChannels,
        saveChannelSelection: vi.fn(),
        isSaving: false,
      })

      renderWithProviders(<ChannelManagementSidebar />)

      expect(screen.getByText('Test Channel 1')).toBeInTheDocument()
      expect(screen.getByText('Test Channel 2')).toBeInTheDocument()
      expect(screen.getByText('Selected for Digest')).toBeInTheDocument()
      
      // Check that toggle switches are present
      const switches = screen.getAllByRole('switch')
      expect(switches).toHaveLength(2)
    })

    it('handles channel toggle correctly', async () => {
      const mockSave = vi.fn()
      mockUseChannels.mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
        selectedChannels: mockSelectedChannels,
        saveChannelSelection: mockSave,
        isSaving: false,
      })

      renderWithProviders(<ChannelManagementSidebar />)

      // Find and click the toggle for channel 2 (not selected)
      const channel2Toggle = screen.getAllByRole('switch')[1]
      fireEvent.click(channel2Toggle)

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith({
          channelIds: ['channel1', 'channel2'],
          titles: {
            channel1: 'Test Channel 1',
            channel2: 'Test Channel 2',
          },
        })
      })
    })

    it('shows channel limit warning when 10 channels are selected', () => {
      const mockSelectedChannels = Array.from({ length: 10 }, (_, i) => ({
        channelId: `channel${i + 1}`,
        title: `Test Channel ${i + 1}`,
      }))

      mockUseChannels.mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
        selectedChannels: mockSelectedChannels,
        saveChannelSelection: vi.fn(),
        isSaving: false,
      })

      renderWithProviders(<ChannelManagementSidebar />)

      expect(screen.getByText('Channel limit reached (10/10)')).toBeInTheDocument()
    })
  })

  describe('Select All/Deselect All', () => {
    const mockChannels = [
      { id: 'channel1', title: 'Test Channel 1' },
      { id: 'channel2', title: 'Test Channel 2' },
    ]

    it('renders select all button when channels are available', () => {
      mockUseChannels.mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
        selectedChannels: [],
        saveChannelSelection: vi.fn(),
        isSaving: false,
      })

      renderWithProviders(<ChannelManagementSidebar />)

      expect(screen.getByText('Select All')).toBeInTheDocument()
    })

    it('handles select all action', async () => {
      const mockSave = vi.fn()
      mockUseChannels.mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
        selectedChannels: [],
        saveChannelSelection: mockSave,
        isSaving: false,
      })

      renderWithProviders(<ChannelManagementSidebar />)

      const selectAllButton = screen.getByText('Select All')
      fireEvent.click(selectAllButton)

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith({
          channelIds: ['channel1', 'channel2'],
          titles: {
            channel1: 'Test Channel 1',
            channel2: 'Test Channel 2',
          },
        })
      })
    })
  })

  describe('Action Buttons', () => {
    const mockChannels = [
      { id: 'channel1', title: 'Test Channel 1' },
    ]

    it('calls onEditChannels when edit button is clicked', () => {
      const mockOnEditChannels = vi.fn()
      
      mockUseChannels.mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
        selectedChannels: [],
        saveChannelSelection: vi.fn(),
        isSaving: false,
      })

      renderWithProviders(
        <ChannelManagementSidebar onEditChannels={mockOnEditChannels} />
      )

      const editButton = screen.getByRole('button', { name: /Edit/i })
      fireEvent.click(editButton)

      expect(mockOnEditChannels).toHaveBeenCalledTimes(1)
    })

    it('calls onRefresh when refresh button is clicked', () => {
      const mockOnRefresh = vi.fn()
      
      mockUseChannels.mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
        selectedChannels: [],
        saveChannelSelection: vi.fn(),
        isSaving: false,
      })

      renderWithProviders(
        <ChannelManagementSidebar onRefresh={mockOnRefresh} />
      )

      const refreshButton = screen.getByRole('button', { name: /Refresh channels/i })
      fireEvent.click(refreshButton)

      expect(mockOnRefresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no channels are available', () => {
      mockUseChannels.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        selectedChannels: [],
        saveChannelSelection: vi.fn(),
        isSaving: false,
      })

      renderWithProviders(<ChannelManagementSidebar />)

      expect(screen.getByText('No channels available')).toBeInTheDocument()
      expect(screen.getByText('Connect your YouTube account to see your subscriptions')).toBeInTheDocument()
    })
  })
})
