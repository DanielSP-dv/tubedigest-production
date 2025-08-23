import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { DigestsService } from '../digests/digests.service';
import { VideosService } from '../videos/videos.service';
import { TranscriptsService } from '../transcripts/transcripts.service';

@Processor('digest-queue')
export class JobsProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly digestsService: DigestsService,
    @InjectQueue('digest-queue') private readonly digestQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'process-digest') {
      const { userEmail } = job.data;
      
      try {
        console.log(`Processing digest job for ${userEmail}`);
        
        // Use the DigestsService to assemble and send the digest
        const result = await this.digestsService.assembleAndSend(userEmail);
        
        console.log(`Digest processed successfully for ${userEmail}:`, result);
        
        return result;
      } catch (error) {
        console.error(`Failed to process digest for ${userEmail}:`, error);
        throw error;
      }
    }

    if (job.name === 'process-recurring-digest') {
      const { userEmail, cadence, customDays, isRecurring } = job.data;
      
      try {
        console.log(`Processing recurring digest job for ${userEmail} with cadence: ${cadence}`);
        
        // Use the DigestsService to assemble and send the digest
        const result = await this.digestsService.assembleAndSend(userEmail);
        
        // Update the schedule's lastRun and calculate nextRun
        await this.updateDigestSchedule(userEmail, cadence, customDays);
        
        // Schedule the next recurring digest
        await this.scheduleNextRecurringDigest(userEmail, cadence, customDays);
        
        console.log(`Recurring digest processed successfully for ${userEmail}:`, result);
        
        return result;
      } catch (error) {
        console.error(`Failed to process recurring digest for ${userEmail}:`, error);
        throw error;
      }
    }
  }

  private async updateDigestSchedule(userEmail: string, cadence: string, customDays?: number) {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return;

    const schedule = await this.prisma.digestSchedule.findFirst({
      where: { userId: user.id, enabled: true }
    });

    if (schedule) {
      await this.prisma.digestSchedule.update({
        where: { id: schedule.id },
        data: { lastRun: new Date() }
      });
    }
  }

  private async scheduleNextRecurringDigest(userEmail: string, cadence: string, customDays?: number) {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return;

    const schedule = await this.prisma.digestSchedule.findFirst({
      where: { userId: user.id, enabled: true }
    });

    if (!schedule) return;

    // Calculate next run time based on cadence
    let nextRun = new Date();
    switch (cadence) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(9, 0, 0, 0); // 9:00 AM
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        nextRun.setHours(9, 0, 0, 0); // 9:00 AM
        break;
      case 'custom':
        if (customDays) {
          nextRun.setDate(nextRun.getDate() + customDays);
          nextRun.setHours(9, 0, 0, 0); // 9:00 AM
        }
        break;
      default:
        return; // Don't reschedule for immediate or invalid cadence
    }

    // Update the schedule with next run time
    await this.prisma.digestSchedule.update({
      where: { id: schedule.id },
      data: { nextRun }
    });

    // Schedule the next job
    const jobOptions: any = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    };

    // Set delay based on nextRun
    const delay = nextRun.getTime() - Date.now();
    if (delay > 0) {
      jobOptions.delay = delay;
    }

    // Add recurring job data
    const jobData = {
      userEmail,
      cadence,
      customDays,
      isRecurring: true,
    };

    await this.digestQueue.add(
      'process-recurring-digest',
      jobData,
      jobOptions,
    );
  }

  async onCompleted(job: Job<any, any, string>): Promise<void> {
    console.log(`Job ${job.id} completed successfully`);
  }

  async onFailed(job: Job<any, any, string>, err: Error): Promise<void> {
    console.error(`Job ${job.id} failed:`, err.message);
    
    // If job has failed max attempts, move to dead letter queue
    if (job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
      console.error(`Job ${job.id} moved to dead letter queue after ${job.attemptsMade} attempts`);
    }
  }
}

@Processor('ingest-queue')
export class IngestProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly videosService: VideosService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'discover-videos') {
      const { userEmail, timeWindowHours } = job.data;
      
      try {
        console.log(`Processing video discovery job for ${userEmail} with ${timeWindowHours}h window`);
        
        // Use the VideosService to discover and ingest videos
        const result = await this.videosService.fetchNewVideosForUser(userEmail, timeWindowHours);
        
        console.log(`Video discovery completed for ${userEmail}: ${result.length} videos found`);
        
        return { videosFound: result.length, videos: result };
      } catch (error) {
        console.error(`Failed to process video discovery for ${userEmail}:`, error);
        throw error;
      }
    }
    
    if (job.name === 'discover-channel-videos') {
      const { userEmail, channelId, timeWindowHours } = job.data;
      
      try {
        console.log(`Processing channel video discovery job for ${userEmail}, channel ${channelId} with ${timeWindowHours}h window`);
        
        // Use the VideosService to discover and ingest videos for specific channel
        const result = await this.videosService.fetchNewVideosForChannel(userEmail, channelId, timeWindowHours);
        
        console.log(`Channel video discovery completed for ${userEmail}, channel ${channelId}: ${result.length} videos found`);
        
        return { videosFound: result.length, videos: result };
      } catch (error) {
        console.error(`Failed to process channel video discovery for ${userEmail}, channel ${channelId}:`, error);
        throw error;
      }
    }
  }

  async onCompleted(job: Job<any, any, string>): Promise<void> {
    console.log(`Ingest job ${job.id} completed successfully`);
  }

  async onFailed(job: Job<any, any, string>, err: Error): Promise<void> {
    console.error(`Ingest job ${job.id} failed:`, err.message);
    
    // If job has failed max attempts, move to dead letter queue
    if (job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
      console.error(`Ingest job ${job.id} moved to dead letter queue after ${job.attemptsMade} attempts`);
    }
  }
}

@Processor('transcript-queue')
export class TranscriptProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transcriptsService: TranscriptsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'process-transcript') {
      const { videoId, userEmail, useASR } = job.data;
      
      try {
        console.log(`Processing transcript job for video: ${videoId}`);
        
        // Use the TranscriptsService to process the transcript
        const result = await this.transcriptsService.processTranscript({
          videoId,
          userEmail,
          useASR
        });
        
        console.log(`Transcript processing completed for ${videoId}:`, result);
        
        return result;
      } catch (error) {
        console.error(`Failed to process transcript for ${videoId}:`, error);
        throw error;
      }
    }
    
    if (job.name === 'process-transcripts-batch') {
      const { videoIds, userEmail } = job.data;
      
      try {
        console.log(`Processing batch transcript job for ${videoIds.length} videos`);
        
        // Use the TranscriptsService to process transcripts in batch
        const result = await this.transcriptsService.batchProcessTranscripts(videoIds, userEmail);
        
        console.log(`Batch transcript processing completed: ${result.processed} processed, ${result.failed} failed, ${result.skipped} skipped`);
        
        return result;
      } catch (error) {
        console.error(`Failed to process batch transcripts:`, error);
        throw error;
      }
    }
  }

  async onCompleted(job: Job<any, any, string>): Promise<void> {
    console.log(`Transcript job ${job.id} completed successfully`);
  }

  async onFailed(job: Job<any, any, string>, err: Error): Promise<void> {
    console.error(`Transcript job ${job.id} failed:`, err.message);
    
    // If job has failed max attempts, move to dead letter queue
    if (job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
      console.error(`Transcript job ${job.id} moved to dead letter queue after ${job.attemptsMade} attempts`);
    }
  }
}
