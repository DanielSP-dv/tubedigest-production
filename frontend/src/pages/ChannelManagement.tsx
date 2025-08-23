import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  List, 
  Switch, 
  Space, 
  Typography, 
  Input, 
  Button, 
  notification, 
  Skeleton, 
  Empty,
  Divider,
  Row,
  Col,
  Tag,
  Badge
} from 'antd';
import { 
  SearchOutlined, 
  SettingOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useCSRF } from '../hooks/useCSRF';
import { apiClient } from '../utils/apiClient';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

interface Channel {
  id: string;
  title: string;
  channelId: string;
  selected: boolean;
  subscriberCount?: number;
  videoCount?: number;
  thumbnail?: string;
}

interface ChannelManagementProps {
  onChannelChange?: (channels: Channel[]) => void;
  onClose?: () => void;
  isModal?: boolean;
}

const ChannelManagement: React.FC<ChannelManagementProps> = ({ 
  onChannelChange, 
  onClose, 
  isModal = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Use CSRF hook
  const { getCSRFToken } = useCSRF();

  // Configure notifications to appear in bottom-right
  const [api, contextHolder] = notification.useNotification({
    placement: 'bottomRight',
    duration: 3,
  });

  // Fetch user's channels
  const { data: channels = [], isLoading, error } = useQuery({
    queryKey: ['channels'],
    queryFn: async (): Promise<Channel[]> => {
      const response = await fetch('/api/channels');
      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }
      const data = await response.json();
      return data.map((channel: any) => ({
        id: channel.id,
        title: channel.title,
        channelId: channel.channelId,
        selected: channel.selected || false,
        subscriberCount: channel.subscriberCount,
        videoCount: channel.videoCount,
        thumbnail: channel.thumbnail
      }));
    }
  });

  // Fetch selected channels separately to ensure accurate state
  const { data: selectedChannelsData = [] } = useQuery({
    queryKey: ['selected-channels'],
    queryFn: async () => {
      const response = await fetch('/api/channels/selected');
      if (!response.ok) {
        throw new Error('Failed to fetch selected channels');
      }
      return response.json();
    }
  });

  // Update channel selection mutation - REMOVED immediate notification
  const updateChannelMutation = useMutation({
    mutationFn: async ({ channelId, selected }: { channelId: string; selected: boolean }) => {
      // Get CSRF token
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        throw new Error('Failed to get CSRF token');
      }

      // Set the token in the API client
      apiClient.setCSRFToken(csrfToken);
      
      // Use the secure API client
      return apiClient.put(`/channels/${channelId}`, { selected });
    },
    onSuccess: () => {
      // Invalidate and refetch channels
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['selected-channels'] });
      // Invalidate digests to trigger feed refresh
      queryClient.invalidateQueries({ queryKey: ['digests'] });
      
      // NO NOTIFICATION HERE - only show when Save Changes is clicked
    },
    onError: (error) => {
      api.error({
        message: 'Update Failed',
        description: error.message || 'Failed to update channel selection.',
      });
    }
  });

  // Save all changes mutation - ONLY SHOW NOTIFICATION HERE
  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      // Apply all pending changes
      const promises = Array.from(pendingChanges.entries()).map(([channelId, selected]) =>
        updateChannelMutation.mutateAsync({ channelId, selected })
      );
      
      await Promise.all(promises);
      
      // Clear pending changes
      setPendingChanges(new Map());
      
      // This would typically batch all changes, but for now we'll just refresh
      await queryClient.invalidateQueries({ queryKey: ['channels'] });
      await queryClient.invalidateQueries({ queryKey: ['selected-channels'] });
      await queryClient.invalidateQueries({ queryKey: ['digests'] });
    },
    onSuccess: () => {
      setHasChanges(false);
      api.success({
        message: 'Changes Saved',
        description: 'All channel changes have been saved successfully.',
      });
      
      if (onChannelChange) {
        const updatedChannels = channels.map(channel => ({
          ...channel,
          selected: selectedChannels.has(channel.channelId)
        }));
        onChannelChange(updatedChannels);
      }
    },
    onError: (error) => {
      api.error({
        message: 'Save Failed',
        description: error.message || 'Failed to save changes.',
      });
    }
  });

  // Initialize selected channels from fetched data
  useEffect(() => {
    if (selectedChannelsData.length > 0) {
      const selected = new Set<string>(
        selectedChannelsData.map((channel: any) => channel.channelId)
      );
      setSelectedChannels(selected);
    }
  }, [selectedChannelsData]);

  // Filter channels based on search term
  const filteredChannels = channels.filter(channel =>
    channel.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle channel toggle - UPDATED: Track pending changes instead of immediate API call
  const handleChannelToggle = (channelId: string, selected: boolean) => {
    const newSelected = new Set(selectedChannels);
    
    // Enforce 10-channel limit
    if (selected && newSelected.size >= 10) {
      api.warning({
        message: 'Channel Limit Reached',
        description: 'You can only select up to 10 channels. Please deselect another channel first.',
      });
      return;
    }
    
    if (selected) {
      newSelected.add(channelId);
    } else {
      newSelected.delete(channelId);
    }
    setSelectedChannels(newSelected);
    
    // Track pending changes
    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(channelId, selected);
    setPendingChanges(newPendingChanges);
    
    setHasChanges(true);
    
    // NO IMMEDIATE API CALL - wait for Save Changes
  };

  // Handle save all changes
  const handleSaveChanges = () => {
    saveChangesMutation.mutate();
  };

  // Handle navigation to dashboard
  const handleNextToDashboard = () => {
    navigate('/dashboard');
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Empty
          description="Failed to load channels"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['channels'] })}
          >
            Retry
          </Button>
        </Empty>
      </div>
    );
  }

  const selectedCount = selectedChannels.size;
  const totalCount = channels.length;
  const maxChannels = 10;
  const isLimitReached = selectedCount >= maxChannels;

  return (
    <Layout style={{ minHeight: isModal ? 'auto' : '100vh', background: '#f5f5f5' }}>
      {contextHolder}
      <Content style={{ padding: isModal ? '16px' : '24px' }}>
        <Card>
          <div style={{ marginBottom: '24px' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={3} style={{ margin: 0 }}>
                  <SettingOutlined /> Channel Management
                </Title>
                <Text type="secondary">
                  Manage your channel selections for digest content
                </Text>
              </Col>
              <Col>
                <Space>
                  <Tag color="blue">
                    {selectedCount} of {maxChannels} selected
                  </Tag>
                  {isLimitReached && (
                    <Badge dot color="red">
                      <Tag color="red">Limit Reached</Tag>
                    </Badge>
                  )}
                  {hasChanges && (
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={saveChangesMutation.isPending}
                      onClick={handleSaveChanges}
                    >
                      Save Changes
                    </Button>
                  )}
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    onClick={handleNextToDashboard}
                  >
                    Next
                  </Button>
                  {onClose && (
                    <Button onClick={onClose}>
                      Close
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </div>

          <Divider />

          <div style={{ marginBottom: '16px' }}>
            <Search
              placeholder="Search channels..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
            />
          </div>

          {isLoading ? (
            <div>
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} style={{ marginBottom: '8px' }}>
                  <Skeleton active paragraph={{ rows: 1 }} />
                </Card>
              ))}
            </div>
          ) : filteredChannels.length === 0 ? (
            <Empty
              description={
                searchTerm 
                  ? `No channels found matching "${searchTerm}"`
                  : "No channels available"
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={filteredChannels}
              renderItem={(channel) => (
                <List.Item
                  key={channel.id}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleChannelToggle(
                    channel.channelId, // FIXED: Use channelId instead of id
                    !selectedChannels.has(channel.channelId) // FIXED: Use channelId
                  )}
                >
                  <List.Item.Meta
                    avatar={
                      channel.thumbnail ? (
                        <img 
                          src={channel.thumbnail} 
                          alt={channel.title}
                          style={{ width: '48px', height: '48px', borderRadius: '4px' }}
                        />
                      ) : (
                        <div 
                          style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '4px',
                            backgroundColor: '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <SettingOutlined />
                        </div>
                      )
                    }
                    title={
                      <Space>
                        <Text strong>{channel.title}</Text>
                        {selectedChannels.has(channel.channelId) ? ( // FIXED: Use channelId
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">Channel ID: {channel.channelId}</Text>
                        <Space>
                          {channel.subscriberCount && (
                            <Tag color="green">
                              {channel.subscriberCount.toLocaleString()} subscribers
                            </Tag>
                          )}
                          {channel.videoCount && (
                            <Tag color="blue">
                              {channel.videoCount} videos
                            </Tag>
                          )}
                        </Space>
                      </Space>
                    }
                  />
                  <div>
                    <Switch
                      checked={selectedChannels.has(channel.channelId)} // FIXED: Use channelId
                      onChange={(checked) => handleChannelToggle(channel.channelId, checked)} // FIXED: Use channelId
                    />
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default ChannelManagement;
