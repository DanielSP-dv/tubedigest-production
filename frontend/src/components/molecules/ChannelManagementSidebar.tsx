import React, { useState } from 'react'
import { List, Switch, Button, Space, Typography, Avatar, Skeleton } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import { useChannels } from '../../hooks/useChannels'

const { Text, Title } = Typography

interface ChannelManagementSidebarProps {
  onChannelToggle?: (channelId: string, enabled: boolean) => void
  onRefresh?: () => void
  onEditChannels?: () => void
}

const ChannelManagementSidebar: React.FC<ChannelManagementSidebarProps> = ({
  onChannelToggle,
  onRefresh,
  onEditChannels,
}) => {
  const [selectAll, setSelectAll] = useState(false)
  
  const { data: channels, isLoading, error, selectedChannels, saveChannelSelection, isSaving, invalidateCache } = useChannels()
  




  // Handle select all/deselect all
  const handleSelectAll = () => {
    if (channels && selectedChannels) {
      const allChannelIds = channels.map(channel => channel.id)
      const allTitles = channels.reduce((acc, channel) => {
        acc[channel.id] = channel.title || 'Unknown Channel'
        return acc
      }, {} as Record<string, string>)

      if (selectAll) {
        // Deselect all
        saveChannelSelection({ channelIds: [], titles: {} })
      } else {
        // Select all (up to 10 channels)
        const channelIdsToSelect = allChannelIds.slice(0, 10)
        const titlesToSelect = Object.fromEntries(
          channelIdsToSelect.map(id => [id, allTitles[id]])
        )
        saveChannelSelection({ channelIds: channelIdsToSelect, titles: titlesToSelect })
      }
      setSelectAll(!selectAll)
      

    }
  }

  // Handle individual channel toggle
  const handleChannelToggle = (channelId: string, enabled: boolean) => {
    if (enabled) {
      // Add channel to selection
      const channel = channels?.find(c => c.id === channelId)
      if (channel && selectedChannels && selectedChannels.length < 10) {
        const newSelectedChannels = [...selectedChannels, { channelId, title: channel.title || 'Unknown Channel' }]
        const titles = createTitlesObject(newSelectedChannels)
        
        saveChannelSelection({
          channelIds: newSelectedChannels.map(ch => ch.channelId),
          titles
        })
      }
    } else {
      // Remove channel from selection
      const newSelectedChannels = selectedChannels?.filter(ch => ch.channelId !== channelId) || []
      const titles = createTitlesObject(newSelectedChannels)
      
      saveChannelSelection({
        channelIds: newSelectedChannels.map(ch => ch.channelId),
        titles
      })
    }
    

    
    // Call parent callback if provided
    onChannelToggle?.(channelId, enabled)
  }

  // Check if channel is selected
  const isChannelSelected = (channelId: string) => {
    return selectedChannels?.some(ch => ch.channelId === channelId) || false
  }

  // Utility function to create titles object from selected channels
  const createTitlesObject = (channels: Array<{ channelId: string; title: string }>) => {
    return channels.reduce((acc, ch) => {
      acc[ch.channelId] = ch.title
      return acc
    }, {} as Record<string, string>)
  }



  if (isLoading) {
    return (
      <div style={{ padding: '16px' }}>
        <div data-testid="skeleton-loading">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Skeleton active paragraph={{ rows: 3 }} />
            <Skeleton active paragraph={{ rows: 2 }} />
            <Skeleton active paragraph={{ rows: 2 }} />
          </Space>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text type="danger">Error loading channels</Text>
          <Text type="secondary">{error.message}</Text>
          <Button 
            type="primary" 
            size="small" 
            onClick={() => {
              // Trigger a retry by invalidating the channels query
              if (onRefresh) {
                onRefresh()
              } else {
                window.location.reload()
              }
            }}
          >
            Retry
          </Button>
        </Space>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>


        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>
            Channels ({selectedChannels?.length || 0}/10)
          </Title>
          <Button 
            type="text" 
            size="small"
            icon={<MenuOutlined />}
            aria-label="Channel menu"
          />
        </div>

        {/* Select All/Deselect All */}
        {channels && channels.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '12px' }}>
            <Button 
              type="text" 
              size="small"
              onClick={handleSelectAll}
              disabled={isSaving}
            >
              {selectAll ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        )}

        {/* Channel List */}
        {channels && channels.length > 0 ? (
          <List
            size="small"
            dataSource={channels}
            renderItem={(channel) => (
              <List.Item
                style={{ 
                  padding: '8px 0',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <Avatar 
                    src={channel.thumbnail} 
                    size={32}
                    style={{ marginRight: '8px', flexShrink: 0 }}
                  >
                    {channel.title?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text 
                      strong 
                      style={{ 
                        fontSize: '12px',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {channel.title || 'Unknown Channel'}
                    </Text>
                  </div>
                </div>
                <Switch
                  size="small"
                  checked={isChannelSelected(channel.id)}
                  onChange={(checked) => handleChannelToggle(channel.id, checked)}
                  disabled={isSaving}
                  aria-label={`Toggle ${channel.title || 'Unknown Channel'}`}
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text type="secondary">No channels available</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Connect your YouTube account to see your subscriptions
            </Text>
          </div>
        )}

        {/* Channel limit warning */}
        {selectedChannels && selectedChannels.length >= 10 && (
          <div style={{ 
            padding: '8px', 
            backgroundColor: '#fff2e8', 
            border: '1px solid #ffbb96',
            borderRadius: '4px'
          }}>
            <Text type="warning" style={{ fontSize: '12px' }}>
              Channel limit reached (10/10)
            </Text>
          </div>
        )}
      </Space>
    </div>
  )
}

export default ChannelManagementSidebar
