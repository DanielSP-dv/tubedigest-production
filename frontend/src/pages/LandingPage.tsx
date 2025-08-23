import React from 'react'
import { Button, Typography, Space, Card } from 'antd'

const { Title, Paragraph } = Typography

const LandingPage: React.FC = () => {
  const handleCreate = () => {
    window.location.href = '/api/auth/google'
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Card style={{ maxWidth: 720, width: '100%' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', alignItems: 'center' }}>
          <Title>TubeDigest</Title>
          <Paragraph>Get summaries from your favorite YouTube channels.</Paragraph>
          <Button type="primary" size="large" onClick={handleCreate}>
            Create Your First Digest
          </Button>
        </Space>
      </Card>
    </div>
  )
}

export default LandingPage
