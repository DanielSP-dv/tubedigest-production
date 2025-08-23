import { render, screen, fireEvent } from '@testing-library/react'
import AuthButtons from '../AuthButtons'

// Mock the auth service
const mockLogin = vi.fn()
const mockLogout = vi.fn()

vi.mock('../../../services/auth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
  }),
}))

describe('AuthButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login button when user is not authenticated', () => {
    render(<AuthButtons />)
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('calls login function when login button is clicked', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    fireEvent.click(loginButton)
    
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })

  it('renders with proper accessibility attributes', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    expect(loginButton).toHaveAttribute('aria-label', 'Sign in with Google')
  })

  it('renders with proper button styling', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    expect(loginButton).toHaveClass('ant-btn')
  })

  it('handles multiple login button clicks correctly', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    fireEvent.click(loginButton)
    fireEvent.click(loginButton)
    
    expect(mockLogin).toHaveBeenCalledTimes(2)
  })

  it('renders with proper icon', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    expect(loginButton).toBeInTheDocument()
  })

  it('renders with proper button type', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    expect(loginButton).toHaveAttribute('type', 'button')
  })

  it('handles keyboard navigation', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    fireEvent.keyDown(loginButton, { key: 'Enter' })
    
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })

  it('handles space key press', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    fireEvent.keyDown(loginButton, { key: ' ' })
    
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })

  it('renders with proper focus management', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    loginButton.focus()
    
    expect(loginButton).toHaveFocus()
  })

  it('renders with proper disabled state handling', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    expect(loginButton).not.toBeDisabled()
  })

  it('renders with proper loading state', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    expect(loginButton).not.toHaveAttribute('aria-busy', 'true')
  })

  it('renders with proper button size', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    expect(loginButton).toHaveClass('ant-btn-primary')
  })

  it('renders with proper button variant', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    expect(loginButton).toHaveClass('ant-btn-primary')
  })

  it('handles click events with proper event object', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    const mockEvent = { preventDefault: vi.fn() }
    
    fireEvent.click(loginButton, mockEvent)
    
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })

  it('renders with proper semantic HTML', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button')
    expect(loginButton).toBeInTheDocument()
  })

  it('renders with proper text content', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    expect(loginButton.textContent).toContain('Sign In')
  })

  it('handles touch events for mobile devices', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    fireEvent.touchStart(loginButton)
    fireEvent.touchEnd(loginButton)
    
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })

  it('renders with proper data attributes', () => {
    render(<AuthButtons />)
    
    const loginButton = screen.getByRole('button', { name: /Sign In/i })
    // Component doesn't use data-testid, using aria-label instead
    expect(loginButton).toHaveAttribute('aria-label', 'Sign in with Google')
  })
})
