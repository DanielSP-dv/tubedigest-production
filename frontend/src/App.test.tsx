import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

// Mock the auth service
vi.mock('./services/auth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('App', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  it('renders the app without crashing', () => {
    renderWithProviders(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders the landing page by default', () => {
    renderWithProviders(<App />)
    expect(screen.getByText(/TubeDigest/i)).toBeInTheDocument()
  })

  it('renders the main navigation', () => {
    renderWithProviders(<App />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders the footer', () => {
    renderWithProviders(<App />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('handles routing correctly', () => {
    renderWithProviders(<App />)
    // Should render landing page by default
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument()
  })

  it('renders with proper accessibility attributes', () => {
    renderWithProviders(<App />)
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Main content')
  })

  it('renders with proper semantic HTML structure', () => {
    renderWithProviders(<App />)
    expect(screen.getByRole('banner')).toBeInTheDocument() // Header
    expect(screen.getByRole('main')).toBeInTheDocument() // Main content
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // Footer
  })

  it('renders with proper theme configuration', () => {
    renderWithProviders(<App />)
    // Check that Ant Design theme is applied
    const appElement = screen.getByRole('main').closest('div')
    expect(appElement).toHaveClass('ant-app')
  })

  it('handles error boundaries gracefully', () => {
    // This test ensures the app doesn't crash on errors
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    renderWithProviders(<App />)
    
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('renders with proper viewport meta tags', () => {
    renderWithProviders(<App />)
    // Check that the document has proper viewport configuration
    expect(document.querySelector('meta[name="viewport"]')).toBeInTheDocument()
  })

  it('renders with proper document title', () => {
    renderWithProviders(<App />)
    expect(document.title).toBe('TubeDigest')
  })
})
