import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DigestSchedulingModal from '../DigestSchedulingModal';

// Mock Ant Design components
vi.mock('antd', () => ({
  Modal: ({ children, open, onCancel, title }: any) => 
    open ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-content">{children}</div>
        <button data-testid="modal-cancel" onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
  Radio: ({ children, value }: any) => (
    <div data-testid="radio" data-value={value}>
      {children}
    </div>
  ),
  'Radio.Group': ({ children, onChange, value }: any) => (
    <div data-testid="radio-group" onChange={onChange} data-value={value}>
      {children}
    </div>
  ),
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
  },
  Form: {
    useForm: () => [{
      validateFields: vi.fn().mockResolvedValue({
        cadence: 'daily',
        email: 'test@example.com',
      }),
      setFieldsValue: vi.fn(),
      resetFields: vi.fn(),
    }],
    Item: ({ children, name, rules }: any) => (
      <div data-testid="form-item" data-name={name}>
        {children}
      </div>
    ),
  },
  Input: ({ placeholder, type, addonAfter }: any) => (
    <input data-testid="input" placeholder={placeholder} type={type} data-addon={addonAfter} />
  ),
  DatePicker: ({ placeholder, format }: any) => (
    <input data-testid="date-picker" placeholder={placeholder} data-format={format} />
  ),
  notification: {
    error: vi.fn(),
  },
}));

// Mock icons
vi.mock('@ant-design/icons', () => ({
  ClockCircleOutlined: () => <span data-testid="clock-icon">⏰</span>,
  MailOutlined: () => <span data-testid="mail-icon">📧</span>,
  EyeOutlined: () => <span data-testid="eye-icon">👁️</span>,
}));

describe('DigestSchedulingModal', () => {
  const mockProps = {
    visible: true,
    onCancel: vi.fn(),
    onSchedule: vi.fn(),
    onSendNow: vi.fn(),
    onPreview: vi.fn(),
    loading: false,
    previewLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when visible is true', () => {
    render(<DigestSchedulingModal {...mockProps} />);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toBeInTheDocument();
  });

  it('does not render when visible is false', () => {
    render(<DigestSchedulingModal {...mockProps} visible={false} />);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<DigestSchedulingModal {...mockProps} />);
    
    const cancelButton = screen.getByTestId('modal-cancel');
    fireEvent.click(cancelButton);
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onSendNow when Send Now button is clicked', () => {
    render(<DigestSchedulingModal {...mockProps} />);
    
    const sendNowButton = screen.getByText('Send Now');
    fireEvent.click(sendNowButton);
    
    expect(mockProps.onSendNow).toHaveBeenCalledTimes(1);
  });

  it('calls onPreview when Preview button is clicked', () => {
    render(<DigestSchedulingModal {...mockProps} />);
    
    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);
    
    expect(mockProps.onPreview).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when loading prop is true', () => {
    render(<DigestSchedulingModal {...mockProps} loading={true} />);
    
    const buttons = screen.getAllByTestId('button');
    const scheduleButton = buttons.find(button => button.textContent?.includes('Schedule'));
    
    expect(scheduleButton).toHaveAttribute('data-loading', 'true');
  });

  it('shows preview loading state when previewLoading prop is true', () => {
    render(<DigestSchedulingModal {...mockProps} previewLoading={true} />);
    
    const buttons = screen.getAllByTestId('button');
    const previewButton = buttons.find(button => button.textContent?.includes('Preview'));
    
    expect(previewButton).toHaveAttribute('data-loading', 'true');
  });

  it('disables buttons when loading', () => {
    render(<DigestSchedulingModal {...mockProps} loading={true} />);
    
    const buttons = screen.getAllByTestId('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('renders cadence options', () => {
    render(<DigestSchedulingModal {...mockProps} />);
    
    expect(screen.getByText('Send Now')).toBeInTheDocument();
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('renders form fields', () => {
    render(<DigestSchedulingModal {...mockProps} />);
    
    expect(screen.getByTestId('radio-group')).toBeInTheDocument();
    expect(screen.getByText('When would you like to receive your digest?')).toBeInTheDocument();
  });

  it('renders email settings section', () => {
    render(<DigestSchedulingModal {...mockProps} />);
    
    expect(screen.getByText('Email Settings (Optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Leave empty to use your default email')).toBeInTheDocument();
  });
});
