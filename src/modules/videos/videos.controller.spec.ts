import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { JobsService } from '../jobs/jobs.service';

describe('VideosController', () => {
  let controller: VideosController;
  let videosService: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        {
          provide: VideosService,
          useValue: {
            getAllVideosWithSummaries: jest.fn(),
            getProcessingStatus: jest.fn(),
          },
        },
        {
          provide: JobsService,
          useValue: {
            scheduleVideoIngestionForUser: jest.fn(),
            scheduleVideoIngestionForChannel: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VideosController>(VideosController);
    videosService = module.get<VideosService>(VideosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDigestVideos', () => {
    it('should filter videos by user selected channels', async () => {
      const mockVideos = [
        {
          id: '1',
          title: 'Test Video 1',
          channelId: 'channel1',
          summary: { 
            id: 'summary1',
            createdAt: new Date('2023-01-01'),
            videoId: '1',
            model: 'gpt-4',
            summaryText: 'Test summary 1'
          },
          chapters: [{ 
            id: 'chapter1',
            title: 'Chapter 1', 
            videoId: '1',
            startS: 0,
            endS: 60
          }],
          url: 'https://youtube.com/watch?v=1',
          durationS: 600,
          publishedAt: new Date('2023-01-01'),
          createdAt: new Date('2023-01-01'),
        },
      ];

      jest.spyOn(videosService, 'getAllVideosWithSummaries').mockResolvedValue(mockVideos);

      const mockRequest = { cookies: { userEmail: 'user@example.com' } } as any;
      const result = await controller.getDigestVideos(mockRequest);

      expect(videosService.getAllVideosWithSummaries).toHaveBeenCalledWith('user@example.com');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1',
        title: 'Test Video 1',
        channel: 'channel1',
        summary: 'Test summary 1',
        chapters: [{ title: 'Chapter 1', startTime: 0 }],
        thumbnail: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect width="400" height="225" fill="%231890ff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14">Test%20Video%201</text></svg>',
        url: 'https://youtube.com/watch?v=1',
        duration: 600,
        publishedAt: expect.any(String),
      });
    });

    it('should return empty array when no videos found', async () => {
      jest.spyOn(videosService, 'getAllVideosWithSummaries').mockResolvedValue([]);

      const mockRequest = { cookies: { userEmail: 'user@example.com' } } as any;
      const result = await controller.getDigestVideos(mockRequest);

      expect(result).toEqual([]);
    });
  });
});
