import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Divider,
  Select,
  TimePicker,
  Switch,
  Row,
  Col,
  notification
} from 'antd';
import { SaveOutlined, UserOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

interface DigestPreferences {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  includeTranscripts: boolean;
  includeChapters: boolean;
  maxVideos: number;
}

const AccountSettings: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // TODO: Implement API call to save preferences
      console.log('Saving preferences:', values);
      notification.success({
        message: 'Settings Saved',
        description: 'Your account settings have been updated successfully.',
      });
    } catch (error) {
      notification.error({
        message: 'Save Failed',
        description: 'Failed to save settings. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>
        <UserOutlined /> Account Settings
      </Title>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          frequency: 'daily',
          time: '09:00',
          includeTranscripts: true,
          includeChapters: true,
          maxVideos: 10,
        }}
      >
        <Card title="Profile Information" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input placeholder="Enter your name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter your email" disabled />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title={<><BellOutlined /> Digest Preferences</>} style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Digest Frequency"
                name="frequency"
                rules={[{ required: true, message: 'Please select frequency' }]}
              >
                <Select placeholder="Select frequency">
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Digest Time"
                name="time"
                rules={[{ required: true, message: 'Please select time' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  placeholder="Select time"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Maximum Videos per Digest"
                name="maxVideos"
                rules={[{ required: true, message: 'Please enter max videos' }]}
              >
                <Select placeholder="Select max videos">
                  <Option value={5}>5 videos</Option>
                  <Option value={10}>10 videos</Option>
                  <Option value={15}>15 videos</Option>
                  <Option value={20}>20 videos</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Include Transcripts"
                name="includeTranscripts"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Include Chapters"
                name="includeChapters"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Space>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SaveOutlined />}
            loading={loading}
          >
            Save Settings
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default AccountSettings;



