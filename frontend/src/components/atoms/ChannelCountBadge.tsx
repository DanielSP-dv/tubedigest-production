import React from 'react';
import { Badge, Tag, Space, Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ChannelCountBadgeProps {
  count: number;
  total?: number;
  type?: 'badge' | 'tag' | 'text';
  size?: 'small' | 'default' | 'large';
  color?: string;
}

export const ChannelCountBadge: React.FC<ChannelCountBadgeProps> = ({
  count,
  total,
  type = 'badge',
  size = 'default',
  color = '#1890ff',
}) => {
  const displayText = total ? `${count}/${total}` : count.toString();
  const fontSize = size === 'small' ? '12px' : size === 'large' ? '16px' : '14px';

  switch (type) {
    case 'badge':
      return (
        <Badge 
          count={count} 
          size={size === 'large' ? 'default' : size}
          color={color}
          style={{ fontSize }}
        >
          <PlayCircleOutlined style={{ fontSize: '18px', color: '#666' }} />
        </Badge>
      );

    case 'tag':
      return (
        <Tag 
          color={color} 
          icon={<PlayCircleOutlined />}
          style={{ fontSize }}
        >
          {displayText} Channels
        </Tag>
      );

    case 'text':
    default:
      return (
        <Space size="small">
          <PlayCircleOutlined style={{ color: color, fontSize: '16px' }} />
          <Text 
            strong 
            style={{ fontSize, color }}
          >
            {displayText} Channels
          </Text>
        </Space>
      );
  }
};

export default ChannelCountBadge;
