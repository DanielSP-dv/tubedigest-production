import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DigestPreviewModal from '../DigestPreviewModal';

// Mock Ant Design components
vi.mock('antd', () => ({
  Modal: ({ children, open, onCancel, title, footer }: any) => 
    open ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-content">{children}</div>
        <div data-testid="modal-footer">
          {footer}
        </div>
        <button data-testid="modal-cancel" onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
  Button: ({ children, onClick, loading, disabled, icon }: any) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      disabled={disabled}
      data-loading={loading}
    >
      {icon}
      {children}
    </button>
  ),
  Space: ({ children }: any) => <div data-testid="space">{children}</div>,
  Typography: {
    Title: ({ children, level }: any) => <h1 data-testid="title" data-level={level}>{children}</h1>,
    Text: ({ children, strong, type }: any) => (
      <span data-testid="text" data-strong={strong} data-type={type}>{children}</span>
    ),
    Paragraph: ({ children, ellipsis }: any) => (
      <p data-testid="paragraph" data-ellipsis={!!ellipsis}>{children}</p>
    ),
  },
  Card: ({ children, size }: any) => (
    <div data-testid="card" data-size={size}>{children}</div>
  ),
  Tag: ({ children, color, icon }: any) => (
    <span data-testid="tag" data-color={color}>
      {icon}
      {children}
    </span>
  ),
  Divider: ({ style }: any) => <hr data-testid="divider" style={style} />,
  Skeleton: ({ active, paragraph }: any) => (
    <div data-testid="skeleton" data-active={active} data-rows={paragraph?.rows}>
      Loading skeleton
    </div>
  ),
  Empty: {
    PRESENTED_IMAGE_SIMPLE: 'simple',
    ({ description, image }: any) => (
      <div data-testid="empty" data-description={description} data-image={image}>
        No data
      </div>
    ),
  },
}));

// Mock icons
vi.mock('@ant-design/icons', () => ({
  MailOutlined: () => <span data-testid="mail-icon">📧</span>,
  ClockCircleOutlined: () => <span data-testid="clock-icon">⏰</span>,
  PlayCircleOutlined: () => <span data-testid="play-icon">▶️</span>,
}));

describe('DigestPreviewModal', () => {
  const mockData = {
    id: '1',
    title: 'Test Digest',
    summary: 'This is a test digest summary',
    videoCount: 3,
    videos: [
      {
        id: 'video1',
        title: 'Test Video 1',
        summary: 'Summary for video 1',
        duration: '10:30',
        channelTitle: 'Test Channel',
        publishedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'video2',
        title: 'Test Video 2',
        summary: 'Summary for video 2',
        duration: '15:45',
        channelTitle: 'Test Channel 2',
        publishedAt: '2023-01-02T00:00:00Z',
      },
    ],
    scheduledFor: new Date('2023-01-15T09:00:00Z'),
    email: 'test@example.com',
  };

  const mockProps = {
    visible: true,
    onCancel: vi.fn(),
    onSend: vi.fn(),
    onSchedule: vi.fn(),
    data: mockData,
    loading: false,
    sendLoading: false,
    scheduleLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when visible is true', () => {
    render(<DigestPreviewModal {...mockProps} />);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toBeInTheDocument();
  });

  it('does not render when visible is false', () => {
    render(<DigestPreviewModal {...mockProps} visible={false} />);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<DigestPreviewModal {...mockProps} />);
    
    const cancelButton = screen.getByTestId('modal-cancel');
    fireEvent.click(cancelButton);
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('displays digest title and summary', () => {
    render(<DigestPreviewModal {...mockProps} />);
    
    expect(screen.getByText('Test Digest')).toBeInTheDocument();
    expect(screen.getByText('This is a test digest summary')).toBeInTheDocument();
  });

  it('displays video count', () => {
    render(<DigestPreviewModal {...mockProps} />);
    
    expect(screen.getByText('3 videos')).toBeInTheDocument();
  });

  it('displays scheduled date when provided', () => {
    render(<DigestPreviewModal {...mockProps} />);
    
    expect(screen.getByText(/Scheduled for/)).toBeInTheDocument();
  });

  it('displays email when provided', () => {
    render(<DigestPreviewModal {...mockProps} />);
    
    expect(screen.getByText('To: test@example.com')).toBeInTheDocument();
  });

  it('displays videos list', () => {
    render(<DigestPreviewModal {...mockProps} />);
    
    expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    expect(screen.getByText('Test Video 2')).toBeInTheDocument();
    expect(screen.getByText('Test Channel')).toBeInTheDocument();
    expect(screen.getByText('Test Channel 2')).toBeInTheDocument();
  });

  it('displays video metadata', () => {
    render(<DigestPreviewModal {...mockProps} />);
    
    expect(screen.getByText('10:30')).toBeInTheDocument();
    expect(screen.getByText('15:45')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading is true', () => {
    render(<DigestPreviewModal {...mockProps} loading={true} />);
    
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('shows empty state when no data is provided', () => {
    render(<DigestPreviewModal {...mockProps} data={undefined} />);
    
    expect(screen.getByTestId('empty')).toBeInTheDocument();
  });

  it('shows empty state when no videos are available', () => {
    const dataWithoutVideos = { ...mockData, videos: [] };
    render(<DigestPreviewModal {...mockProps} data={dataWithoutVideos} />);
    
    expect(screen.getByTestId('empty')).toBeInTheDocument();
  });

  it('calls onSend when Send Now button is clicked', () => {
    render(<DigestPreviewModal {...mockProps} />);
    
    const sendButton = screen.getByText('Send Now');
    fireEvent.click(sendButton);
    
    expect(mockProps.onSend).toHaveBeenCalledTimes(1);
  });

  it('calls onSchedule when Schedule button is clicked', () => {
    render(<DigestPreviewModal {...mockProps} />);
    
    const scheduleButton = screen.getByText('Schedule');
    fireEvent.click(scheduleButton);
    
    expect(mockProps.onSchedule).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on Send button when sendLoading is true', () => {
    render(<DigestPreviewModal {...mockProps} sendLoading={true} />);
    
    const buttons = screen.getAllByTestId('button');
    const sendButton = buttons.find(button => button.textContent?.includes('Send Now'));
    
    expect(sendButton).toHaveAttribute('data-loading', 'true');
  });

  it('shows loading state on Schedule button when scheduleLoading is true', () => {
    render(<DigestPreviewModal {...mockProps} scheduleLoading={true} />);
    
    const buttons = screen.getAllByTestId('button');
    const scheduleButton = buttons.find(button => button.textContent?.includes('Schedule'));
    
    expect(scheduleButton).toHaveAttribute('data-loading', 'true');
  });

  it('disables buttons when loading', () => {
    render(<DigestPreviewModal {...mockProps} sendLoading={true} />);
    
    const buttons = screen.getAllByTestId('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('displays email preview section', () => {
    render(<DigestPreviewModal {...mockProps} />);
    
    expect(screen.getByText('Email Preview')).toBeInTheDocument();
    expect(screen.getByText('Subject:')).toBeInTheDocument();
    expect(screen.getByText('To:')).toBeInTheDocument();
    expect(screen.getByText('Content Preview:')).toBeInTheDocument();
  });
});
