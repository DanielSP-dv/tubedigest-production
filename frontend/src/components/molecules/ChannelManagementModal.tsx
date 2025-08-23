import React, { useState } from 'react';
import { Modal, Button, Space, notification } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import ChannelManagement from '../../pages/ChannelManagement';

interface Channel {
  id: string;
  title: string;
  channelId: string;
  selected: boolean;
  subscriberCount?: number;
  videoCount?: number;
  thumbnail?: string;
}

interface ChannelManagementModalProps {
  open: boolean;
  onClose: () => void;
  onChannelChange?: (channels: Channel[]) => void;
}

const ChannelManagementModal: React.FC<ChannelManagementModalProps> = ({
  open,
  onClose,
  onChannelChange
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleChannelChange = (channels: Channel[]) => {
    if (onChannelChange) {
      onChannelChange(channels);
    }
    
    notification.success({
      message: 'Channels Updated',
      description: 'Your channel selections have been updated successfully.',
    });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          Channel Management
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose}>
          Close
        </Button>
      ]}
      width={800}
      style={{ top: 20 }}
      bodyStyle={{ 
        maxHeight: '70vh', 
        overflow: 'auto',
        padding: 0 
      }}
    >
      <ChannelManagement
        isModal={true}
        onChannelChange={handleChannelChange}
        onClose={handleClose}
      />
    </Modal>
  );
};

export default ChannelManagementModal;

