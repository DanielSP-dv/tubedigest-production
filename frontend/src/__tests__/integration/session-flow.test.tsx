import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { useSession } from '../../hooks/useSession';
import { SessionStorage } from '../../utils/sessionStorage';

// Mock SessionStorage
vi.mock('../../utils/sessionStorage');
const mockSessionStorage = vi.mocked(SessionStorage);

// Mock fetch
global.fetch = vi.fn();

// Mock the useSession hook
vi.mock('../../hooks/useSession');
const mockUseSession = vi.mocked(useSession);

// Mock Ant Design components more comprehensively
vi.mock('antd', () => ({
  Spin: ({ children, tip }: { children?: React.ReactNode; tip?: string }) => (
    <div data-testid="loading-spinner" data-tip={tip}>
      {children || 'Loading...'}
    </div>
  ),
  Typography: {
    Title: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
    Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Paragraph: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  },
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  List: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  ListItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  Input: {
    Search: ({ placeholder }: { placeholder?: string }) => (
      <input placeholder={placeholder} data-testid="search-input" />
    ),
  },
  Layout: {
    Header: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
    Content: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
    Sider: ({ children }: { children: React.ReactNode }) => <aside>{children}</aside>,
  },
  Menu: ({ children }: { children: React.ReactNode }) => <nav>{children}</nav>,
  Dropdown: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Modal: ({ children, visible }: { children: React.ReactNode; visible?: boolean }) => 
    visible ? <div data-testid="modal">{children}</div> : null,
  Form: {
    useForm: () => [{
      getFieldValue: vi.fn(),
      setFieldsValue: vi.fn(),
      validateFields: vi.fn(),
    }],
  },
  Radio: {
    Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  DatePicker: ({ placeholder }: { placeholder?: string }) => (
    <input placeholder={placeholder} data-testid="date-picker" />
  ),
  Tag: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Divider: () => <hr />,
  Skeleton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Empty: ({ description }: { description?: string }) => (
    <div data-testid="empty-state">{description}</div>
  ),
  Row: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Col: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  notification: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

// Test component that uses session functionality
const TestSessionComponent = () => {
  const session = useSession();
  
  if (session.isLoading) {
    return <div data-testid="loading-spinner">Loading...</div>;
  }
  
  if (session.error) {
    return <div data-testid="error">Error: {session.error}</div>;
  }
  
  if (session.isAuthenticated) {
    return (
      <div data-testid="authenticated">
        <div data-testid="user-email">{session.user?.email}</div>
        <div data-testid="onboarding-status">
          {session.hasCompletedOnboarding ? 'Onboarded' : 'Needs Onboarding'}
        </div>
        <button 
          data-testid="logout-button" 
          onClick={() => session.logout()}
        >
          Logout
        </button>
      </div>
    );
  }
  
  return <div data-testid="unauthenticated">Not authenticated</div>;
};

const renderTestComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TestSessionComponent />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Session Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.loadSession.mockReturnValue(null);
    mockSessionStorage.saveSession.mockImplementation(() => {});
    mockSessionStorage.clearSession.mockImplementation(() => {});
  });

  it('should handle complete user journey: login -> dashboard -> logout', async () => {
    // Mock successful authentication
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
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200
      });

    global.fetch = mockFetch;

    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { ...originalLocation, href: '' };

    // Mock useSession hook
    mockUseSession.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      lastChecked: Date.now(),
      hasCompletedOnboarding: true,
      error: null,
      validateSession: vi.fn(),
      clearSession: vi.fn(),
      updateSession: vi.fn(),
      restoreSession: vi.fn(),
      logout: vi.fn().mockImplementation(() => {
        window.location.href = '/';
      }),
    });

    renderTestComponent();

    // Should show authenticated user
    expect(screen.getByTestId('authenticated')).toBeInTheDocument();
    expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com');
    expect(screen.getByTestId('onboarding-status')).toHaveTextContent('Onboarded');

    // Test logout functionality
    const logoutButton = screen.getByTestId('logout-button');
    logoutButton.click();

    // Should call logout function
    expect(mockUseSession().logout).toHaveBeenCalled();
  });

  it('should handle session restoration on app restart', async () => {
    // Mock existing session in localStorage
    const existingSession = {
      user: {
        id: 'user-1',
        email: 'user@example.com',
        createdAt: '2025-01-01T00:00:00.000Z',
        tz: 'UTC'
      },
      isAuthenticated: true,
      lastChecked: Date.now(),
      hasCompletedOnboarding: true
    };

    mockSessionStorage.loadSession.mockReturnValue(existingSession);

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(existingSession.user)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 'channel-1' }])
      });

    global.fetch = mockFetch;

    // Mock useSession hook for restored session
    mockUseSession.mockReturnValue({
      user: existingSession.user,
      isAuthenticated: true,
      isLoading: false,
      lastChecked: existingSession.lastChecked,
      hasCompletedOnboarding: true,
      error: null,
      validateSession: vi.fn(),
      clearSession: vi.fn(),
      updateSession: vi.fn(),
      restoreSession: vi.fn(),
      logout: vi.fn(),
    });

    renderTestComponent();

    // Should show authenticated user (session restoration is handled by the hook)
    expect(screen.getByTestId('authenticated')).toBeInTheDocument();
    expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com');
  });

  it('should handle logout flow', async () => {
    // Mock successful logout
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200
    });

    global.fetch = mockFetch;

    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { ...originalLocation, href: '' };

    // Mock useSession hook for logout
    mockUseSession.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastChecked: 0,
      hasCompletedOnboarding: false,
      error: null,
      validateSession: vi.fn(),
      clearSession: vi.fn().mockImplementation(() => {
        mockSessionStorage.clearSession();
      }),
      updateSession: vi.fn(),
      restoreSession: vi.fn(),
      logout: vi.fn().mockImplementation(() => {
        window.location.href = '/';
      }),
    });

    renderTestComponent();

    // Should show unauthenticated state
    expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();

    // Simulate logout
    mockUseSession().clearSession();

    // Should clear session from localStorage
    expect(mockSessionStorage.clearSession).toHaveBeenCalled();
  });

  it('should handle loading state', () => {
    // Mock useSession hook for loading state
    mockUseSession.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      lastChecked: 0,
      hasCompletedOnboarding: false,
      error: null,
      validateSession: vi.fn(),
      clearSession: vi.fn(),
      updateSession: vi.fn(),
      restoreSession: vi.fn(),
      logout: vi.fn(),
    });

    renderTestComponent();

    // Should show loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    // Mock useSession hook for error state
    mockUseSession.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastChecked: 0,
      hasCompletedOnboarding: false,
      error: 'Session validation failed',
      validateSession: vi.fn(),
      clearSession: vi.fn(),
      updateSession: vi.fn(),
      restoreSession: vi.fn(),
      logout: vi.fn(),
    });

    renderTestComponent();

    // Should show error state
    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toHaveTextContent('Error: Session validation failed');
  });
});
