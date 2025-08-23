import { Test, TestingModule } from '@nestjs/testing';
import { DigestsService } from './digests.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { VideosService } from '../videos/videos.service';
import { JobsService } from '../jobs/jobs.service';

describe('DigestsService', () => {
  let service: DigestsService;
  let prismaService: any;
  let emailService: jest.Mocked<EmailService>;
  let videosService: jest.Mocked<VideosService>;

  const mockUser = { id: 'user-1', email: 'user@example.com' };
  const mockChannel = { id: 'channel-1', name: 'Test Channel' };
  const mockVideo = {
    id: 'video-1',
    channelId: 'channel-1',
    title: 'Test Video',
    url: 'https://youtube.com/watch?v=test',
    publishedAt: new Date('2025-01-01'),
    createdAt: new Date('2025-01-01'),
    durationS: 3600,
    summary: {
      id: 'summary-1',
      createdAt: new Date('2025-01-01'),
      videoId: 'video-1',
      model: 'gpt-4',
      summaryText: 'This is a test video summary'
    },
    chapters: [
      { id: 'chapter-1', videoId: 'video-1', startS: 0, endS: 300, title: 'Introduction' },
      { id: 'chapter-2', videoId: 'video-1', startS: 300, endS: 1800, title: 'Main Content' }
    ]
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DigestsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              upsert: jest.fn(),
            },
            digestRun: {
              create: jest.fn(),
              update: jest.fn(),
              findFirst: jest.fn(),
            },
            channelSubscription: {
              findMany: jest.fn(),
            },
            video: {
              findMany: jest.fn(),
            },
            digestItem: {
              create: jest.fn(),
            },
          } as any,
        },
        {
          provide: EmailService,
          useValue: {
            sendDigest: jest.fn(),
          },
        },
        {
          provide: VideosService,
          useValue: {
            fetchNewVideosForChannel: jest.fn(),
            getVideosForDigest: jest.fn(),
          },
        },
        {
          provide: JobsService,
          useValue: {
            scheduleDigestForUserImmediate: jest.fn(),
            scheduleRecurringDigest: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DigestsService>(DigestsService);
    prismaService = module.get(PrismaService);
    emailService = module.get(EmailService);
    videosService = module.get(VideosService);
  });

  describe('assembleAndSend', () => {
    it('should send digest with videos when new videos exist', async () => {
      // Arrange
      prismaService.user.upsert.mockResolvedValue(mockUser);
      prismaService.digestRun.create.mockResolvedValue({ id: 'run-1', userId: mockUser.id, status: 'assembling' });
      prismaService.channelSubscription.findMany.mockResolvedValue([{ channelId: 'channel-1' }]);
      prismaService.digestRun.findFirst.mockResolvedValue(null); // No previous runs
      videosService.getVideosForDigest.mockResolvedValue([mockVideo]);
      prismaService.digestItem.create.mockResolvedValue({ id: 'item-1', digestRunId: 'run-1', videoId: 'video-1', position: 1 });
      emailService.sendDigest.mockResolvedValue('message-123');
      prismaService.digestRun.update.mockResolvedValue({ id: 'run-1', status: 'sent', messageId: 'message-123' });

      // Act
      const result = await service.assembleAndSend('user@example.com');

      // Assert
      expect(result).toEqual({
        id: 'run-1',
        messageId: 'message-123',
        itemCount: 1
      });
      expect(emailService.sendDigest).toHaveBeenCalledWith(
        'user@example.com',
        expect.stringContaining('TubeDigest'),
        expect.stringContaining('Test Video'),
        expect.stringContaining('Test Video') // text fallback
      );
    });

    it('should return no_channels status when no channels are selected', async () => {
      // Arrange
      prismaService.user.upsert.mockResolvedValue(mockUser);
      prismaService.digestRun.create.mockResolvedValue({ id: 'run-1', userId: mockUser.id, status: 'assembling' });
      prismaService.channelSubscription.findMany.mockResolvedValue([]); // No channels selected

      // Act
      const result = await service.assembleAndSend('user@example.com');

      // Assert
      expect(result).toEqual({
        id: 'run-1',
        status: 'no_channels'
      });
      expect(prismaService.digestRun.update).toHaveBeenCalledWith({
        where: { id: 'run-1' },
        data: { status: 'no_channels' }
      });
      expect(emailService.sendDigest).not.toHaveBeenCalled();
    });

    it('should return no_new_videos status when no new videos found', async () => {
      // Arrange
      prismaService.user.upsert.mockResolvedValue(mockUser);
      prismaService.digestRun.create.mockResolvedValue({ id: 'run-1', userId: mockUser.id, status: 'assembling' });
      prismaService.channelSubscription.findMany.mockResolvedValue([{ channelId: 'channel-1' }]);
      prismaService.digestRun.findFirst.mockResolvedValue(null);
      videosService.getVideosForDigest.mockResolvedValue([]); // No videos found

      // Act
      const result = await service.assembleAndSend('user@example.com');

      // Assert
      expect(result).toEqual({
        id: 'run-1',
        status: 'no_new_videos'
      });
      expect(prismaService.digestRun.update).toHaveBeenCalledWith({
        where: { id: 'run-1' },
        data: { status: 'no_new_videos' }
      });
      expect(emailService.sendDigest).not.toHaveBeenCalled();
    });

    it('should handle email send failures and update status to failed', async () => {
      // Arrange
      prismaService.user.upsert.mockResolvedValue(mockUser);
      prismaService.digestRun.create.mockResolvedValue({ id: 'run-1', userId: mockUser.id, status: 'assembling' });
      prismaService.channelSubscription.findMany.mockResolvedValue([{ channelId: 'channel-1' }]);
      prismaService.digestRun.findFirst.mockResolvedValue(null);
      videosService.getVideosForDigest.mockResolvedValue([mockVideo]);
      prismaService.digestItem.create.mockResolvedValue({ id: 'item-1', digestRunId: 'run-1', videoId: 'video-1', position: 1 });
      emailService.sendDigest.mockRejectedValue(new Error('SMTP connection failed'));

      // Act & Assert
      await expect(service.assembleAndSend('user@example.com')).rejects.toThrow('SMTP connection failed');
      expect(prismaService.digestRun.update).toHaveBeenCalledWith({
        where: { id: 'run-1' },
        data: { status: 'failed' }
      });
    });

    it('should include video summary and chapters in email HTML', async () => {
      // Arrange
      prismaService.user.upsert.mockResolvedValue(mockUser);
      prismaService.digestRun.create.mockResolvedValue({ id: 'run-1', userId: mockUser.id, status: 'assembling' });
      prismaService.channelSubscription.findMany.mockResolvedValue([{ channelId: 'channel-1' }]);
      prismaService.digestRun.findFirst.mockResolvedValue(null);
      videosService.getVideosForDigest.mockResolvedValue([mockVideo]);
      prismaService.digestItem.create.mockResolvedValue({ id: 'item-1', digestRunId: 'run-1', videoId: 'video-1', position: 1 });
      emailService.sendDigest.mockResolvedValue('message-123');
      prismaService.digestRun.update.mockResolvedValue({ id: 'run-1', status: 'sent', messageId: 'message-123' });

      // Act
      await service.assembleAndSend('user@example.com');

      // Assert
      expect(emailService.sendDigest).toHaveBeenCalledWith(
        'user@example.com',
        expect.any(String),
        expect.stringContaining('This is a test video summary'), // Summary text
        expect.stringContaining('This is a test video summary') // text fallback
      );
    });
  });

  describe('formatTimestamp', () => {
    it('should format seconds to MM:SS', () => {
      expect(service['formatTimestamp'](65)).toBe('1:05');
      expect(service['formatTimestamp'](3661)).toBe('1:01:01');
      expect(service['formatTimestamp'](0)).toBe('0:00');
    });
  });

  describe('formatDuration', () => {
    it('should format duration in seconds to human readable format', () => {
      expect(service['formatDuration'](65)).toBe('1:05');
      expect(service['formatDuration'](3661)).toBe('1:01:01');
      expect(service['formatDuration'](3600)).toBe('1:00:00');
    });
  });
});
