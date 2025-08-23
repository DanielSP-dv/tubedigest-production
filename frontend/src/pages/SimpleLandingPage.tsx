import React from 'react';
import { Button, Typography, Space, Card } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const SimpleLandingPage: React.FC = () => {
  const handleLogin = () => {
    // Simple redirect to backend OAuth
    window.location.href = 'http://localhost:3001/auth/google';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f2f5',
      padding: '20px'
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>TubeDigest</Title>
            <Paragraph type="secondary">
              Get AI-powered summaries of your favorite YouTube videos
            </Paragraph>
          </div>
          
          <Button
            type="primary"
            size="large"
            icon={<GoogleOutlined />}
            onClick={handleLogin}
            style={{ width: '100%' }}
          >
            Sign in with Google
          </Button>
          
          <Paragraph style={{ fontSize: '12px' }} type="secondary">
            After signing in, you'll be able to select your favorite channels and get daily digests
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
};

export default SimpleLandingPage;