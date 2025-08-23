import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, Typography, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card style={{ margin: '24px', textAlign: 'center' }}>
          <Space direction="vertical" size="large">
            <div>
              <Title level={3} type="danger">Something went wrong</Title>
              <Text type="secondary">
                An unexpected error occurred. Please try refreshing the page.
              </Text>
            </div>
            
            <Space>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
                aria-label="Retry loading the component"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                aria-label="Refresh the page"
              >
                Refresh Page
              </Button>
            </Space>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ textAlign: 'left', marginTop: '16px' }}>
                <summary>Error Details (Development)</summary>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </Space>
        </Card>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
