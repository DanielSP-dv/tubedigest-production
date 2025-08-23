import React, { useState } from 'react';
import { 
  Modal, 
  List, 
  Button, 
  Space, 
  Typography, 
  Input, 
  Tag, 
  Divider,
  Row,
  Col,
  Pagination,
  Popconfirm,
  message,
  Upload
} from 'antd';
import { 
  DragOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  ImportOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
// import { Channel } from '../../types';

// Temporary interface definition to fix import issue
interface Channel {
  id: string;
  title: string;
  selected: boolean;
  order?: number;
}

const { Title, Text } = Typography;
const { Search } = Input;

interface EnhancedChannelManagementModalProps {
  open: boolean;
  onClose: () => void;
  channels: Channel[];
  onReorder: (channels: Channel[]) => void;
  onImport: (channelIds: string[]) => void;
  onRemove: (channelId: string) => void;
  onToggle: (channelId: string, selected: boolean) => void;
}

const EnhancedChannelManagementModal: React.FC<EnhancedChannelManagementModalProps> = ({
  open,
  onClose,
  channels,
  onReorder,
  onImport,
  onRemove,
  onToggle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');

  // Filter channels based on search term
  const filteredChannels = channels.filter(channel =>
    channel.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate channels
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedChannels = filteredChannels.slice(startIndex, endIndex);

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(channels);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const reorderedChannels = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    onReorder(reorderedChannels);
  };

  // Handle channel removal
  const handleRemove = (channelId: string) => {
    onRemove(channelId);
    message.success('Channel removed successfully');
  };

  // Handle bulk import
  const handleImport = () => {
    if (!importText.trim()) {
      message.error('Please enter channel IDs to import');
      return;
    }

    const channelIds = importText
      .split('\n')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (channelIds.length === 0) {
      message.error('No valid channel IDs found');
      return;
    }

    onImport(channelIds);
    setImportText('');
    setImportModalVisible(false);
    message.success(`Imported ${channelIds.length} channels`);
  };

  // Handle file upload for import
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
    return false; // Prevent default upload behavior
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>Enhanced Channel Management</Title>
            <Tag color="blue">{channels.length} Channels</Tag>
          </Space>
        }
        open={open}
        onCancel={onClose}
        width={800}
        footer={[
          <Button key="import" icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>
            Import Channels
          </Button>,
          <Button key="cancel" onClick={onClose}>
            Close
          </Button>,
        ]}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Search and Controls */}
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Search
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setImportModalVisible(true)}
              >
                Add Channels
              </Button>
            </Col>
          </Row>

          <Divider />

          {/* Channel List with Drag and Drop */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="channels">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{ minHeight: '200px' }}
                >
                  <List
                    dataSource={paginatedChannels}
                    renderItem={(channel, index) => (
                      <Draggable key={channel.id} draggableId={channel.id} index={startIndex + index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                            }}
                          >
                            <List.Item
                              style={{
                                background: snapshot.isDragging ? '#f0f0f0' : 'white',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                padding: '12px',
                              }}
                              actions={[
                                <Button
                                  key="drag"
                                  type="text"
                                  icon={<DragOutlined />}
                                  {...provided.dragHandleProps}
                                  style={{ cursor: 'grab' }}
                                />,
                                <Button
                                  key="toggle"
                                  type={channel.selected ? 'primary' : 'default'}
                                  size="small"
                                  onClick={() => onToggle(channel.id, !channel.selected)}
                                >
                                  {channel.selected ? 'Selected' : 'Select'}
                                </Button>,
                                <Popconfirm
                                  key="delete"
                                  title="Remove this channel?"
                                  description="This action cannot be undone."
                                  onConfirm={() => handleRemove(channel.id)}
                                  okText="Yes"
                                  cancelText="No"
                                >
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="small"
                                  />
                                </Popconfirm>,
                              ]}
                            >
                              <List.Item.Meta
                                title={
                                  <Space>
                                    <Text strong>{channel.title}</Text>
                                    {channel.selected && <Tag color="green">Active</Tag>}
                                  </Space>
                                }
                                description={`Channel ID: ${channel.id}`}
                              />
                            </List.Item>
                          </div>
                        )}
                      </Draggable>
                    )}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Pagination */}
          {filteredChannels.length > pageSize && (
            <div style={{ textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                total={filteredChannels.length}
                pageSize={pageSize}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size || 10);
                }}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => 
                  `${range[0]}-${range[1]} of ${total} channels`
                }
              />
            </div>
          )}
        </Space>
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Import Channels"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onOk={handleImport}
        okText="Import"
        cancelText="Cancel"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>Enter channel IDs (one per line):</Text>
          <Input.TextArea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Enter channel IDs here...
UC_x5XG1OV2P6uZZ5FSM9Ttw
UC-lHJZR3Gqxm24_Vd_AJ5Yw
..."
            rows={6}
          />
          <Divider>Or upload a file</Divider>
          <Upload
            beforeUpload={handleFileUpload}
            accept=".txt,.csv"
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Upload File</Button>
          </Upload>
        </Space>
      </Modal>
    </>
  );
};

export default EnhancedChannelManagementModal;

