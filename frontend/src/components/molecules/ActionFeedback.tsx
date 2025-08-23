import React, { useEffect, useState } from 'react';
import { Alert, notification, Space, Typography } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ActionFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
  showNotification?: boolean;
  showAlert?: boolean;
  onClose?: () => void;
}

export const ActionFeedback: React.FC<ActionFeedbackProps> = ({
  type,
  message,
  description,
  duration = 4.5,
  showNotification = true,
  showAlert = false,
  onClose,
}) => {
  const [visible, setVisible] = useState(showAlert);

  useEffect(() => {
    if (showNotification) {
      notification[type]({
        message,
        description,
        duration,
        placement: 'topRight',
        icon: getIcon(type),
      });
    }
  }, [type, message, description, duration, showNotification]);

  const getIcon = (feedbackType: string) => {
    switch (feedbackType) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!showAlert || !visible) {
    return null;
  }

  return (
    <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
      <Alert
        message={message}
        description={description}
        type={type}
        showIcon
        closable
        onClose={handleClose}
        icon={getIcon(type)}
      />
    </Space>
  );
};

export default ActionFeedback;



