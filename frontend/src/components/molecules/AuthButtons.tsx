import React from 'react'
import { Button, Space, Avatar, Dropdown, Menu, Typography } from 'antd'
import { UserOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons'
import { useAuth } from '../../services/auth'

const { Text } = Typography

const AuthButtons: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error('Login failed:', error)
      // Could add toast notification here
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
      // Could add toast notification here
    }
  }

  if (isLoading) {
    return (
      <Button loading>
        Loading...
      </Button>
    )
  }

  if (!isAuthenticated) {
    return (
      <Button 
        type="primary" 
        icon={<LoginOutlined />}
        onClick={handleLogin}
        aria-label="Sign in with Google"
      >
        Sign In
      </Button>
    )
  }

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Text>{user?.email}</Text>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item 
        key="logout" 
        icon={<LogoutOutlined />}
        onClick={handleLogout}
        danger
      >
        Sign Out
      </Menu.Item>
    </Menu>
  )

  return (
    <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
      <Space style={{ cursor: 'pointer' }}>
        <Avatar icon={<UserOutlined />} />
        <Text>{user?.email}</Text>
      </Space>
    </Dropdown>
  )
}

export default AuthButtons
