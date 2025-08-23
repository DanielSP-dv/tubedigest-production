import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ChannelCountBadge from '../ChannelCountBadge';

// Mock Ant Design components
vi.mock('antd', () => ({
  Badge: ({ children, count, size, color }: any) => (
    <div data-testid="badge" data-count={count} data-size={size} data-color={color}>
      {children}
    </div>
  ),
  Tag: ({ children, color, icon }: any) => (
    <div data-testid="tag" data-color={color}>
      {icon}
      {children}
    </div>
  ),
  Space: ({ children, size }: any) => (
    <div data-testid="space" data-size={size}>
      {children}
    </div>
  ),
  Typography: {
    Text: ({ children, strong, style }: any) => (
      <span data-testid="text" data-strong={strong} data-style={JSON.stringify(style)}>
        {children}
      </span>
    ),
  },
}));

// Mock Ant Design icons
vi.mock('@ant-design/icons', () => ({
  PlayCircleOutlined: () => <span data-testid="play-icon">PlayIcon</span>,
}));

describe('ChannelCountBadge', () => {
  it('renders badge type by default', () => {
    render(<ChannelCountBadge count={5} />);

    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toHaveAttribute('data-count', '5');
    expect(screen.getByTestId('play-icon')).toBeInTheDocument();
  });

  it('renders tag type correctly', () => {
    render(
      <ChannelCountBadge 
        count={3} 
        total={10} 
        type="tag" 
        color="#52c41a"
      />
    );

    expect(screen.getByTestId('tag')).toBeInTheDocument();
    expect(screen.getByTestId('tag')).toHaveAttribute('data-color', '#52c41a');
    expect(screen.getByText('3/10 Channels')).toBeInTheDocument();
  });

  it('renders text type correctly', () => {
    render(
      <ChannelCountBadge 
        count={7} 
        type="text" 
        size="large"
        color="#1890ff"
      />
    );

    expect(screen.getByTestId('space')).toBeInTheDocument();
    expect(screen.getByTestId('text')).toBeInTheDocument();
    expect(screen.getByText('7 Channels')).toBeInTheDocument();
  });

  it('displays count and total when provided', () => {
    render(
      <ChannelCountBadge 
        count={2} 
        total={8} 
        type="tag"
      />
    );

    expect(screen.getByText('2/8 Channels')).toBeInTheDocument();
  });

  it('displays only count when total is not provided', () => {
    render(
      <ChannelCountBadge 
        count={4} 
        type="text"
      />
    );

    expect(screen.getByText('4 Channels')).toBeInTheDocument();
  });

  it('handles different sizes', () => {
    render(
      <ChannelCountBadge 
        count={6} 
        size="small"
      />
    );

    expect(screen.getByTestId('badge')).toHaveAttribute('data-size', 'small');
  });

  it('handles large size for badge (converts to default)', () => {
    render(
      <ChannelCountBadge 
        count={1} 
        size="large"
      />
    );

    expect(screen.getByTestId('badge')).toHaveAttribute('data-size', 'default');
  });
});



