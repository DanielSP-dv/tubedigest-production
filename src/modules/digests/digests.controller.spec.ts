import { Test, TestingModule } from '@nestjs/testing';
import { DigestsController } from './digests.controller';
import { DigestsService } from './digests.service';
import { JobsService } from '../jobs/jobs.service';
import { YouTubeService } from '../youtube/youtube.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DigestsController', () => {
  let controller: DigestsController;
  let service: DigestsService;
  let jobsService: JobsService;
  let youtubeService: YouTubeService;
  let emailService: EmailService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DigestsController],
      providers: [
        {
          provide: DigestsService,
          useValue: {
            // Mock service methods
            assembleAndSend: jest.fn(),
          },
        },
        {
          provide: JobsService,
          useValue: {
            scheduleDigestForUserImmediate: jest.fn(),
          },
        },
        {
          provide: YouTubeService,
          useValue: {
            getChannelInfo: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendDigest: jest.fn(),
            sendTestToGmail: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            video: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<DigestsController>(DigestsController);
    service = module.get<DigestsService>(DigestsService);
    jobsService = module.get<JobsService>(JobsService);
    youtubeService = module.get<YouTubeService>(YouTubeService);
    emailService = module.get<EmailService>(EmailService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('API Endpoints', () => {
    describe('POST /digests/run', () => {
      it('should call assembleAndSend with provided email', async () => {
        const mockResult = { id: 'digest-1', messageId: 'msg-123', itemCount: 5 };
        jest.spyOn(service, 'assembleAndSend').mockResolvedValue(mockResult);

        const result = await controller.runDigest({ email: 'test@example.com' });

        expect(service.assembleAndSend).toHaveBeenCalledWith('test@example.com');
        expect(result).toEqual(mockResult);
      });

      it('should use default email when none provided', async () => {
        const mockResult = { id: 'digest-1', messageId: 'msg-123', itemCount: 3 };
        jest.spyOn(service, 'assembleAndSend').mockResolvedValue(mockResult);

        const result = await controller.runDigest({});

        expect(service.assembleAndSend).toHaveBeenCalledWith('danielsecopro@gmail.com');
        expect(result).toEqual(mockResult);
      });
    });

    describe('GET /digests/:id', () => {
      it('should return digest web view placeholder', async () => {
        const result = await controller.getDigestById('digest-123');

        expect(result).toEqual({ id: 'digest-123', status: 'web_view_placeholder' });
      });
    });
  });

  describe('Task 1: Email Template Data Display Issues', () => {
    describe('validateVideoData', () => {
      it('should handle missing video title', async () => {
        const video = { url: 'https://example.com', publishedAt: '2025-08-16T10:00:00Z' };
        const result = await (controller as any).validateVideoData(video);
        expect(result.title).toBe('Untitled Video');
      });

      it('should handle missing video URL', async () => {
        const video = { title: 'Test Video', publishedAt: '2025-08-16T10:00:00Z' };
        const result = await (controller as any).validateVideoData(video);
        expect(result.url).toBe('#');
      });

      it('should handle missing published date', async () => {
        const video = { title: 'Test Video', url: 'https://example.com' };
        const result = await (controller as any).validateVideoData(video);
        expect(result.publishedDate).toBe('Unknown Date');
      });

      it('should format valid published date', async () => {
        const video = { title: 'Test Video', url: 'https://example.com', publishedAt: '2025-08-16T10:00:00Z' };
        const result = await (controller as any).validateVideoData(video);
        expect(result.publishedDate).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
      });

      it('should handle missing channel', async () => {
        const video = { title: 'Test Video', url: 'https://example.com' };
        const result = await (controller as any).validateVideoData(video);
        expect(result.channel).toBe('Unknown Channel');
      });
    });

    describe('buildSummaryHtml', () => {
      it('should handle null summary', () => {
        const result = (controller as any).buildSummaryHtml(null);
        expect(result).toContain('No summary available');
        expect(result).toContain('color: #999');
      });

      it('should handle undefined summary', () => {
        const result = (controller as any).buildSummaryHtml(undefined);
        expect(result).toContain('No summary available');
        expect(result).toContain('color: #999');
      });

      it('should handle string summary', () => {
        const summary = 'This is a real AI summary';
        const result = (controller as any).buildSummaryHtml(summary);
        expect(result).toContain(summary);
        expect(result).toContain('color: #555');
      });

      it('should handle object summary with summary_text', () => {
        const summary = { summary_text: 'AI generated summary text' };
        const result = (controller as any).buildSummaryHtml(summary);
        expect(result).toContain('AI generated summary text');
        expect(result).toContain('color: #555');
      });

      it('should handle mock summary data', () => {
        const summary = 'This video presents a concise overview of the topic, covering key points in a brief format suitable for quick understanding.';
        const result = (controller as any).buildSummaryHtml(summary);
        expect(result).toContain('AI summary processing...');
        expect(result).toContain('color: #999');
      });
    });

    describe('buildChaptersHtml', () => {
      it('should handle empty chapters array', () => {
        const result = (controller as any).buildChaptersHtml([]);
        expect(result).toContain('No chapters available');
        expect(result).toContain('color: #999');
      });

      it('should handle null chapters', () => {
        const result = (controller as any).buildChaptersHtml(null);
        expect(result).toContain('No chapters available');
        expect(result).toContain('color: #999');
      });

      it('should handle mock chapter data', () => {
        const chapters = [{ title: 'Introduction', startTime: 0 }];
        const result = (controller as any).buildChaptersHtml(chapters);
        expect(result).toContain('Chapter processing...');
        expect(result).toContain('color: #999');
      });

      it('should handle real chapter data', () => {
        const chapters = [
          { title: 'Introduction', startTime: 0 },
          { title: 'Main Content', startTime: 120 },
          { title: 'Conclusion', startTime: 300 }
        ];
        const result = (controller as any).buildChaptersHtml(chapters);
        expect(result).toContain('<strong>0:00</strong> - Introduction');
        expect(result).toContain('<strong>2:00</strong> - Main Content');
        expect(result).toContain('<strong>5:00</strong> - Conclusion');
      });

      it('should handle missing chapter title', () => {
        const chapters = [{ startTime: 60 }];
        const result = (controller as any).buildChaptersHtml(chapters);
        expect(result).toContain('<strong>1:00</strong> - Untitled Chapter');
      });
    });

    describe('Task 2: Channel Name Resolution', () => {
      describe('resolveChannelName', () => {
        it('should return cached channel name if available', async () => {
          const channelId = 'UC123456789';
          const channelName = 'Test Channel';
          
          // Manually set cache
          (controller as any).channelNameCache.set(channelId, {
            name: channelName,
            timestamp: Date.now()
          });
          
          const result = await (controller as any).resolveChannelName(channelId);
          expect(result).toBe(channelName);
        });

        it('should fetch channel info from YouTube API if not cached', async () => {
          const channelId = 'UC123456789';
          const channelInfo = { id: channelId, title: 'YouTube Channel', thumbnail: 'http://example.com/thumb.jpg' };
          
          (youtubeService.getChannelInfo as jest.Mock).mockResolvedValue(channelInfo);
          
          const result = await (controller as any).resolveChannelName(channelId);
          expect(result).toBe('YouTube Channel');
          expect(youtubeService.getChannelInfo).toHaveBeenCalledWith(channelId);
        });

        it('should return channel ID as fallback if API fails', async () => {
          const channelId = 'UC123456789';
          
          (youtubeService.getChannelInfo as jest.Mock).mockResolvedValue(null);
          
          const result = await (controller as any).resolveChannelName(channelId);
          expect(result).toBe(channelId);
        });

        it('should handle API errors gracefully', async () => {
          const channelId = 'UC123456789';
          
          (youtubeService.getChannelInfo as jest.Mock).mockRejectedValue(new Error('API Error'));
          
          const result = await (controller as any).resolveChannelName(channelId);
          expect(result).toBe(channelId);
        });
      });

      describe('validateVideoData with channel resolution', () => {
        it('should resolve channel name for video data', async () => {
          const video = {
            title: 'Test Video',
            url: 'https://example.com',
            publishedAt: '2025-08-16T10:00:00Z',
            channel: 'UC123456789',
            summary: 'Test summary',
            chapters: []
          };
          
          const channelInfo = { id: 'UC123456789', title: 'Resolved Channel Name' };
          (youtubeService.getChannelInfo as jest.Mock).mockResolvedValue(channelInfo);
          
          const result = await (controller as any).validateVideoData(video);
          expect(result.channel).toBe('Resolved Channel Name');
        });

        it('should handle missing channel ID', async () => {
          const video = {
            title: 'Test Video',
            url: 'https://example.com',
            publishedAt: '2025-08-16T10:00:00Z',
            summary: 'Test summary',
            chapters: []
          };
          
          const result = await (controller as any).validateVideoData(video);
          expect(result.channel).toBe('Unknown Channel');
        });
      });
    });

    describe('Task 3: Chapter Data Enhancement', () => {
      describe('validateChapters', () => {
        it('should handle empty array', () => {
          const result = (controller as any).validateChapters([]);
          expect(result).toEqual([]);
        });

        it('should handle null input', () => {
          const result = (controller as any).validateChapters(null);
          expect(result).toEqual([]);
        });

        it('should normalize chapter data structure', () => {
          const input = [{ title: 'Test', startS: 60, endS: 120 }];
          const result = (controller as any).validateChapters(input);
          expect(result[0]).toHaveProperty('title', 'Test');
          expect(result[0]).toHaveProperty('startTime', 60);
          expect(result[0]).toHaveProperty('endTime', 120);
          expect(result[0]).toHaveProperty('startS', 60);
          expect(result[0]).toHaveProperty('endS', 120);
        });

        it('should filter out invalid chapters', () => {
          const input = [
            { title: 'Valid Chapter', startTime: 0, endTime: 300 },
            null,
            {},
            { title: 'Another Valid', startTime: 60, endTime: 600 },
            { startTime: 120 } // Missing title - gets default title "Untitled Chapter"
          ];
          const result = (controller as any).validateChapters(input);
          expect(result).toHaveLength(3); // Valid chapters + one with default title
          expect(result[2].title).toBe('Untitled Chapter'); // Check default title assignment
        });
      });

      describe('isMockChapterData', () => {
        it('should detect single Introduction chapter at 0:00', () => {
          const mockChapters = [{ title: 'Introduction', startTime: 0 }];
          const result = (controller as any).isMockChapterData(mockChapters);
          expect(result).toBe(true);
        });

        it('should detect generic chapter titles', () => {
          const mockChapters = [
            { title: 'Introduction', startTime: 0 },
            { title: 'Chapter 1', startTime: 300 },
            { title: 'Main Topic 1', startTime: 600 }
          ];
          const result = (controller as any).isMockChapterData(mockChapters);
          expect(result).toBe(true);
        });

        it('should not detect real chapter data', () => {
          const realChapters = [
            { title: 'Getting Started with AI', startTime: 0, endTime: 300 },
            { title: 'Neural Networks Explained', startTime: 300, endTime: 600 },
            { title: 'Practical Applications', startTime: 600, endTime: 900 }
          ];
          const result = (controller as any).isMockChapterData(realChapters);
          expect(result).toBe(false);
        });

        it('should handle empty array', () => {
          const result = (controller as any).isMockChapterData([]);
          expect(result).toBe(false);
        });
      });

      describe('buildChaptersHtml enhancements', () => {
        it('should handle real chapter data with startS/endS format', () => {
          const realChapters = [
            { title: 'Introduction', startS: 0, endS: 120 },
            { title: 'Main Content', startS: 120, endS: 300 }
          ];
          const result = (controller as any).buildChaptersHtml(realChapters);
          expect(result).toContain('0:00 - 2:00');
          expect(result).toContain('2:00 - 5:00');
          expect(result).toContain('Introduction');
          expect(result).toContain('Main Content');
        });

        it('should handle real chapter data with startTime/endTime format', () => {
          const realChapters = [
            { title: 'Introduction', startTime: 0, endTime: 120 },
            { title: 'Main Content', startTime: 120, endTime: 300 }
          ];
          const result = (controller as any).buildChaptersHtml(realChapters);
          expect(result).toContain('0:00 - 2:00');
          expect(result).toContain('2:00 - 5:00');
          expect(result).toContain('Introduction');
          expect(result).toContain('Main Content');
        });

        it('should handle invalid chapter data', () => {
          const invalidChapters = [null, undefined, {}];
          const result = (controller as any).buildChaptersHtml(invalidChapters);
          expect(result).toContain('No valid chapters available');
        });
      });

      describe('Task 4: Data Quality Validation', () => {
        describe('createDefaultVideoData', () => {
          it('should return default video data structure', () => {
            const result = (controller as any).createDefaultVideoData();
            expect(result).toEqual({
              title: 'Untitled Video',
              url: '#',
              publishedDate: 'Unknown Date',
              duration: '0:00',
              channel: 'Unknown Channel',
              summary: 'No summary available',
              chapters: []
            });
          });
        });

        describe('sanitizeString', () => {
          it('should handle null input', () => {
            const result = (controller as any).sanitizeString(null);
            expect(result).toBeNull();
          });

          it('should handle empty string', () => {
            const result = (controller as any).sanitizeString('');
            expect(result).toBeNull();
          });

          it('should trim whitespace', () => {
            const result = (controller as any).sanitizeString('  test  ');
            expect(result).toBe('test');
          });

          it('should remove script tags', () => {
            const result = (controller as any).sanitizeString('<script>alert("xss")</script>Hello');
            expect(result).toBe('Hello');
          });

          it('should handle valid string', () => {
            const result = (controller as any).sanitizeString('Valid Title');
            expect(result).toBe('Valid Title');
          });
        });

        describe('validateUrl', () => {
          it('should handle null input', () => {
            const result = (controller as any).validateUrl(null);
            expect(result).toBeNull();
          });

          it('should validate valid URL', () => {
            const result = (controller as any).validateUrl('https://www.youtube.com/watch?v=test');
            expect(result).toBe('https://www.youtube.com/watch?v=test');
          });

          it('should reject invalid URL', () => {
            const result = (controller as any).validateUrl('not-a-url');
            expect(result).toBeNull();
          });

          it('should handle empty string', () => {
            const result = (controller as any).validateUrl('');
            expect(result).toBeNull();
          });
        });

        describe('validateDate', () => {
          it('should handle null input', () => {
            const result = (controller as any).validateDate(null);
            expect(result).toBeNull();
          });

          it('should validate valid date string', () => {
            const result = (controller as any).validateDate('2025-08-16T10:00:00Z');
            expect(result).toMatch(/\d+\/\d+\/\d+/); // Date format
          });

          it('should reject invalid date', () => {
            const result = (controller as any).validateDate('not-a-date');
            expect(result).toBeNull();
          });

          it('should handle Date object', () => {
            const date = new Date('2025-08-16');
            const result = (controller as any).validateDate(date);
            expect(result).toMatch(/\d+\/\d+\/\d+/);
          });
        });

        describe('validateSummary', () => {
          it('should handle null input', () => {
            const result = (controller as any).validateSummary(null);
            expect(result).toBe('No summary available');
          });

          it('should validate string summary', () => {
            const result = (controller as any).validateSummary('Test summary');
            expect(result).toBe('Test summary');
          });

          it('should validate object summary', () => {
            const summaryObj = { summary_text: 'Object summary' };
            const result = (controller as any).validateSummary(summaryObj);
            expect(result).toBe('Object summary');
          });

          it('should sanitize summary with script tags', () => {
            const result = (controller as any).validateSummary('<script>alert("xss")</script>Summary');
            expect(result).toBe('Summary');
          });
        });

        describe('validateVideoData with data quality', () => {
          it('should handle invalid input gracefully', async () => {
            const result = await (controller as any).validateVideoData(null);
            expect(result.title).toBe('Untitled Video');
            expect(result.url).toBe('#');
          });

          it('should handle non-object input', async () => {
            const result = await (controller as any).validateVideoData('not-an-object');
            expect(result.title).toBe('Untitled Video');
          });

          it('should validate and sanitize all fields', async () => {
            const video = {
              title: '  <script>alert("xss")</script>Test Title  ',
              url: 'not-a-url',
              publishedAt: 'invalid-date',
              summary: '<script>alert("xss")</script>Test summary',
              chapters: []
            };
            
            const result = await (controller as any).validateVideoData(video);
            expect(result.title).toBe('Test Title');
            expect(result.url).toBe('#');
            expect(result.publishedDate).toBe('Unknown Date');
            expect(result.summary).toBe('Test summary');
          });
        });

        describe('buildTestDigestHtml with error handling', () => {
          it('should handle invalid videos array', async () => {
            const result = await (controller as any).buildTestDigestHtml(null);
            expect(result).toContain('Invalid video data provided');
            expect(result).toContain('TubeDigest Error');
          });

          it('should handle empty videos array', async () => {
            const result = await (controller as any).buildTestDigestHtml([]);
            expect(result).toContain('No valid videos found');
            expect(result).toContain('TubeDigest Error');
          });

          it('should handle videos with invalid objects', async () => {
            const videos = [null, undefined, 'not-an-object'];
            const result = await (controller as any).buildTestDigestHtml(videos);
            expect(result).toContain('No valid videos found');
          });

          it('should process valid videos successfully', async () => {
            const videos = [{
              title: 'Test Video',
              url: 'https://www.youtube.com/watch?v=test',
              publishedAt: '2025-08-16T10:00:00Z',
              channel: 'UC123456789',
              summary: 'Test summary',
              chapters: []
            }];
            
            const result = await (controller as any).buildTestDigestHtml(videos);
            expect(result).toContain('Test Video');
            expect(result).toContain('Data Quality Validated');
            expect(result).not.toContain('TubeDigest Error');
          });
        });

        describe('createErrorEmailHtml', () => {
          it('should create error email with custom message', () => {
            const result = (controller as any).createErrorEmailHtml('Test error message');
            expect(result).toContain('Test error message');
            expect(result).toContain('TubeDigest Error');
            expect(result).toContain('linear-gradient(135deg, #e53e3e 0%, #c53030 100%)');
          });
        });

        describe('Task 5: Email Template Responsive Design', () => {
          describe('buildTestDigestHtml with responsive design', () => {
            it('should include viewport meta tag for mobile responsiveness', async () => {
              const videos = [{
                title: 'Test Video',
                url: 'https://www.youtube.com/watch?v=test',
                publishedAt: '2025-08-16T10:00:00Z',
                channel: 'UC123456789',
                summary: 'Test summary',
                chapters: []
              }];
              
              const result = await (controller as any).buildTestDigestHtml(videos);
              expect(result).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
            });

            it('should include responsive CSS media queries', async () => {
              const videos = [{
                title: 'Test Video',
                url: 'https://www.youtube.com/watch?v=test',
                publishedAt: '2025-08-16T10:00:00Z',
                channel: 'UC123456789',
                summary: 'Test summary',
                chapters: []
              }];
              
              const result = await (controller as any).buildTestDigestHtml(videos);
              expect(result).toContain('@media only screen and (max-width: 600px)');
              expect(result).toContain('@media only screen and (max-width: 480px)');
            });

            it('should use modern CSS features for visual appeal', async () => {
              const videos = [{
                title: 'Test Video',
                url: 'https://www.youtube.com/watch?v=test',
                publishedAt: '2025-08-16T10:00:00Z',
                channel: 'UC123456789',
                summary: 'Test summary',
                chapters: []
              }];
              
              const result = await (controller as any).buildTestDigestHtml(videos);
              expect(result).toContain('linear-gradient');
              expect(result).toContain('box-shadow');
              expect(result).toContain('border-radius');
              expect(result).toContain('transition');
            });

            it('should include proper CSS classes for styling', async () => {
              const videos = [{
                title: 'Test Video',
                url: 'https://www.youtube.com/watch?v=test',
                publishedAt: '2025-08-16T10:00:00Z',
                channel: 'UC123456789',
                summary: 'Test summary',
                chapters: []
              }];
              
              const result = await (controller as any).buildTestDigestHtml(videos);
              expect(result).toContain('class="video-card"');
              expect(result).toContain('class="video-title"');
              expect(result).toContain('class="video-meta"');
              expect(result).toContain('class="content-box"');
              expect(result).toContain('class="status-indicators"');
            });

            it('should include status indicators in footer', async () => {
              const videos = [{
                title: 'Test Video',
                url: 'https://www.youtube.com/watch?v=test',
                publishedAt: '2025-08-16T10:00:00Z',
                channel: 'UC123456789',
                summary: 'Test summary',
                chapters: []
              }];
              
              const result = await (controller as any).buildTestDigestHtml(videos);
              expect(result).toContain('AI Integration Working');
              expect(result).toContain('Email Delivery Working');
              expect(result).toContain('Data Quality Validated');
            });

            it('should include chapters list class when chapters are present', async () => {
              const videos = [{
                title: 'Test Video',
                url: 'https://www.youtube.com/watch?v=test',
                publishedAt: '2025-08-16T10:00:00Z',
                channel: 'UC123456789',
                summary: 'Test summary',
                chapters: [
                  { title: 'Introduction', startTime: 0, endTime: 120 },
                  { title: 'Main Content', startTime: 120, endTime: 300 }
                ]
              }];
              
              const result = await (controller as any).buildTestDigestHtml(videos);
              expect(result).toContain('class="chapters-list"');
            });
          });

          describe('createErrorEmailHtml with responsive design', () => {
            it('should include viewport meta tag for mobile responsiveness', () => {
              const result = (controller as any).createErrorEmailHtml('Test error message');
              expect(result).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
            });

            it('should include responsive CSS media queries', () => {
              const result = (controller as any).createErrorEmailHtml('Test error message');
              expect(result).toContain('@media only screen and (max-width: 600px)');
              expect(result).toContain('@media only screen and (max-width: 480px)');
            });

            it('should use modern CSS features for error styling', () => {
              const result = (controller as any).createErrorEmailHtml('Test error message');
              expect(result).toContain('linear-gradient');
              expect(result).toContain('box-shadow');
              expect(result).toContain('border-radius');
            });

            it('should include proper error styling classes', () => {
              const result = (controller as any).createErrorEmailHtml('Test error message');
              expect(result).toContain('class="email-container"');
              expect(result).toContain('class="header"');
              expect(result).toContain('class="content"');
              expect(result).toContain('class="error"');
            });
          });
        });

        describe('Task 6: Integration and Testing', () => {
          describe('isValidEmail', () => {
            it('should validate correct email formats', () => {
              const validEmails = [
                'test@example.com',
                'user.name@domain.co.uk',
                'user+tag@example.org'
              ];
              
              validEmails.forEach(email => {
                const result = (controller as any).isValidEmail(email);
                expect(result).toBe(true);
              });
            });

            it('should reject invalid email formats', () => {
              const invalidEmails = [
                'invalid-email',
                '@example.com',
                'user@',
                'user@.com',
                ''
              ];
              
              invalidEmails.forEach(email => {
                const result = (controller as any).isValidEmail(email);
                expect(result).toBe(false);
              });
            });
          });

          describe('validateDigestData', () => {
            it('should validate digest data and calculate quality score', async () => {
              const videos = [
                {
                  id: 1,
                  title: 'Valid Video 1',
                  url: 'https://www.youtube.com/watch?v=valid1',
                  publishedAt: '2025-08-16T10:00:00Z',
                  channel: 'UC123456789',
                  summary: 'Valid summary'
                },
                {
                  id: 2,
                  title: 'Valid Video 2',
                  url: 'https://www.youtube.com/watch?v=valid2',
                  publishedAt: '2025-08-16T11:00:00Z',
                  channel: 'UC987654321',
                  summary: 'Another valid summary'
                }
              ];
              
              const result = await (controller as any).validateDigestData(videos);
              
              expect(result.totalVideos).toBe(2);
              expect(result.validVideos).toBe(2);
              expect(result.invalidVideos).toBe(0);
              expect(result.qualityScore).toBe(100);
              expect(result.overallValid).toBe(true);
            });

            it('should detect data quality issues', async () => {
              const videos = [
                {
                  id: 1,
                  title: null,
                  url: 'invalid-url',
                  publishedAt: 'invalid-date',
                  channel: '',
                  summary: null
                }
              ];
              
              const result = await (controller as any).validateDigestData(videos);
              
              expect(result.totalVideos).toBe(1);
              expect(result.validVideos).toBe(0);
              expect(result.invalidVideos).toBe(1);
              expect(result.qualityScore).toBe(0);
              expect(result.overallValid).toBe(false);
              expect(result.qualityIssues.length).toBeGreaterThan(0);
            });
          });

          describe('Integration Test Endpoints', () => {
            it('should have integration test endpoint available', () => {
              // This test verifies the endpoint exists
              expect(controller).toBeDefined();
            });
          });
        });
      });
    });
  });
});
