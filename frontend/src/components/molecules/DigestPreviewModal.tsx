import React from 'react';
import { Modal, Typography, Space, Card, Tag, Divider, Skeleton, Empty, Button } from 'antd';
import { MailOutlined, ClockCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import VideoCard from './VideoCard';

const { Title, Text, Paragraph } = Typography;

export interface DigestPreviewData {
  id?: string;
  title: string;
  summary: string;
  videoCount: number;
  videos: Array<{
    id: string;
    title: string;
    summary: string;
    duration?: string;
    thumbnail?: string;
    publishedAt?: string;
    channelTitle?: string;
  }>;
  scheduledFor?: Date;
  email?: string;
}

interface DigestPreviewModalProps {
  visible: boolean;
  onCancel: () => void;
  onSend: () => void;
  onSchedule: () => void;
  data?: DigestPreviewData;
  loading?: boolean;
  sendLoading?: boolean;
  scheduleLoading?: boolean;
}

const DigestPreviewModal: React.FC<DigestPreviewModalProps> = ({
  visible,
  onCancel,
  onSend,
  onSchedule,
  data,
  loading = false,
  sendLoading = false,
  scheduleLoading = false,
}) => {
  const renderPreviewContent = () => {
    if (loading) {
      return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 2 }} />
          <Skeleton active paragraph={{ rows: 2 }} />
        </Space>
      );
    }

    if (!data) {
      return (
        <Empty
          description="No preview data available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Digest Header */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Title level={4}>{data.title}</Title>
              <Paragraph>{data.summary}</Paragraph>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Tag color="blue" icon={<PlayCircleOutlined />}>
                  {data.videoCount} videos
                </Tag>
                {data.scheduledFor && (
                  <Tag color="orange" icon={<ClockCircleOutlined />}>
                    Scheduled for {data.scheduledFor.toLocaleDateString()}
                  </Tag>
                )}
                {data.email && (
                  <Tag color="green" icon={<MailOutlined />}>
                    To: {data.email}
                  </Tag>
                )}
              </Space>
            </div>
          </Space>
        </Card>

        {/* Videos List */}
        <div>
          <Title level={5}>Videos in this digest:</Title>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {data.videos.length > 0 ? (
              data.videos.map((video, index) => (
                <Card key={video.id} size="small">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Text strong>{video.title}</Text>
                        {video.channelTitle && (
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {video.channelTitle}
                            </Text>
                          </div>
                        )}
                      </div>
                      <Space size="small">
                        {video.duration && (
                          <Tag size="small">{video.duration}</Tag>
                        )}
                        {video.publishedAt && (
                          <Tag size="small" type="secondary">
                            {new Date(video.publishedAt).toLocaleDateString()}
                          </Tag>
                        )}
                      </Space>
                    </div>
                    <Paragraph 
                      ellipsis={{ 
                        rows: 2, 
                        expandable: true, 
                        symbol: 'Show more' 
                      }}
                      style={{ margin: 0 }}
                    >
                      {video.summary}
                    </Paragraph>
                  </Space>
                </Card>
              ))
            ) : (
              <Empty
                description="No videos available for preview"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Space>
        </div>

        {/* Email Preview */}
        <Card>
          <Title level={5}>Email Preview</Title>
          <div style={{ 
            border: '1px solid #d9d9d9', 
            borderRadius: '6px', 
            padding: '16px', 
            background: '#fafafa' 
          }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text strong>Subject:</Text> {data.title}
              </div>
              <div>
                <Text strong>To:</Text> {data.email || 'Your default email'}
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <Text strong>Content Preview:</Text>
                <Paragraph style={{ margin: '8px 0 0 0' }}>
                  {data.summary}
                </Paragraph>
                <Text type="secondary">
                  This digest contains {data.videoCount} videos from your selected channels.
                </Text>
              </div>
            </Space>
          </div>
        </Card>
      </Space>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <MailOutlined />
          <span>Digest Preview</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        data?.scheduledFor ? (
          <Button
            key="schedule"
            type="primary"
            icon={<ClockCircleOutlined />}
            onClick={onSchedule}
            loading={scheduleLoading}
          >
            Schedule
          </Button>
        ) : (
          <Button
            key="send"
            type="primary"
            icon={<MailOutlined />}
            onClick={onSend}
            loading={sendLoading}
          >
            Send Now
          </Button>
        ),
      ]}
      width={800}
      destroyOnClose
    >
      {renderPreviewContent()}
    </Modal>
  );
};

export default DigestPreviewModal;
