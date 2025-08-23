import React from 'react';
import { Spin, Progress, Skeleton } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
  loading: boolean;
  text?: string;
  size?: 'small' | 'default' | 'large';
  type?: 'spinner' | 'progress' | 'skeleton';
  percent?: number;
  rows?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  loading,
  text = 'Loading...',
  size = 'default',
  type = 'spinner',
  percent = 0,
  rows = 3,
}) => {
  if (!loading) {
    return null;
  }

  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  switch (type) {
    case 'progress':
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Progress 
            type="circle" 
            percent={percent} 
            format={(percent) => `${percent}%`}
            size={size === 'small' ? 80 : size === 'large' ? 120 : 100}
          />
          <div style={{ marginTop: '16px', color: '#666' }}>
            {text}
          </div>
        </div>
      );

    case 'skeleton':
      return (
        <div style={{ padding: '20px' }}>
          <Skeleton 
            active 
            paragraph={{ rows }} 
            title={{ width: '60%' }}
          />
        </div>
      );

    case 'spinner':
    default:
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin 
            indicator={antIcon} 
            size={size}
            tip={text}
          />
        </div>
      );
  }
};

export default LoadingSpinner;



