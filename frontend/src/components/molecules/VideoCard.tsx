import React, { useMemo } from 'react'
import { Card, Typography, Tag, Space, Button, Avatar } from 'antd'
import { PlayCircleOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

interface Video {
  id: string
  title: string
  channel: string
  summary: string
  chapters: Array<{
    title: string
    startTime: number
  }>
  thumbnail: string
  url: string
  duration: number
  publishedAt: string
}

interface VideoCardProps {
  video: Video
  onSave?: (videoId: string) => void
  onWatch?: (videoId: string) => void
  isSaved?: boolean
  layout?: 'grid' | 'list'
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  onSave, 
  onWatch, 
  isSaved = false,
  layout = 'grid'
}) => {
  // Memoize expensive formatting operations
  const formattedDuration = useMemo(() => {
    const formatDuration = (seconds: number) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
    return formatDuration(video.duration)
  }, [video.duration])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <Card
      hoverable
      cover={
        <div style={{ position: 'relative' }}>
          <img
            alt={video.title}
            src={video.thumbnail}
            style={{ 
              width: '100%', 
              height: layout === 'list' ? 120 : 200, 
              objectFit: 'cover' 
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: '12px'
          }}>
            {formattedDuration}
          </div>
        </div>
      }
      actions={[
        <Button 
          type="text" 
          icon={<PlayCircleOutlined />}
          onClick={() => onWatch?.(video.id)}
          aria-label={`Watch ${video.title}`}
          title={`Watch ${video.title}`}
        >
          Watch
        </Button>,
        <Button 
          type="text" 
          icon={<BookOutlined />}
          onClick={() => onSave?.(video.id)}
          style={{ color: isSaved ? '#1890ff' : undefined }}
          aria-label={isSaved ? `Remove ${video.title} from saved` : `Save ${video.title}`}
          title={isSaved ? `Remove ${video.title} from saved` : `Save ${video.title}`}
        >
          {isSaved ? 'Saved' : 'Save'}
        </Button>
      ]}
    >
      <Card.Meta
        title={
          <Title level={5} style={{ margin: 0, lineHeight: 1.4 }}>
            {video.title}
          </Title>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {video.channel}
            </Text>
            
            <Paragraph 
              ellipsis={{ rows: 3, expandable: true, symbol: 'Show more' }}
              style={{ margin: 0, fontSize: '14px' }}
            >
              {video.summary}
            </Paragraph>
            
            {video.chapters.length > 0 && (
              <div>
                <Text strong style={{ fontSize: '12px' }}>
                  Chapters ({video.chapters.length}):
                </Text>
                <div style={{ marginTop: 4 }}>
                  {video.chapters.slice(0, 3).map((chapter, index) => (
                    <Tag key={index} size="small" style={{ marginBottom: 2 }}>
                      {formatTime(chapter.startTime)} - {chapter.title}
                    </Tag>
                  ))}
                  {video.chapters.length > 3 && (
                    <Tag size="small" style={{ marginBottom: 2 }}>
                      +{video.chapters.length - 3} more
                    </Tag>
                  )}
                </div>
              </div>
            )}
            
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Published {new Date(video.publishedAt).toLocaleDateString()}
            </Text>
          </Space>
        }
      />
    </Card>
  )
}

export type { Video }
export default VideoCard
