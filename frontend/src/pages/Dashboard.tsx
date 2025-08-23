import React, { useState } from 'react'
import { Row, Col, Card, Input, Typography, Space, Tag, Skeleton, Button, notification, Dropdown } from 'antd'
import { Layout } from 'antd'
import { SearchOutlined, PlayCircleOutlined, ClockCircleOutlined, LoginOutlined, MenuFoldOutlined, MenuUnfoldOutlined, ReloadOutlined, MailOutlined, DownOutlined } from '@ant-design/icons'
import VideoCard from '../components/molecules/VideoCard'
import ChannelManagementSidebar from '../components/molecules/ChannelManagementSidebar'
import DigestSchedulingModal from '../components/molecules/DigestSchedulingModal'
import DigestPreviewModal from '../components/molecules/DigestPreviewModal'
import ChannelManagementModal from '../components/molecules/ChannelManagementModal'
import EnhancedChannelManagementModal from '../components/organisms/EnhancedChannelManagementModal'
import UserProfile from '../components/molecules/UserProfile'
import LoadingSpinner from '../components/atoms/LoadingSpinner'
import ChannelCountBadge from '../components/atoms/ChannelCountBadge'
import ActionFeedback from '../components/molecules/ActionFeedback'
import { useDigests } from '../hooks/useDigests'
import { useDigestScheduling } from '../hooks/useDigestScheduling'
import { useAuth } from '../services/auth'
import { useCSRF } from '../hooks/useCSRF'
import { apiClient } from '../utils/apiClient'
import authService from '../services/auth'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { MenuProps } from 'antd'

const { Title, Text } = Typography
const { Search } = Input
const { Content, Sider } = Layout

/**
 * Dashboard component for displaying video digests with collapsible sidebar
 * Handles authentication states and provides appropriate UI feedback
 * Shows sign-in prompts for unauthenticated users
 */
const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [channelManagementModalVisible, setChannelManagementModalVisible] = useState(false)
  const [enhancedChannelModalVisible, setEnhancedChannelModalVisible] = useState(false)
  const { data: digests, isLoading, error } = useDigests()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  // Use CSRF hook
  const { csrfToken, getCSRFToken } = useCSRF()
  
  // Use the digest scheduling hook
  const {
    schedulingModalVisible,
    setSchedulingModalVisible,
    previewModalVisible,
    setPreviewModalVisible,
    previewData,
    scheduleDigestMutation,
    previewDigestMutation,
    handleSchedule,
    handlePreview,
    handleSendFromPreview,
    handleScheduleFromPreview,
  } = useDigestScheduling()

  console.log('🔍 [Dashboard] Component rendered:', {
    isAuthenticated,
    authLoading,
    digests: digests?.length || 0,
    isLoading,
    error: error?.message
  })

  // Send digest mutation (for immediate sending)
  const sendDigestMutation = useMutation({
    mutationFn: async () => {
      // Ensure we have a CSRF token
      const token = await getCSRFToken();
      if (!token) {
        throw new Error('Failed to get CSRF token');
      }
      
      // Set the token in the API client
      apiClient.setCSRFToken(token);
      
      // Use the secure API client
      return apiClient.post('/digests/run');
    },
    onSuccess: (data) => {
      let description = '';
      if (data.status === 'no_new_videos') {
        description = 'No new videos found since your last digest. Your email has been sent with 0 videos.';
      } else if (data.status === 'no_channels') {
        description = 'No channels selected. Please select some channels first.';
      } else if (data.itemCount !== undefined) {
        description = `Your digest has been sent to your email with ${data.itemCount} videos.`;
      } else {
        description = 'Your digest has been sent to your email.';
      }
      
      notification.success({
        message: 'Digest Sent Successfully',
        description,
        placement: 'topRight',
      });
    },
    onError: (error) => {
      notification.error({
        message: 'Failed to Send Digest',
        description: error instanceof Error ? error.message : 'An error occurred while sending the digest.',
        placement: 'topRight',
      });
    },
  });

  // Filter digests based on search term
  const filteredDigests = digests?.filter(digest =>
    digest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    digest.summary.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  console.log('🔍 [Dashboard] Filtered digests:', filteredDigests.length)

  // Show loading state while checking authentication
  if (authLoading) {
    console.log('🔍 [Dashboard] Showing auth loading state')
    return (
      <Card>
        <LoadingSpinner 
          loading={true} 
          text="Checking authentication..." 
          type="skeleton" 
          rows={3}
        />
      </Card>
    )
  }

  // Show sign-in prompt for unauthenticated users
  if (!isAuthenticated) {
    console.log('🔍 [Dashboard] Showing sign-in prompt - user not authenticated')
    return (
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <Title level={2}>Welcome to TubeDigest</Title>
            <Text type="secondary">
              Sign in with your Google account to view your personalized video digests
            </Text>
          </div>
          
          <Button 
            type="primary" 
            size="large"
            icon={<LoginOutlined />}
            onClick={() => window.location.href = 'http://localhost:3001/auth/google'}
            aria-label="Sign in with Google"
          >
            Sign In with Google
          </Button>
          
          <Text type="secondary" style={{ fontSize: '12px' }}>
            We'll help you discover and summarize videos from your favorite YouTube channels
          </Text>
        </Space>
      </Card>
    )
  }

  // Handle authentication errors (401 responses)
  if (error && error.message?.includes('Authentication required')) {
    console.log('🔍 [Dashboard] Showing auth error state')
    return (
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
          <Text type="warning" strong>Authentication Required</Text>
          <Text type="secondary">
            Your session may have expired. Please sign in again to continue.
          </Text>
          <Button 
            type="primary" 
            icon={<LoginOutlined />}
            onClick={() => window.location.href = 'http://localhost:3001/auth/google'}
            aria-label="Sign in again"
          >
            Sign In Again
          </Button>
        </Space>
      </Card>
    )
  }

  // Handle other API errors
  if (error) {
    console.log('🔍 [Dashboard] Showing API error state:', error.message)
    return (
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
          <Text type="danger" strong>Error loading digests</Text>
          <Text type="secondary">
            {error.message || 'Please check your connection and try again later.'}
          </Text>
          <Button 
            type="primary" 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['digests'] })
            }}
            aria-label="Retry loading digests"
          >
            Retry
          </Button>
        </Space>
      </Card>
    )
  }

  console.log('🔍 [Dashboard] Rendering main dashboard content')

  // Handle channel toggle
  const onChannelToggle = (channelId: string, enabled: boolean) => {
    // The sidebar now handles its own debounced refresh
    // No immediate page reload needed
  }

  // Handle refresh
  const onRefresh = () => {
    // Invalidate both videos and digests queries for comprehensive refresh
    queryClient.invalidateQueries({ queryKey: ['videos'] })
    queryClient.invalidateQueries({ queryKey: ['digests'] })
  }

  // Handle immediate digest sending
  const handleSendNow = () => {
    sendDigestMutation.mutate();
  };

  // Handle logout
  const handleLogout = () => {
    // Call the auth service logout function
    authService.logout();
  };

  // Handle settings navigation
  const handleSettings = () => {
    navigate('/settings');
  };

  // Create dropdown menu items
  const digestMenuItems: MenuProps['items'] = [
    {
      key: 'send-now',
      label: 'Send Now',
      icon: <MailOutlined />,
      onClick: handleSendNow,
    },
    {
      key: 'schedule',
      label: 'Schedule',
      icon: <ClockCircleOutlined />,
      onClick: () => setSchedulingModalVisible(true),
    },
    {
      key: 'preview',
      label: 'Preview',
      icon: <SearchOutlined />,
      onClick: handlePreview,
    },
  ];

  // Main dashboard content for authenticated users with sidebar layout
  return (
    <Layout className="app-container" style={{ minHeight: '100vh' }}>
      {/* Header with User Profile */}
      <Layout.Header className="app-header" style={{ 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff', fontWeight: 'bold' }}>
            📺 TubeDigest
          </Title>
        </div>
        <UserProfile 
          user={user}
          onLogout={handleLogout}
          onSettings={handleSettings}
        />
      </Layout.Header>

      <Layout style={{ background: '#f5f5f5' }}>
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={sidebarCollapsed}
          width={300}
          className="app-sidebar"
          style={{ 
            background: '#fff',
            borderRight: '1px solid #f0f0f0'
          }}
        >
          <div className="sidebar-header" style={{ 
            padding: '16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa'
          }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#262626' }}>
                  {sidebarCollapsed ? '📺' : '📺 Channels'}
                </Title>
                <Button
                  type="text"
                  icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                />
              </div>
              {!sidebarCollapsed && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Manage your selected channels
                </Text>
              )}
            </Space>
          </div>
          
          {/* Channel Management Sidebar Content */}
          {!sidebarCollapsed && (
            <div style={{ padding: '16px' }}>
              <ChannelManagementSidebar
                onChannelToggle={onChannelToggle}
                onRefresh={onRefresh}
                onEditChannels={() => {
                  setEnhancedChannelModalVisible(true)
                }}
              />
            </div>
          )}
        </Sider>
        
        <Layout style={{ background: '#f5f5f5' }}>
          <Content className="main-content" style={{ 
            padding: '24px',
            minHeight: 'calc(100vh - 64px)'
          }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div className="content-header" style={{ 
                background: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}>
                <Title level={2} style={{ margin: 0, color: '#262626' }}>
                  🎯 Dashboard
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Browse your video digests and manage your content
                </Text>
              </div>

              <Card style={{ 
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div className="search-actions-bar" style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <div className="search-section" style={{ flex: 1, minWidth: '300px' }}>
                      <Search
                        placeholder="Search digests by title or content..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search digests"
                        title="Search digests by title or content"
                      />
                    </div>
                    <div className="actions-section" style={{ 
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <Dropdown
                        menu={{ items: digestMenuItems }}
                        placement="bottomRight"
                        trigger={['click']}
                      >
                        <Button
                          type="primary"
                          icon={<MailOutlined />}
                          loading={sendDigestMutation.isPending || scheduleDigestMutation.isPending}
                          disabled={sendDigestMutation.isPending || scheduleDigestMutation.isPending}
                          aria-label="Create digest"
                          title="Create digest"
                          style={{ 
                            background: '#1890ff',
                            borderColor: '#1890ff',
                            fontWeight: '500'
                          }}
                        >
                          📧 Create Digest <DownOutlined />
                        </Button>
                      </Dropdown>
                      <Button
                        type="default"
                        icon={<ReloadOutlined />}
                        onClick={onRefresh}
                        aria-label="Refresh video feed"
                        title="Refresh video feed"
                        style={{ fontWeight: '500' }}
                      >
                        🔄 Refresh
                      </Button>
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '12px 0',
                    borderTop: '1px solid #f0f0f0',
                    marginTop: '16px'
                  }}>
                    <Text strong style={{ color: '#262626' }}>
                      📊 Found {filteredDigests.length} digests
                    </Text>
                  </div>
                </Space>
              </Card>

              {/* Loading skeleton for digests */}
              {isLoading ? (
                <Card style={{ 
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                  <div data-testid="skeleton-loading">
                    <LoadingSpinner 
                      loading={true} 
                      text="Loading digests..." 
                      type="skeleton" 
                      rows={4}
                    />
                  </div>
                </Card>
              ) : (
                /* Display digests or empty state */
                <Row gutter={[16, 16]}>
                  {filteredDigests.length > 0 ? (
                    filteredDigests.map((digest) => (
                      <Col xs={24} key={digest.id}>
                        <Card style={{ 
                          borderRadius: '8px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          border: '1px solid #f0f0f0'
                        }}>
                          <VideoCard video={digest} layout="list" />
                        </Card>
                      </Col>
                    ))
                  ) : (
                    <Col xs={24}>
                      <Card style={{ 
                        borderRadius: '8px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        border: '1px solid #f0f0f0',
                        background: '#fafafa'
                      }}>
                        <Space direction="vertical" size="large" style={{ 
                          width: '100%', 
                          textAlign: 'center',
                          padding: '40px 20px'
                        }}>
                          {searchTerm ? (
                            <>
                              <div style={{ fontSize: '48px', color: '#d9d9d9' }}>🔍</div>
                              <Title level={4} style={{ color: '#8c8c8c', margin: 0 }}>
                                No digests found
                              </Title>
                              <Text type="secondary" style={{ fontSize: '16px' }}>
                                Try adjusting your search terms or check back later for new content.
                              </Text>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: '48px', color: '#d9d9d9' }}>📺</div>
                              <Title level={4} style={{ color: '#8c8c8c', margin: 0 }}>
                                No videos found
                              </Title>
                              <Text type="secondary" style={{ fontSize: '16px', marginBottom: '24px' }}>
                                Select some channels in the sidebar to see videos from your favorite creators.
                              </Text>
                              <Button 
                                type="primary" 
                                size="large"
                                onClick={() => setChannelManagementModalVisible(true)}
                                style={{ 
                                  background: '#1890ff',
                                  borderColor: '#1890ff',
                                  fontWeight: '500',
                                  height: '40px',
                                  padding: '0 24px'
                                }}
                              >
                                📺 Select Channels
                              </Button>
                            </>
                          )}
                        </Space>
                      </Card>
                    </Col>
                  )}
                </Row>
              )}
            </Space>
          </Content>
        </Layout>
      </Layout>

      {/* Digest Scheduling Modal */}
      <DigestSchedulingModal
        visible={schedulingModalVisible}
        onCancel={() => setSchedulingModalVisible(false)}
        onSchedule={(data) => scheduleDigestMutation.mutate(data)}
        onSendNow={handleSendNow}
        onPreview={handlePreview}
        loading={scheduleDigestMutation.isPending}
        previewLoading={previewDigestMutation.isPending}
      />

      {/* Digest Preview Modal */}
      <DigestPreviewModal
        visible={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        onSend={handleSendFromPreview}
        onSchedule={() => {
          setPreviewModalVisible(false);
          setSchedulingModalVisible(true);
        }}
        data={previewData || undefined}
        loading={previewDigestMutation.isPending}
        sendLoading={sendDigestMutation.isPending}
        scheduleLoading={scheduleDigestMutation.isPending}
      />

      {/* Enhanced Channel Management Modal */}
      <EnhancedChannelManagementModal
        open={enhancedChannelModalVisible}
        onClose={() => setEnhancedChannelModalVisible(false)}
        channels={[]} // TODO: Get actual channels from hook
        onReorder={(channels) => {
          // TODO: Implement reordering
          console.log('Reordered channels:', channels);
        }}
        onImport={(channelIds) => {
          // TODO: Implement import
          console.log('Import channels:', channelIds);
        }}
        onRemove={(channelId) => {
          // TODO: Implement removal
          console.log('Remove channel:', channelId);
        }}
        onToggle={(channelId, selected) => {
          // TODO: Implement toggle
          console.log('Toggle channel:', channelId, selected);
        }}
      />
    </Layout>
  )
}

export default Dashboard
