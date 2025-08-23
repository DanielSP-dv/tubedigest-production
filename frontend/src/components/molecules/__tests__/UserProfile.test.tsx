import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import UserProfile from '../UserProfile';

// Mock Ant Design components
vi.mock('antd', () => ({
  Avatar: ({ icon, src, size }: any) => (
    <div data-testid="avatar" data-size={size} data-src={src}>
      {icon}
    </div>
  ),
  Dropdown: ({ children, menu, placement, trigger }: any) => (
    <div data-testid="dropdown" data-placement={placement} data-trigger={trigger}>
      {children}
      <div data-testid="dropdown-menu">Menu Items</div>
    </div>
  ),
  Space: ({ children, className }: any) => (
    <div data-testid="space" className={className}>
      {children}
    </div>
  ),
  Typography: {
    Text: ({ children, strong, type }: any) => (
      <span data-testid="text" data-strong={strong} data-type={type}>
        {children}
      </span>
    ),
  },
}));

// Mock Ant Design icons
vi.mock('@ant-design/icons', () => ({
  UserOutlined: () => <span data-testid="user-icon">UserIcon</span>,
  SettingOutlined: () => <span data-testid="setting-icon">SettingIcon</span>,
  LogoutOutlined: () => <span data-testid="logout-icon">LogoutIcon</span>,
}));

describe('UserProfile', () => {
  const mockUser = {
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockOnLogout = vi.fn();
  const mockOnSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user profile with avatar and user info', () => {
    render(
      <UserProfile
        user={mockUser}
        onLogout={mockOnLogout}
        onSettings={mockOnSettings}
      />
    );

    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    expect(screen.getByTestId('space')).toHaveClass('user-profile-trigger');
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders dropdown with correct menu items', () => {
    render(
      <UserProfile
        user={mockUser}
        onLogout={mockOnLogout}
        onSettings={mockOnSettings}
      />
    );

    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveAttribute('data-placement', 'bottomRight');
    expect(dropdown).toHaveAttribute('data-trigger', 'click');
  });

  it('displays user name when available', () => {
    render(
      <UserProfile
        user={mockUser}
        onLogout={mockOnLogout}
        onSettings={mockOnSettings}
      />
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('displays email when name is not available', () => {
    const userWithoutName = { ...mockUser, name: undefined };
    
    render(
      <UserProfile
        user={userWithoutName}
        onLogout={mockOnLogout}
        onSettings={mockOnSettings}
      />
    );

    // Check for the strong text (name display) - use getAllByTestId to get the first one
    const textElements = screen.getAllByTestId('text');
    const strongText = textElements.find(el => el.getAttribute('data-strong') === 'true');
    expect(strongText).toBeInTheDocument();
  });

  it('renders avatar with correct props', () => {
    render(
      <UserProfile
        user={mockUser}
        onLogout={mockOnLogout}
        onSettings={mockOnSettings}
      />
    );

    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveAttribute('data-size', 'default');
    expect(avatar).toHaveAttribute('data-src', 'https://example.com/avatar.jpg');
  });

  it('has clickable trigger area', () => {
    render(
      <UserProfile
        user={mockUser}
        onLogout={mockOnLogout}
        onSettings={mockOnSettings}
      />
    );

    const trigger = screen.getByTestId('space');
    expect(trigger).toHaveClass('user-profile-trigger');
  });
});
