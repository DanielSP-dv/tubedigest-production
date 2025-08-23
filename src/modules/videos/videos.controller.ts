import { Controller, Get, Param, Query, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { VideosService } from './videos.service';
import { JobsService } from '../jobs/jobs.service';

@Controller('videos')
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly jobsService: JobsService,
  ) {}

  @Get('digest')
  async getDigestVideos(@Req() req: Request, @Query('since') since?: string) {
    // Get videos for the last 7 days by default
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get videos filtered by user's selected channels
    const userEmail = req.cookies?.userEmail || 'danielsecopro@gmail.com'; // fallback for MVP
    console.log('🔍 [VideosController] getDigestVideos for user:', userEmail);
    const videos = await this.videosService.getAllVideosWithSummaries(userEmail);

    return videos.map((video: any) => ({
      id: video.id,
      title: video.title,
      channel: video.channelId, // We'll need to join with channel data
      summary: video.summary?.summaryText || '',
      chapters: video.chapters.map((chapter: any) => ({
        title: chapter.title,
        startTime: chapter.startS
      })),
      thumbnail: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect width="400" height="225" fill="%231890ff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14">${encodeURIComponent(video.title.substring(0, 50))}</text></svg>`,
      url: video.url,
      duration: video.durationS,
      publishedAt: video.publishedAt.toISOString(),
    }));
  }

  @Get('processing-status')
  async getProcessingStatus() {
    return this.videosService.getProcessingStatus();
  }

  @Post('ingest')
  async triggerVideoIngestion(@Req() req: Request, @Body() body: { timeWindowHours?: number }) {
    const userEmail = req.cookies?.userEmail || 'danielsecopro@gmail.com'; // fallback for MVP
    console.log('🔍 [VideosController] triggerVideoIngestion for user:', userEmail);
    const timeWindowHours = body.timeWindowHours || 24;
    
    // Schedule video ingestion job
    await this.jobsService.scheduleVideoIngestionForUser(userEmail, timeWindowHours);
    
    return { 
      message: 'Video ingestion job scheduled',
      userEmail,
      timeWindowHours,
      status: 'scheduled'
    };
  }

  @Post('ingest/channel/:channelId')
  async triggerChannelVideoIngestion(
    @Req() req: Request,
    @Param('channelId') channelId: string,
    @Body() body: { timeWindowHours?: number }
  ) {
    const userEmail = req.cookies?.userEmail || 'danielsecopro@gmail.com'; // fallback for MVP
    console.log('🔍 [VideosController] triggerChannelVideoIngestion for user:', userEmail);
    const timeWindowHours = body.timeWindowHours || 24;
    
    // Schedule channel-specific video ingestion job
    await this.jobsService.scheduleVideoIngestionForChannel(userEmail, channelId, timeWindowHours);
    
    return { 
      message: 'Channel video ingestion job scheduled',
      userEmail,
      channelId,
      timeWindowHours,
      status: 'scheduled'
    };
  }

  @Get('config')
  async getConfiguration() {
    return {
      defaultTimeWindowHours: 24,
      maxVideosPerChannel: 50,
      supportedCadences: ['daily', 'weekly'],
      defaultCadence: 'daily',
      processingWindowSettings: {
        daily: { hours: 24 },
        weekly: { hours: 168 }
      }
    };
  }
}
