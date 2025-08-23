import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import NavigationTransition from '../NavigationTransition';

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

describe('NavigationTransition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children content', () => {
    renderWithRouter(
      <NavigationTransition>
        <div data-testid="page-content">Page Content</div>
      </NavigationTransition>
    );

    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('should have smooth transition styles', () => {
    renderWithRouter(
      <NavigationTransition>
        <div data-testid="page-content">Page Content</div>
      </NavigationTransition>
    );

    const container = screen.getByTestId('page-content').parentElement;
    expect(container).toHaveStyle({
      opacity: '1',
      transition: 'opacity 0.3s ease-in-out'
    });
  });

  it('should handle loading state when transitioning', () => {
    // Mock useLocation to simulate route change
    const mockUseLocation = vi.fn().mockReturnValue({ pathname: '/test' });
    vi.doMock('react-router-dom', () => ({
      ...vi.importActual('react-router-dom'),
      useLocation: mockUseLocation
    }));

    renderWithRouter(
      <NavigationTransition>
        <div data-testid="page-content">Page Content</div>
      </NavigationTransition>
    );

    // Should render content normally
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });
});
