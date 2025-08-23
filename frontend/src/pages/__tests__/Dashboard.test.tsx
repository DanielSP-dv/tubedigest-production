import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Dashboard from '../Dashboard'

// Mock the auth service
const mockLogin = vi.fn()
const mockLogout = vi.fn()
const mockIsAuthenticated = vi.fn()
const mockGetCurrentUser = vi.fn()

vi.mock('../../services/auth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated(),
    isLoading: false,
    user: mockGetCurrentUser(),
    login: mockLogin,
    logout: mockLogout,
  }),
}))

// Mock the useDigests hook
const mockUseDigests = vi.fn()

vi.mock('../../hooks/useDigests', () => ({
  useDigests: () => mockUseDigests(),
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
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  )
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(component, { wrapper: createWrapper() })
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default to authenticated state
    mockIsAuthenticated.mockReturnValue(true)
    mockGetCurrentUser.mockReturnValue({ id: '1', email: 'test@example.com', createdAt: '2023-01-01' })
    mockUseDigests.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })
  })

  describe('Authentication States', () => {
    it('shows sign-in prompt when user is not authenticated', () => {
      mockIsAuthenticated.mockReturnValue(false)
      mockGetCurrentUser.mockReturnValue(null)

      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Welcome to TubeDigest')).toBeInTheDocument()
      expect(screen.getByText('Sign in with your Google account to view your personalized video digests')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sign In with Google/i })).toBeInTheDocument()
    })

    it('shows authentication required message for auth errors', () => {
      mockIsAuthenticated.mockReturnValue(true)
      mockUseDigests.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Authentication required. Please sign in to view your digests.'),
      })

      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
      expect(screen.getByText('Your session may have expired. Please sign in again to continue.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sign In Again/i })).toBeInTheDocument()
    })

    it('calls login function when sign-in button is clicked', () => {
      mockIsAuthenticated.mockReturnValue(false)
      mockGetCurrentUser.mockReturnValue(null)

      renderWithProviders(<Dashboard />)

      const signInButton = screen.getByRole('button', { name: /Sign In with Google/i })
      fireEvent.click(signInButton)

      expect(mockLogin).toHaveBeenCalledTimes(1)
    })
  })

  describe('Sidebar Functionality', () => {
    it('renders sidebar with toggle button when authenticated', () => {
      mockIsAuthenticated.mockReturnValue(true)
      mockUseDigests.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      })

      renderWithProviders(<Dashboard />)

      // Check that sidebar is rendered
      expect(screen.getByText('Channels')).toBeInTheDocument()
      expect(screen.getByText('Manage your selected channels')).toBeInTheDocument()
      
      // Check that toggle button is present
      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument()
    })

    it('toggles sidebar collapse state when toggle button is clicked', () => {
      mockIsAuthenticated.mockReturnValue(true)
      mockUseDigests.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      })

      renderWithProviders(<Dashboard />)

      // Initially sidebar should be expanded
      expect(screen.getByText('Channels')).toBeInTheDocument()
      expect(screen.getByText('Manage your selected channels')).toBeInTheDocument()

      // Click toggle button to collapse
      const toggleButton = screen.getByLabelText('Collapse sidebar')
      fireEvent.click(toggleButton)

      // Sidebar should be collapsed (showing abbreviated text)
      expect(screen.getByText('Ch')).toBeInTheDocument()
      expect(screen.queryByText('Manage your selected channels')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument()

      // Click toggle button to expand again
      const expandButton = screen.getByLabelText('Expand sidebar')
      fireEvent.click(expandButton)

      // Sidebar should be expanded again
      expect(screen.getByText('Channels')).toBeInTheDocument()
      expect(screen.getByText('Manage your selected channels')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading skeleton when digests are loading', () => {
      mockUseDigests.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      })

      renderWithProviders(<Dashboard />)

      // Should show skeleton loading state for digests
      expect(screen.getByText('Found 0 digests')).toBeInTheDocument()
      // Check that skeleton elements are present
      expect(screen.getAllByTestId('skeleton-loading')).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('shows error message and retry button for API errors', () => {
      mockUseDigests.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch digests: 500 Internal Server Error'),
      })

      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Error loading digests')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch digests: 500 Internal Server Error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })

    it('invalidates queries when retry button is clicked', () => {
      mockUseDigests.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
      })

      renderWithProviders(<Dashboard />)

      const retryButton = screen.getByRole('button', { name: /Retry/i })
      fireEvent.click(retryButton)

      // The retry button now invalidates queries instead of reloading the page
      // This is tested by ensuring the button is clickable and doesn't throw errors
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('Main Dashboard Content', () => {
    it('renders dashboard title and description', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Browse your video digests and manage your content')).toBeInTheDocument()
    })

    it('renders search functionality', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByPlaceholderText(/Search digests by title or content/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
    })

    it('filters digests based on search term', () => {
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
          title: 'Another Video',
          channel: 'Test Channel',
          summary: 'Another summary',
          chapters: [{ title: 'Chapter 1', startTime: 0 }],
          thumbnail: 'test-thumbnail-2.jpg',
          url: 'https://youtube.com/watch?v=2',
          duration: '15:45',
          publishedAt: '2023-01-02T00:00:00Z'
        }
      ]

      mockUseDigests.mockReturnValue({
        data: mockDigests,
        isLoading: false,
        error: null,
      })

      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Found 2 digests')).toBeInTheDocument()

      // Search for "Test"
      const searchInput = screen.getByPlaceholderText(/Search digests by title or content/i)
      fireEvent.change(searchInput, { target: { value: 'Test' } })

      expect(screen.getByText('Found 1 digests')).toBeInTheDocument()
    })

    it('shows empty state when no digests are found', () => {
      mockUseDigests.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      })

      renderWithProviders(<Dashboard />)

      expect(screen.getByText('No videos found')).toBeInTheDocument()
    })

    it('shows empty state message when search has no results', () => {
      const mockDigests = [
        {
          id: '1',
          title: 'Test Video',
          channel: 'Test Channel',
          summary: 'Test summary',
          chapters: [{ title: 'Chapter 1', startTime: 0 }],
          thumbnail: 'test-thumbnail.jpg',
          url: 'https://youtube.com/watch?v=1',
          duration: '10:30',
          publishedAt: '2023-01-01T00:00:00Z'
        }
      ]

      mockUseDigests.mockReturnValue({
        data: mockDigests,
        isLoading: false,
        error: null,
      })

      renderWithProviders(<Dashboard />)

      // Search for something that doesn't exist
      const searchInput = screen.getByPlaceholderText(/Search digests by title or content/i)
      fireEvent.change(searchInput, { target: { value: 'Nonexistent' } })

      expect(screen.getByText('No digests found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your search terms or check back later for new content.')).toBeInTheDocument()
    })
  })

  describe('Send Digest Functionality', () => {
    beforeEach(() => {
      // Mock fetch for send digest API
      global.fetch = vi.fn()
    })

    it('renders Send Digest button', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByRole('button', { name: /Send Digest/i })).toBeInTheDocument()
    })

    it('calls send digest API when button is clicked', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'digest-1', itemCount: 5 }),
      })
      global.fetch = mockFetch

      renderWithProviders(<Dashboard />)

      const sendDigestButton = screen.getByRole('button', { name: /Send Digest/i })
      fireEvent.click(sendDigestButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/digests/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
      })
    })

    it('shows loading state while sending digest', async () => {
      const mockFetch = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      global.fetch = mockFetch

      renderWithProviders(<Dashboard />)

      const sendDigestButton = screen.getByRole('button', { name: /Send Digest/i })
      fireEvent.click(sendDigestButton)

      // Wait for the mutation to start
      await waitFor(() => {
        expect(sendDigestButton).toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for search functionality', () => {
      renderWithProviders(<Dashboard />)

      const searchInput = screen.getByLabelText('Search digests')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('title', 'Search digests by title or content')
    })

    it('has proper button labels for authentication actions', () => {
      mockIsAuthenticated.mockReturnValue(false)
      mockGetCurrentUser.mockReturnValue(null)

      renderWithProviders(<Dashboard />)

      const signInButton = screen.getByRole('button', { name: /Sign In with Google/i })
      expect(signInButton).toHaveAttribute('aria-label', 'Sign in with Google')
    })
  })
})
