import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('digest-queue') private readonly digestQueue: Queue,
    @InjectQueue('ingest-queue') private readonly ingestQueue: Queue,
    @InjectQueue('transcript-queue') private readonly transcriptQueue: Queue,
  ) {}

  async scheduleDigestForUser(userEmail: string) {
    await this.digestQueue.add(
      'process-digest',
      { userEmail },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    );
  }

  async scheduleDigestForUserImmediate(userEmail: string) {
    await this.digestQueue.add(
      'process-digest',
      { userEmail },
      {
        priority: 1,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
  }

  async scheduleRecurringDigest(userEmail: string, cadence: string, nextRun: Date, customDays?: number) {
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

  async cancelRecurringDigest(jobId: string) {
    const job = await this.digestQueue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  async getRecurringDigestJobs(userEmail: string) {
    const jobs = await this.digestQueue.getJobs(['waiting', 'delayed', 'active']);
    return jobs.filter(job => 
      job.data.userEmail === userEmail && 
      job.data.isRecurring === true
    );
  }

  async scheduleVideoIngestionForUser(userEmail: string, timeWindowHours: number = 24) {
    await this.ingestQueue.add(
      'discover-videos',
      { userEmail, timeWindowHours },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    );
  }

  async scheduleVideoIngestionForChannel(userEmail: string, channelId: string, timeWindowHours: number = 24) {
    await this.ingestQueue.add(
      'discover-channel-videos',
      { userEmail, channelId, timeWindowHours },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    );
  }

  async scheduleTranscriptProcessing(videoId: string, userEmail?: string, useASR: boolean = false) {
    await this.transcriptQueue.add(
      'process-transcript',
      { videoId, userEmail, useASR },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    );
  }

  async scheduleBatchTranscriptProcessing(videoIds: string[], userEmail?: string) {
    await this.transcriptQueue.add(
      'process-transcripts-batch',
      { videoIds, userEmail },
      {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 5,
        removeOnFail: 3,
      },
    );
  }
}
