import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsService } from './jobs.service';
import { JobsProcessor, IngestProcessor, TranscriptProcessor } from './jobs.processor';
import { JobsSchedulerService } from './jobs-scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailModule } from '../email/email.module';
import { DigestsModule } from '../digests/digests.module';
import { VideosModule } from '../videos/videos.module';
import { YouTubeModule } from '../youtube/youtube.module';
import { AIModule } from '../ai/ai.module';
import { TranscriptsModule } from '../transcripts/transcripts.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'digest-queue',
    }),
    BullModule.registerQueue({
      name: 'ingest-queue',
    }),
    BullModule.registerQueue({
      name: 'transcript-queue',
    }),
    EmailModule,
    forwardRef(() => DigestsModule),
    forwardRef(() => VideosModule),
    forwardRef(() => TranscriptsModule),
    YouTubeModule,
    AIModule,
  ],
  providers: [JobsService, JobsProcessor, IngestProcessor, TranscriptProcessor, JobsSchedulerService, PrismaService],
  exports: [JobsService],
})
export class JobsModule {}
