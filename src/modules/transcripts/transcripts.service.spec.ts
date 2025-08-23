import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { TranscriptsService } from './transcripts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CaptionsService } from '../../common/services/captions.service';
import { ASRService } from '../../common/services/asr.service';
import { CaptionParserService } from '../../common/services/caption-parser.service';
import { TextNormalizerService } from '../../common/services/text-normalizer.service';
import { LanguageDetectorService } from '../../common/services/language-detector.service';
import { CaptionResponse } from './interfaces/captions-provider.interface';

describe('TranscriptsService', () => {
  let service: TranscriptsService;
  let prismaService: PrismaService;
  let captionsService: CaptionsService;
  let asrService: ASRService;
  let textNormalizer: TextNormalizerService;
  let languageDetector: LanguageDetectorService;

  const mockPrismaService = {
    transcript: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    video: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockCaptionsService = {
    fetchCaptions: jest.fn(),
  };

  const mockASRService = {
    isASREnabled: jest.fn(),
    runASR: jest.fn(),
  };

  const mockTextNormalizer = {
    validateTextQuality: jest.fn(),
  };

  const mockLanguageDetector = {
    shouldProcessLanguage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CaptionsService,
          useValue: mockCaptionsService,
        },
        {
          provide: ASRService,
          useValue: mockASRService,
        },
        {
          provide: CaptionParserService,
          useValue: {},
        },
        {
          provide: TextNormalizerService,
          useValue: mockTextNormalizer,
        },
        {
          provide: LanguageDetectorService,
          useValue: mockLanguageDetector,
        },
      ],
    }).compile();

    service = module.get<TranscriptsService>(TranscriptsService);
    prismaService = module.get<PrismaService>(PrismaService);
    captionsService = module.get<CaptionsService>(CaptionsService);
    asrService = module.get<ASRService>(ASRService);
    textNormalizer = module.get<TextNormalizerService>(TextNormalizerService);
    languageDetector = module.get<LanguageDetectorService>(LanguageDetectorService);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processTranscript', () => {
    const videoId = 'test-video-id';
    const userEmail = 'test@example.com';

    it('should return existing transcript if already processed', async () => {
      const existingTranscript = {
        id: 'existing-transcript-id',
        videoId,
        source: 'youtube',
        hasCaptions: true,
        text: 'Existing transcript text',
      };

      mockPrismaService.transcript.findFirst.mockResolvedValue(existingTranscript);

      const result = await service.processTranscript({
        videoId,
        userEmail,
        useASR: false,
      });

      expect(result.success).toBe(true);
      expect(result.transcriptId).toBe(existingTranscript.id);
      expect(result.source).toBe('youtube');
      expect(mockCaptionsService.fetchCaptions).not.toHaveBeenCalled();
    });

    it('should successfully process new transcript from YouTube captions', async () => {
      const captionResponse: CaptionResponse = {
        hasCaptions: true,
        text: 'This is a test transcript from YouTube captions.',
        language: 'en',
        format: 'srt',
      };

      const createdTranscript = {
        id: 'new-transcript-id',
        videoId,
        source: 'youtube',
        hasCaptions: true,
        text: captionResponse.text,
        language: captionResponse.language,
        format: captionResponse.format,
      };

      mockPrismaService.transcript.findFirst.mockResolvedValue(null);
      mockCaptionsService.fetchCaptions.mockResolvedValue(captionResponse);
      mockTextNormalizer.validateTextQuality.mockReturnValue({ isValid: true, issues: [] });
      mockLanguageDetector.shouldProcessLanguage.mockReturnValue(true);
      mockPrismaService.transcript.create.mockResolvedValue(createdTranscript);

      const result = await service.processTranscript({
        videoId,
        userEmail,
        useASR: false,
      });

      expect(result.success).toBe(true);
      expect(result.transcriptId).toBe(createdTranscript.id);
      expect(result.source).toBe('youtube');
      expect(mockCaptionsService.fetchCaptions).toHaveBeenCalledWith(videoId, userEmail);
    });

    it('should handle videos without captions gracefully', async () => {
      const captionResponse: CaptionResponse = {
        hasCaptions: false,
        error: 'No caption tracks available',
      };

      mockPrismaService.transcript.findFirst.mockResolvedValue(null);
      mockCaptionsService.fetchCaptions.mockResolvedValue(captionResponse);

      const result = await service.processTranscript({
        videoId,
        userEmail,
        useASR: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No captions available');
      expect(result.source).toBe('none');
    });

    it('should try ASR fallback when captions are not available and ASR is enabled', async () => {
      const noCaptionsResponse: CaptionResponse = {
        hasCaptions: false,
        error: 'No caption tracks available',
      };

      const asrResponse: CaptionResponse = {
        hasCaptions: true,
        text: 'This is a transcript from ASR processing.',
        language: 'en',
        format: 'asr',
      };

      const video = {
        id: videoId,
        url: 'https://www.youtube.com/watch?v=test-video-id',
      };

      const createdTranscript = {
        id: 'asr-transcript-id',
        videoId,
        source: 'asr',
        hasCaptions: true,
        text: asrResponse.text,
        language: asrResponse.language,
        format: asrResponse.format,
      };

      mockPrismaService.transcript.findFirst.mockResolvedValue(null);
      mockCaptionsService.fetchCaptions.mockResolvedValue(noCaptionsResponse);
      mockASRService.isASREnabled.mockReturnValue(true);
      mockPrismaService.video.findUnique.mockResolvedValue(video);
      mockASRService.runASR.mockResolvedValue(asrResponse);
      mockTextNormalizer.validateTextQuality.mockReturnValue({ isValid: true, issues: [] });
      mockLanguageDetector.shouldProcessLanguage.mockReturnValue(true);
      mockPrismaService.transcript.create.mockResolvedValue(createdTranscript);

      const result = await service.processTranscript({
        videoId,
        userEmail,
        useASR: true,
      });

      expect(result.success).toBe(true);
      expect(result.transcriptId).toBe(createdTranscript.id);
      expect(result.source).toBe('asr');
      expect(mockASRService.runASR).toHaveBeenCalledWith(video.url);
    });

    it('should reject poor quality transcripts', async () => {
      const captionResponse: CaptionResponse = {
        hasCaptions: true,
        text: 'Poor quality transcript with many errors',
        language: 'en',
        format: 'srt',
      };

      mockPrismaService.transcript.findFirst.mockResolvedValue(null);
      mockCaptionsService.fetchCaptions.mockResolvedValue(captionResponse);
      mockTextNormalizer.validateTextQuality.mockReturnValue({
        isValid: false,
        issues: ['Too many errors', 'Poor formatting'],
      });

      const result = await service.processTranscript({
        videoId,
        userEmail,
        useASR: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Poor transcript quality');
      expect(result.source).toBe('youtube');
    });

    it('should reject non-English transcripts', async () => {
      const captionResponse: CaptionResponse = {
        hasCaptions: true,
        text: 'Ceci est un transcript en français',
        language: 'fr',
        format: 'srt',
      };

      mockPrismaService.transcript.findFirst.mockResolvedValue(null);
      mockCaptionsService.fetchCaptions.mockResolvedValue(captionResponse);
      mockTextNormalizer.validateTextQuality.mockReturnValue({ isValid: true, issues: [] });
      mockLanguageDetector.shouldProcessLanguage.mockReturnValue(false);

      const result = await service.processTranscript({
        videoId,
        userEmail,
        useASR: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Non-English language not supported');
      expect(result.source).toBe('youtube');
    });

    it('should handle processing errors gracefully', async () => {
      mockPrismaService.transcript.findFirst.mockRejectedValue(new Error('Database error'));

      const result = await service.processTranscript({
        videoId,
        userEmail,
        useASR: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.source).toBe('error');
    });
  });

  describe('batchProcessTranscripts', () => {
    const videoIds = ['video1', 'video2', 'video3'];
    const userEmail = 'test@example.com';

    it('should process multiple videos and return summary statistics', async () => {
      const mockResults = [
        { success: true, transcriptId: 'transcript1', source: 'youtube' },
        { success: false, error: 'No captions available', source: 'none' },
        { success: true, transcriptId: 'transcript3', source: 'asr' },
      ];

      // Mock the processTranscript method for each video
      jest.spyOn(service, 'processTranscript')
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2]);

      const result = await service.batchProcessTranscripts(videoIds, userEmail);

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.results).toHaveLength(3);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.results[2].success).toBe(true);
    });

    it('should handle errors in batch processing', async () => {
      jest.spyOn(service, 'processTranscript')
        .mockResolvedValueOnce({ success: true, transcriptId: 'transcript1', source: 'youtube' })
        .mockRejectedValueOnce(new Error('Processing error'))
        .mockResolvedValueOnce({ success: false, error: 'Database error', source: 'error' });

      const result = await service.batchProcessTranscripts(videoIds, userEmail);

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.results).toHaveLength(3);
    });
  });

  describe('getProcessingStats', () => {
    it('should return processing statistics', async () => {
      const mockStats = {
        totalVideos: 100,
        videosWithTranscripts: 75,
        bySource: [
          { source: 'youtube', _count: { source: 60 } },
          { source: 'asr', _count: { source: 15 } },
        ],
      };

      mockPrismaService.video.count.mockResolvedValue(mockStats.totalVideos);
      mockPrismaService.transcript.count.mockResolvedValue(mockStats.videosWithTranscripts);
      mockPrismaService.transcript.groupBy.mockResolvedValue(mockStats.bySource);

      const result = await service.getProcessingStats();

      expect(result.totalVideos).toBe(100);
      expect(result.videosWithTranscripts).toBe(75);
      expect(result.processingRate).toBe(75);
      expect(result.bySource).toEqual({
        youtube: 60,
        asr: 15,
      });
    });

    it('should handle zero videos case', async () => {
      mockPrismaService.video.count.mockResolvedValue(0);
      mockPrismaService.transcript.count.mockResolvedValue(0);
      mockPrismaService.transcript.groupBy.mockResolvedValue([]);

      const result = await service.getProcessingStats();

      expect(result.totalVideos).toBe(0);
      expect(result.videosWithTranscripts).toBe(0);
      expect(result.processingRate).toBe(0);
      expect(result.bySource).toEqual({});
    });
  });

  describe('createTranscript', () => {
    it('should create a new transcript record', async () => {
      const createDto = {
        videoId: 'test-video',
        source: 'youtube' as const,
        hasCaptions: true,
        text: 'Test transcript text',
        language: 'en',
        format: 'srt',
      };

      const createdTranscript = {
        id: 'new-transcript-id',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.transcript.create.mockResolvedValue(createdTranscript);

      const result = await service.createTranscript(createDto);

      expect(result).toEqual(createdTranscript);
      expect(mockPrismaService.transcript.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('getTranscript', () => {
    it('should retrieve transcript by video ID', async () => {
      const transcript = {
        id: 'transcript-id',
        videoId: 'test-video',
        source: 'youtube',
        hasCaptions: true,
        text: 'Test transcript',
      };

      mockPrismaService.transcript.findFirst.mockResolvedValue(transcript);

      const result = await service.getTranscript('test-video');

      expect(result).toEqual(transcript);
      expect(mockPrismaService.transcript.findFirst).toHaveBeenCalledWith({
        where: { videoId: 'test-video' },
      });
    });
  });

  describe('getTranscriptsByVideoIds', () => {
    it('should retrieve multiple transcripts by video IDs', async () => {
      const transcripts = [
        { id: 'transcript1', videoId: 'video1', source: 'youtube', hasCaptions: true, text: 'Transcript 1' },
        { id: 'transcript2', videoId: 'video2', source: 'asr', hasCaptions: true, text: 'Transcript 2' },
      ];

      mockPrismaService.transcript.findMany.mockResolvedValue(transcripts);

      const result = await service.getTranscriptsByVideoIds(['video1', 'video2']);

      expect(result).toEqual(transcripts);
      expect(mockPrismaService.transcript.findMany).toHaveBeenCalledWith({
        where: {
          videoId: { in: ['video1', 'video2'] },
        },
      });
    });
  });
});
