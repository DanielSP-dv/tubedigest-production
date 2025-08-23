import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import LoadingSpinner from '../LoadingSpinner';

// Mock Ant Design components
vi.mock('antd', () => ({
  Spin: ({ children, tip, size, indicator }: any) => (
    <div data-testid="spin" data-tip={tip} data-size={size}>
      {indicator}
      {children}
    </div>
  ),
  Progress: ({ percent, type, size, format }: any) => (
    <div data-testid="progress" data-percent={percent} data-type={type} data-size={size}>
      {format ? format(percent) : `${percent}%`}
    </div>
  ),
  Skeleton: ({ active, paragraph, title }: any) => (
    <div data-testid="skeleton" data-active={active} data-rows={paragraph?.rows} data-title-width={title?.width}>
      Skeleton Loading
    </div>
  ),
}));

// Mock Ant Design icons
vi.mock('@ant-design/icons', () => ({
  LoadingOutlined: () => <span data-testid="loading-icon">LoadingIcon</span>,
}));

describe('LoadingSpinner', () => {
  it('renders nothing when loading is false', () => {
    const { container } = render(
      <LoadingSpinner loading={false} text="Loading..." />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders spinner by default', () => {
    render(
      <LoadingSpinner loading={true} text="Loading..." />
    );

    expect(screen.getByTestId('spin')).toBeInTheDocument();
    expect(screen.getByTestId('spin')).toHaveAttribute('data-tip', 'Loading...');
    expect(screen.getByTestId('loading-icon')).toBeInTheDocument();
  });

  it('renders progress type correctly', () => {
    render(
      <LoadingSpinner 
        loading={true} 
        text="Processing..." 
        type="progress" 
        percent={75}
        size="large"
      />
    );

    expect(screen.getByTestId('progress')).toBeInTheDocument();
    expect(screen.getByTestId('progress')).toHaveAttribute('data-percent', '75');
    expect(screen.getByTestId('progress')).toHaveAttribute('data-type', 'circle');
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders skeleton type correctly', () => {
    render(
      <LoadingSpinner 
        loading={true} 
        text="Loading content..." 
        type="skeleton" 
        rows={5}
      />
    );

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton')).toHaveAttribute('data-rows', '5');
    expect(screen.getByTestId('skeleton')).toHaveAttribute('data-title-width', '60%');
  });

  it('handles different sizes for spinner', () => {
    render(
      <LoadingSpinner 
        loading={true} 
        text="Loading..." 
        size="large"
      />
    );

    expect(screen.getByTestId('spin')).toHaveAttribute('data-size', 'large');
  });

  it('handles different sizes for progress', () => {
    render(
      <LoadingSpinner 
        loading={true} 
        text="Processing..." 
        type="progress" 
        size="small"
      />
    );

    expect(screen.getByTestId('progress')).toHaveAttribute('data-size', '80');
  });
});



