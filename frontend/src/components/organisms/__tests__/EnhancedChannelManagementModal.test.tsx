import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import EnhancedChannelManagementModal from '../EnhancedChannelManagementModal';

// Mock react-beautiful-dnd
vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: any) => <div data-testid="drag-drop-context">{children}</div>,
  Droppable: ({ children }: any) => children({
    droppableProps: {},
    innerRef: vi.fn(),
    placeholder: null,
  }, {}),
  Draggable: ({ children }: any) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: vi.fn(),
  }, {}),
}));

// Mock Ant Design components
vi.mock('antd', () => ({
  Modal: ({ children, title, open, onCancel, footer }: any) => 
    open ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-content">{children}</div>
        <div data-testid="modal-footer">{footer}</div>
        <button onClick={onCancel}>Close</button>
      </div>
    ) : null,
  List: Object.assign(
    ({ dataSource, renderItem }: any) => (
      <div data-testid="list">
        {dataSource?.map((item: any, index: number) => (
          <div key={item.id} data-testid={`list-item-${index}`}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    ),
    {
      Item: Object.assign(
        ({ children, actions }: any) => (
          <div data-testid="list-item">
            <div data-testid="list-item-content">{children}</div>
            <div data-testid="list-item-actions">{actions}</div>
          </div>
        ),
        {
          Meta: ({ title, description }: any) => (
            <div data-testid="list-item-meta">
              <div data-testid="list-item-title">{title}</div>
              <div data-testid="list-item-description">{description}</div>
            </div>
          ),
        }
      ),
    }
  ),

  Button: ({ children, onClick, icon, type, size, danger }: any) => (
    <button 
      onClick={onClick} 
      data-testid="button"
      data-type={type}
      data-size={size}
      data-danger={danger}
    >
      {icon}
      {children}
    </button>
  ),
  Space: ({ children, direction, size }: any) => (
    <div data-testid="space" data-direction={direction} data-size={size}>
      {children}
    </div>
  ),
  Typography: {
    Title: ({ children, level }: any) => <h1 data-testid="title" data-level={level}>{children}</h1>,
    Text: ({ children, strong }: any) => <span data-testid="text" data-strong={strong}>{children}</span>,
  },
  Input: {
    Search: ({ placeholder, value, onChange, allowClear }: any) => (
      <input 
        data-testid="search-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    ),
    TextArea: ({ value, onChange, placeholder, rows }: any) => (
      <textarea 
        data-testid="textarea"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
      />
    ),
  },
  Tag: ({ children, color }: any) => (
    <span data-testid="tag" data-color={color}>{children}</span>
  ),
  Divider: ({ children }: any) => <hr data-testid="divider">{children}</hr>,
  Row: ({ children, gutter, align }: any) => (
    <div data-testid="row" data-gutter={gutter} data-align={align}>
      {children}
    </div>
  ),
  Col: ({ children, flex }: any) => (
    <div data-testid="col" data-flex={flex}>
      {children}
    </div>
  ),
  Pagination: ({ current, total, pageSize, onChange }: any) => (
    <div data-testid="pagination" data-current={current} data-total={total} data-page-size={pageSize}>
      <button onClick={() => onChange(current + 1, pageSize)}>Next</button>
    </div>
  ),
  Popconfirm: ({ children, onConfirm, title }: any) => (
    <div data-testid="popconfirm" data-title={title}>
      {children}
      <button onClick={onConfirm}>Confirm</button>
    </div>
  ),
  Upload: ({ children, beforeUpload, accept }: any) => (
    <div data-testid="upload" data-accept={accept}>
      {children}
    </div>
  ),
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Ant Design icons
vi.mock('@ant-design/icons', () => ({
  DragOutlined: () => <span data-testid="drag-icon">DragIcon</span>,
  DeleteOutlined: () => <span data-testid="delete-icon">DeleteIcon</span>,
  PlusOutlined: () => <span data-testid="plus-icon">PlusIcon</span>,
  ImportOutlined: () => <span data-testid="import-icon">ImportIcon</span>,
  UploadOutlined: () => <span data-testid="upload-icon">UploadIcon</span>,
}));

describe('EnhancedChannelManagementModal', () => {
  const mockChannels = [
    { id: '1', title: 'Channel 1', selected: true, order: 0 },
    { id: '2', title: 'Channel 2', selected: false, order: 1 },
    { id: '3', title: 'Channel 3', selected: true, order: 2 },
  ];

  const mockProps = {
    open: true,
    onClose: vi.fn(),
    channels: mockChannels,
    onReorder: vi.fn(),
    onImport: vi.fn(),
    onRemove: vi.fn(),
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open is true', () => {
    render(<EnhancedChannelManagementModal {...mockProps} />);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toBeInTheDocument();
  });

  it('does not render modal when open is false', () => {
    render(<EnhancedChannelManagementModal {...mockProps} open={false} />);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('displays channel count in title', () => {
    render(<EnhancedChannelManagementModal {...mockProps} />);
    
    expect(screen.getByText('3 Channels')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<EnhancedChannelManagementModal {...mockProps} />);
    
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', 'Search channels...');
  });

  it('renders channel list', () => {
    render(<EnhancedChannelManagementModal {...mockProps} />);
    
    expect(screen.getByTestId('list')).toBeInTheDocument();
    expect(screen.getAllByTestId('list-item')).toHaveLength(3);
  });

  it('displays channel titles', () => {
    render(<EnhancedChannelManagementModal {...mockProps} />);
    
    expect(screen.getByText('Channel 1')).toBeInTheDocument();
    expect(screen.getByText('Channel 2')).toBeInTheDocument();
    expect(screen.getByText('Channel 3')).toBeInTheDocument();
  });

  it('shows active tag for selected channels', () => {
    render(<EnhancedChannelManagementModal {...mockProps} />);
    
    const activeTags = screen.getAllByText('Active');
    expect(activeTags).toHaveLength(2); // Channel 1 and Channel 3 are selected
  });

  it('calls onClose when close button is clicked', () => {
    render(<EnhancedChannelManagementModal {...mockProps} />);
    
    // Get all close buttons and click the one in the footer
    const closeButtons = screen.getAllByText('Close');
    fireEvent.click(closeButtons[1]); // The second close button is in the footer
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('renders drag and drop context', () => {
    render(<EnhancedChannelManagementModal {...mockProps} />);
    
    expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
  });

  it('renders import button in footer', () => {
    render(<EnhancedChannelManagementModal {...mockProps} />);
    
    expect(screen.getByText('Import Channels')).toBeInTheDocument();
  });
});
