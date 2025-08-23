import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notification } from 'antd';
import { apiClient } from '../utils/apiClient';

interface DigestSchedule {
  id: string;
  email: string;
  cadence: string;
  customDays?: number;
  nextRun: string;
  lastRun?: string;
  enabled: boolean;
}

interface DigestPreview {
  title: string;
  summary: string;
  videoCount: number;
  videos: Array<{
    id: string;
    title: string;
    summary: string;
    duration: string;
    thumbnail: string;
    publishedAt: string;
    channelTitle: string;
  }>;
}

interface ScheduleDigestOptions {
  email?: string;
  cadence: string;
  startDate?: Date;
  customDays?: number;
}

export const useDigestScheduling = () => {
  const [schedulingModalVisible, setSchedulingModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState<DigestPreview | null>(null);
  const queryClient = useQueryClient();

  // Schedule digest mutation
  const scheduleDigestMutation = useMutation({
    mutationFn: async (options: ScheduleDigestOptions) => {
      return apiClient.post('/digests/schedule', {
        ...options,
        email: options.email || 'user@example.com', // Default email
      });
    },
    onSuccess: (data) => {
      notification.success({
        message: 'Digest Scheduled',
        description: `Your digest has been scheduled successfully. Next run: ${new Date(data.nextRun).toLocaleString()}`,
      });
      setSchedulingModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['digestSchedules'] });
    },
    onError: (error) => {
      notification.error({
        message: 'Schedule Failed',
        description: error.message || 'Failed to schedule digest',
      });
    },
  });

  // Preview digest mutation
  const previewDigestMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`/api/digests/preview?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setPreviewModalVisible(true);
    },
    onError: (error) => {
      notification.error({
        message: 'Preview Failed',
        description: error.message || 'Failed to generate digest preview',
      });
    },
  });

  // Get user schedules query
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['digestSchedules'],
    queryFn: async () => {
      const response = await fetch('/api/digests/schedules?email=user@example.com', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      
      return response.json();
    },
    enabled: false, // Only fetch when needed
  });

  // Cancel schedule mutation
  const cancelScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      return apiClient.delete(`/digests/schedules/${scheduleId}`, {
        body: JSON.stringify({ email: 'user@example.com' }), // TODO: Get from auth
      });
    },
    onSuccess: () => {
      notification.success({
        message: 'Schedule Cancelled',
        description: 'Your digest schedule has been cancelled successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['digestSchedules'] });
    },
    onError: (error) => {
      notification.error({
        message: 'Cancel Failed',
        description: error.message || 'Failed to cancel schedule',
      });
    },
  });

  // Send digest from preview mutation
  const sendDigestFromPreviewMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiClient.post('/digests/run', { email });
    },
    onSuccess: () => {
      notification.success({
        message: 'Digest Sent',
        description: 'Your digest has been sent successfully.',
      });
      setPreviewModalVisible(false);
    },
    onError: (error) => {
      notification.error({
        message: 'Send Failed',
        description: error.message || 'Failed to send digest',
      });
    },
  });

  // Schedule digest from preview mutation
  const scheduleDigestFromPreviewMutation = useMutation({
    mutationFn: async (options: ScheduleDigestOptions) => {
      return apiClient.post('/digests/schedule', options);
    },
    onSuccess: (data) => {
      notification.success({
        message: 'Digest Scheduled',
        description: `Your digest has been scheduled successfully. Next run: ${new Date(data.nextRun).toLocaleString()}`,
      });
      setPreviewModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['digestSchedules'] });
    },
    onError: (error) => {
      notification.error({
        message: 'Schedule Failed',
        description: error.message || 'Failed to schedule digest',
      });
    },
  });

  const handleSchedule = () => {
    setSchedulingModalVisible(true);
  };

  const handlePreview = () => {
    previewDigestMutation.mutate('user@example.com'); // TODO: Get from auth
  };

  const handleSendFromPreview = () => {
    sendDigestFromPreviewMutation.mutate('user@example.com'); // TODO: Get from auth
  };

  const handleScheduleFromPreview = (options: ScheduleDigestOptions) => {
    scheduleDigestFromPreviewMutation.mutate(options);
  };

  const handleCancelSchedule = (scheduleId: string) => {
    cancelScheduleMutation.mutate(scheduleId);
  };

  const refreshSchedules = () => {
    queryClient.invalidateQueries({ queryKey: ['digestSchedules'] });
  };

  return {
    // State
    schedulingModalVisible,
    setSchedulingModalVisible,
    previewModalVisible,
    setPreviewModalVisible,
    previewData,
    
    // Mutations
    scheduleDigestMutation,
    previewDigestMutation,
    cancelScheduleMutation,
    sendDigestFromPreviewMutation,
    scheduleDigestFromPreviewMutation,
    
    // Queries
    schedules,
    schedulesLoading,
    
    // Handlers
    handleSchedule,
    handlePreview,
    handleSendFromPreview,
    handleScheduleFromPreview,
    handleCancelSchedule,
    refreshSchedules,
  };
};
