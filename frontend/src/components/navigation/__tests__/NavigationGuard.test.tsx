import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import NavigationGuard from '../NavigationGuard';
import { useSession } from '../../../hooks/useSession';

// Mock the useSession hook
vi.mock('../../../hooks/useSession');
const mockUseSession = vi.mocked(useSession);

// Mock Ant Design components
vi.mock('antd', () => ({
  Spin: ({ children, tip }: { children?: React.ReactNode; tip?: string }) => (
    <div data-testid="loading-spinner" data-tip={tip}>
      {children || 'Loading...'}
    </div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NavigationGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner when session is loading', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      hasCompletedOnboarding: false,
      error: null,
      user: null,
      lastChecked: 0,
      validateSession: vi.fn(),
      clearSession: vi.fn(),
      updateSession: vi.fn(),
      restoreSession: vi.fn()
    });

    renderWithRouter(
      <NavigationGuard>
        <div>Protected Content</div>
      </NavigationGuard>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should redirect to landing page when not authenticated', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      hasCompletedOnboarding: false,
      error: null,
      user: null,
      lastChecked: 0,
      validateSession: vi.fn(),
      clearSession: vi.fn(),
      updateSession: vi.fn(),
      restoreSession: vi.fn()
    });

    renderWithRouter(
      <NavigationGuard>
        <div>Protected Content</div>
      </NavigationGuard>
    );

    // Should redirect to landing page
    expect(window.location.pathname).toBe('/');
  });

  it('should redirect to channels when authenticated but not onboarded', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: false,
      error: null,
      user: { id: 'user-1', email: 'user@example.com' },
      lastChecked: Date.now(),
      validateSession: vi.fn(),
      clearSession: vi.fn(),
      updateSession: vi.fn(),
      restoreSession: vi.fn()
    });

    renderWithRouter(
      <NavigationGuard>
        <div>Protected Content</div>
      </NavigationGuard>
    );

    // Should redirect to channels for onboarding
    expect(window.location.pathname).toBe('/channels');
  });

  it('should allow access when authenticated and onboarded', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: true,
      error: null,
      user: { id: 'user-1', email: 'user@example.com' },
      lastChecked: Date.now(),
      validateSession: vi.fn(),
      clearSession: vi.fn(),
      updateSession: vi.fn(),
      restoreSession: vi.fn()
    });

    renderWithRouter(
      <NavigationGuard>
        <div data-testid="protected-content">Protected Content</div>
      </NavigationGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should redirect to landing page when there is an authentication error', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      hasCompletedOnboarding: false,
      error: 'Authentication failed',
      user: null,
      lastChecked: 0,
      validateSession: vi.fn(),
      clearSession: vi.fn(),
      updateSession: vi.fn(),
      restoreSession: vi.fn()
    });

    renderWithRouter(
      <NavigationGuard>
        <div>Protected Content</div>
      </NavigationGuard>
    );

    // Should redirect to landing page on error
    expect(window.location.pathname).toBe('/');
  });

  it('should allow access to public routes when not authenticated', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      hasCompletedOnboarding: false,
      error: null,
      user: null,
      lastChecked: 0,
      validateSession: vi.fn(),
      clearSession: vi.fn(),
      updateSession: vi.fn(),
      restoreSession: vi.fn()
    });

    // Mock window.location.pathname to simulate being on landing page
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true
    });

    renderWithRouter(
      <NavigationGuard>
        <div data-testid="landing-content">Landing Content</div>
      </NavigationGuard>
    );

    expect(screen.getByTestId('landing-content')).toBeInTheDocument();
  });
});

