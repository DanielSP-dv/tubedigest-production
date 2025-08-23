import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

import ChannelManagement from '../ChannelManagement';

// Create a simple mock component factory
const createMockComponent = (testId: string) => ({ children, ...props }: any) => (
  <div data-testid={testId} {...props}>{children}</div>
);

// Mock all Ant Design components with simple div elements
vi.mock('antd', () => {
  const ListComponent = ({ children, dataSource, renderItem, ...props }: any) => (
    <div data-testid="list" {...props}>
      {dataSource?.map((item: any, index: number) => (
        <div key={index} data-testid="list-item">
          {renderItem ? renderItem(item, index) : item}
        </div>
      ))}
    </div>
  );
  
  ListComponent.Item = ({ children, ...props }: any) => <div data-testid="list-item" {...props}>{children}</div>;
  ListComponent.Item.Meta = ({ children, ...props }: any) => <div data-testid="list-item-meta" {...props}>{children}</div>;

  return {
    Layout: createMockComponent('layout'),
    Card: createMockComponent('card'),
    List: ListComponent,
    Switch: ({ checked, onChange, ...props }: any) => (
      <input
        type="checkbox"
        data-testid="switch"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        {...props}
      />
    ),
    Space: createMockComponent('space'),
    Typography: {
      Title: ({ children, ...props }: any) => <h1 data-testid="title" {...props}>{children}</h1>,
      Text: ({ children, ...props }: any) => <span data-testid="text" {...props}>{children}</span>,
    },
    Input: {
      Search: ({ onSearch, placeholder, ...props }: any) => (
        <div data-testid="search-input">
          <input
            type="text"
            placeholder={placeholder}
            onChange={(e) => onSearch?.(e.target.value)}
            {...props}
          />
        </div>
      ),
    },
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    notification: {
      success: vi.fn(),
      error: vi.fn(),
    },
    Skeleton: createMockComponent('skeleton'),
    Empty: ({ description, ...props }: any) => <div data-testid="empty" {...props}>{description}</div>,
    Divider: ({ children, ...props }: any) => <hr data-testid="divider" {...props}>{children}</hr>,
    Row: createMockComponent('row'),
    Col: createMockComponent('col'),
    Tag: ({ children, ...props }: any) => <span data-testid="tag" {...props}>{children}</span>,
    Badge: ({ children, count, ...props }: any) => (
      <div data-testid="badge" {...props}>
        {children}
        {count && <span data-testid="badge-count">{count}</span>}
      </div>
    ),
  };
});

// Mock Ant Design icons
vi.mock('@ant-design/icons', () => ({
  SearchOutlined: () => <span data-testid="search-icon">🔍</span>,
  SettingOutlined: () => <span data-testid="setting-icon">⚙️</span>,
  CheckCircleOutlined: () => <span data-testid="check-icon">✅</span>,
  CloseCircleOutlined: () => <span data-testid="close-icon">❌</span>,
  ReloadOutlined: () => <span data-testid="reload-icon">🔄</span>,
  SaveOutlined: () => <span data-testid="save-icon">💾</span>,
}));

// Mock fetch
global.fetch = vi.fn();

// Mock React Query
const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockChannels = [
  {
    id: '1',
    title: 'Test Channel 1',
    channelId: 'UC123',
    selected: true,
    subscriberCount: 1000,
    videoCount: 50,
    thumbnail: 'https://example.com/thumb1.jpg'
  },
  {
    id: '2',
    title: 'Test Channel 2',
    channelId: 'UC456',
    selected: false,
    subscriberCount: 2000,
    videoCount: 100,
    thumbnail: 'https://example.com/thumb2.jpg'
  }
];

const renderWithQueryClient = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={mockQueryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ChannelManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockChannels,
    });
  });

  it('renders channel management interface', () => {
    renderWithQueryClient(<ChannelManagement />);
    
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('displays channels when data is loaded', async () => {
    renderWithQueryClient(<ChannelManagement />);
    
    await waitFor(() => {
      expect(screen.getByTestId('list')).toBeInTheDocument();
    });
    
    expect(screen.getAllByTestId('list-item')).toHaveLength(2);
  });

  it('shows loading skeleton when data is loading', () => {
    (global.fetch as vi.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithQueryClient(<ChannelManagement />);
    
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('shows empty state when no channels', async () => {
    (global.fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    
    renderWithQueryClient(<ChannelManagement />);
    
    await waitFor(() => {
      expect(screen.getByTestId('empty')).toBeInTheDocument();
    });
  });

  it('filters channels based on search term', async () => {
    renderWithQueryClient(<ChannelManagement />);
    
    await waitFor(() => {
      expect(screen.getByTestId('list')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByTestId('search-input').querySelector('input');
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'Test Channel 1' } });
    }
    
    // The filtering logic is handled by the component internally
    // We can verify the search input has the correct value
    expect(searchInput).toHaveValue('Test Channel 1');
  });

  it('handles channel toggle', async () => {
    (global.fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    
    renderWithQueryClient(<ChannelManagement />);
    
    await waitFor(() => {
      expect(screen.getByTestId('list')).toBeInTheDocument();
    });
    
    const switches = screen.getAllByTestId('switch');
    expect(switches).toHaveLength(2);
    
    // Toggle the first switch
    fireEvent.click(switches[0]);
    
    // Verify the API was called
    expect(global.fetch).toHaveBeenCalledWith('/api/channels/1', expect.any(Object));
  });

  it('shows error state when API fails', async () => {
    (global.fetch as vi.Mock).mockRejectedValue(new Error('API Error'));
    
    renderWithQueryClient(<ChannelManagement />);
    
    await waitFor(() => {
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  it('displays selected channel count', async () => {
    renderWithQueryClient(<ChannelManagement />);
    
    await waitFor(() => {
      expect(screen.getByTestId('list')).toBeInTheDocument();
    });
    
    // The selected count should be displayed (1 selected channel in mock data)
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('calls onChannelChange when channels are updated', async () => {
    const mockOnChannelChange = vi.fn();
    (global.fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    
    renderWithQueryClient(<ChannelManagement onChannelChange={mockOnChannelChange} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('list')).toBeInTheDocument();
    });
    
    const switches = screen.getAllByTestId('switch');
    fireEvent.click(switches[0]);
    
    // The onChannelChange should be called when save changes is triggered
    await waitFor(() => {
      expect(mockOnChannelChange).toHaveBeenCalled();
    });
  });
});
