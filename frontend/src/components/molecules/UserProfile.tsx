import React from 'react';
import { Avatar, Dropdown, Space, Typography, Button } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
// import { User } from '../../types';

// Temporary interface definition to fix import issue
interface User {
  email: string;
  name?: string;
  avatarUrl?: string;
}

const { Text } = Typography;

interface UserProfileProps {
  user: User;
  onLogout: () => void;
  onSettings: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onSettings }) => {
  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => console.log('Profile clicked'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: onSettings,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: onLogout,
      danger: true,
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement="bottomRight"
      trigger={['click']}
      overlayStyle={{
        zIndex: 1000,
        minWidth: '180px',
      }}
      getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
    >
      <Space 
        className="user-profile-trigger" 
        style={{ 
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '8px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Avatar 
          size="default" 
          icon={<UserOutlined />}
          src={user.avatarUrl}
          style={{
            backgroundColor: '#1890ff',
          }}
        />
        <div className="user-info">
          <Text strong style={{ color: '#333', fontSize: '14px' }}>
            {user.name || 'User'}
          </Text>
          <Text 
            type="secondary" 
            style={{ 
              fontSize: '12px', 
              display: 'block',
              color: '#666',
              lineHeight: '1.2'
            }}
          >
            {user.email}
          </Text>
        </div>
      </Space>
    </Dropdown>
  );
};

export default UserProfile;

