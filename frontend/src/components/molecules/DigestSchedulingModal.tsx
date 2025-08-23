import React, { useState } from 'react';
import { Modal, Radio, DatePicker, Button, Space, Typography, Form, Input, notification } from 'antd';
import { ClockCircleOutlined, MailOutlined, EyeOutlined } from '@ant-design/icons';
import type { RadioChangeEvent } from 'antd';

const { Title, Text } = Typography;
const { TextArea } = Input;

export interface DigestScheduleData {
  cadence: 'immediate' | 'daily' | 'weekly' | 'custom';
  customDays?: number;
  startDate?: Date;
  email?: string;
  preview?: boolean;
}

interface DigestSchedulingModalProps {
  visible: boolean;
  onCancel: () => void;
  onSchedule: (data: DigestScheduleData) => void;
  onSendNow: () => void;
  onPreview: () => void;
  loading?: boolean;
  previewLoading?: boolean;
}

const DigestSchedulingModal: React.FC<DigestSchedulingModalProps> = ({
  visible,
  onCancel,
  onSchedule,
  onSendNow,
  onPreview,
  loading = false,
  previewLoading = false,
}) => {
  const [form] = Form.useForm() || [{}];
  const [cadence, setCadence] = useState<'immediate' | 'daily' | 'weekly' | 'custom'>('immediate');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleCadenceChange = (e: RadioChangeEvent) => {
    const value = e.target.value;
    setCadence(value);
    setShowCustomInput(value === 'custom');
    
    if (value === 'immediate') {
      form.setFieldsValue({ startDate: undefined, customDays: undefined });
    }
  };

  const handleSendNow = () => {
    onSendNow();
  };

  const handleSchedule = async () => {
    try {
      const values = await form.validateFields();
      const scheduleData: DigestScheduleData = {
        cadence,
        email: values.email,
        startDate: values.startDate?.toDate(),
        customDays: values.customDays,
      };
      onSchedule(scheduleData);
    } catch (error) {
      notification.error({
        message: 'Validation Error',
        description: 'Please check your input and try again.',
      });
    }
  };

  const handlePreview = () => {
    onPreview();
  };

  const handleCancel = () => {
    form.resetFields();
    setCadence('immediate');
    setShowCustomInput(false);
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Schedule Digest</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ cadence: 'immediate' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Cadence Selection */}
          <div>
            <Title level={5}>When would you like to receive your digest?</Title>
            <Form.Item name="cadence" rules={[{ required: true, message: 'Please select a cadence' }]}>
              <Radio.Group onChange={handleCadenceChange} value={cadence}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Radio value="immediate">
                    <Space>
                      <MailOutlined />
                      <Text strong>Send Now</Text>
                      <Text type="secondary">Receive immediately</Text>
                    </Space>
                  </Radio>
                  <Radio value="daily">
                    <Space>
                      <ClockCircleOutlined />
                      <Text strong>Daily</Text>
                      <Text type="secondary">Every day at 9:00 AM</Text>
                    </Space>
                  </Radio>
                  <Radio value="weekly">
                    <Space>
                      <ClockCircleOutlined />
                      <Text strong>Weekly</Text>
                      <Text type="secondary">Every Monday at 9:00 AM</Text>
                    </Space>
                  </Radio>
                  <Radio value="custom">
                    <Space>
                      <ClockCircleOutlined />
                      <Text strong>Custom</Text>
                      <Text type="secondary">Set your own schedule</Text>
                    </Space>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
          </div>

          {/* Custom Schedule Options */}
          {showCustomInput && (
            <div>
              <Title level={5}>Custom Schedule</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                  name="customDays"
                  label="Every X days"
                  rules={[{ required: true, message: 'Please specify the number of days' }]}
                >
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    placeholder="e.g., 3 for every 3 days"
                    addonAfter="days"
                  />
                </Form.Item>
                <Form.Item
                  name="startDate"
                  label="Start Date"
                  rules={[{ required: true, message: 'Please select a start date' }]}
                >
                  <DatePicker
                    showTime={{ format: 'HH:mm' }}
                    format="YYYY-MM-DD HH:mm"
                    placeholder="Select start date and time"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Space>
            </div>
          )}

          {/* Email Override (Optional) */}
          <div>
            <Title level={5}>Email Settings (Optional)</Title>
            <Form.Item
              name="email"
              label="Send to different email"
              rules={[
                { type: 'email', message: 'Please enter a valid email address' }
              ]}
            >
              <Input
                placeholder="Leave empty to use your default email"
                allowClear
              />
            </Form.Item>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <Space>
              <Button
                icon={<EyeOutlined />}
                onClick={handlePreview}
                loading={previewLoading}
                disabled={loading}
              >
                Preview
              </Button>
            </Space>
            <Space>
              <Button onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              {cadence === 'immediate' ? (
                <Button
                  type="primary"
                  icon={<MailOutlined />}
                  onClick={handleSendNow}
                  loading={loading}
                >
                  Send Now
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<ClockCircleOutlined />}
                  onClick={handleSchedule}
                  loading={loading}
                >
                  Schedule
                </Button>
              )}
            </Space>
          </div>
        </Space>
      </Form>
    </Modal>
  );
};

export default DigestSchedulingModal;
