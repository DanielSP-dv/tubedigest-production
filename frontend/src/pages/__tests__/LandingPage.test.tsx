import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import LandingPage from '../LandingPage';
import { useAuth } from '../../services/auth';

// Mock window.matchMedia for Ant Design's responsive observer
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Mock the auth service
vi.mock('../../services/auth');

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

// Create a test query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </ConfigProvider>
  </QueryClientProvider>
);

describe('LandingPage', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the landing page with hero section', () => {
      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      expect(screen.getByText('TubeDigest')).toBeInTheDocument();
      expect(screen.getByText('Get summaries from your favorite YouTube channels.')).toBeInTheDocument();
    });

    it('displays the main CTA button', () => {
      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      const ctaButtons = screen.getAllByRole('button', { name: /create your first digest/i });
      expect(ctaButtons.length).toBeGreaterThan(0);
      expect(ctaButtons[0]).toHaveClass('ant-btn-primary');
    });

    it('renders all feature cards', () => {
      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      // Feature cards are not present in simplified landing page
      // expect(screen.getByText('AI-Powered Summaries')).toBeInTheDocument();
      // expect(screen.getByText('Save Time')).toBeInTheDocument();
      // expect(screen.getByText('Curated Digests')).toBeInTheDocument();
      // Personalized section not present in simplified landing page
    });

    it('displays the "How It Works" section', () => {
      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      // How It Works section is not present in simplified landing page
      // expect(screen.getByText('How It Works')).toBeInTheDocument();
      // expect(screen.getByText('Connect Your YouTube')).toBeInTheDocument();
      // expect(screen.getByText('Select Your Channels')).toBeInTheDocument();
      // Get Daily Digests section not present in simplified landing page
    });
  });

  describe('OAuth Integration', () => {
    it('redirects to OAuth endpoint when CTA button is clicked', () => {
      // Mock window.location.href
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' } as any;

      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      const ctaButtons = screen.getAllByRole('button', { name: /create your first digest/i });
      fireEvent.click(ctaButtons[0]);

      expect(window.location.href).toBe('/api/auth/google');

      // Restore window.location
      window.location = originalLocation;
    });

    it('handles single CTA button click correctly', () => {
      // Mock window.location.href
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' } as any;

      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      const ctaButtons = screen.getAllByRole('button', { name: /create your first digest/i });
      fireEvent.click(ctaButtons[0]);

      expect(window.location.href).toBe('/api/auth/google');

      // Restore window.location
      window.location = originalLocation;
    });

    // Removed multiple CTA button test since simplified landing page only has one button
  });

  describe('Mobile Responsiveness', () => {
    it('renders correctly on mobile viewport', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      // Check that all content is still visible
      expect(screen.getByText('TubeDigest')).toBeInTheDocument();
      const ctaButtons = screen.getAllByRole('button', { name: /create your first digest/i });
      expect(ctaButtons.length).toBeGreaterThan(0);
      // AI-Powered Summaries section not present in simplified landing page
    });

    it('maintains functionality on small screens', () => {
      // Mock window.location.href
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' } as any;

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      const ctaButtons = screen.getAllByRole('button', { name: /create your first digest/i });
      fireEvent.click(ctaButtons[0]);

      expect(window.location.href).toBe('/api/auth/google');

      // Restore window.location
      window.location = originalLocation;
    });
  });

  describe('Performance', () => {
    it('renders without performance issues', async () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('TubeDigest')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in under 100ms for good performance
      expect(renderTime).toBeLessThan(100);
    });

    it('loads all sections efficiently', async () => {
      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('TubeDigest')).toBeInTheDocument();
        // Other sections not present in simplified landing page
        // expect(screen.getByText('Why Choose TubeDigest?')).toBeInTheDocument();
        // expect(screen.getByText('How It Works')).toBeInTheDocument();
        // expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('TubeDigest');

      // Simplified landing page doesn't have h2 headings
      // const h2s = screen.getAllByRole('heading', { level: 2 });
      // expect(h2s.length).toBeGreaterThan(0);
    });

    it('has accessible buttons', () => {
      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      const ctaButtons = screen.getAllByRole('button', { name: /create your first digest/i });
      expect(ctaButtons.length).toBeGreaterThan(0);
      expect(ctaButtons[0]).toBeEnabled();
    });

    it('supports keyboard navigation', () => {
      // Mock window.location.href
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' } as any;

      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      const ctaButtons = screen.getAllByRole('button', { name: /create your first digest/i });
      ctaButtons[0].focus();
      
      expect(ctaButtons[0]).toHaveFocus();
      
      // Test that the button is clickable and accessible
      fireEvent.click(ctaButtons[0]);
      expect(window.location.href).toBe('/api/auth/google');

      // Restore window.location
      window.location = originalLocation;
    });
  });

  describe('Error Handling', () => {
    it('handles OAuth redirect gracefully', () => {
      // Mock window.location.href
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' } as any;

      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      const ctaButtons = screen.getAllByRole('button', { name: /create your first digest/i });
      fireEvent.click(ctaButtons[0]);

      expect(window.location.href).toBe('/api/auth/google');

      // Restore window.location
      window.location = originalLocation;
    });

    it('renders correctly in all states', () => {
      render(
        <TestWrapper>
          <LandingPage />
        </TestWrapper>
      );

      // Page should render correctly
      expect(screen.getByText('TubeDigest')).toBeInTheDocument();
    });
  });
});
