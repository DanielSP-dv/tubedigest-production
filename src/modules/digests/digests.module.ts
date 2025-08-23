import { Module, forwardRef } from '@nestjs/common';
import { DigestsService } from './digests.service';
import { DigestsController } from './digests.controller';
import { EmailModule } from '../email/email.module';
import { VideosModule } from '../videos/videos.module';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsModule } from '../jobs/jobs.module';
import { YouTubeModule } from '../youtube/youtube.module';

@Module({
  imports: [EmailModule, VideosModule, forwardRef(() => JobsModule), YouTubeModule],
  providers: [DigestsService, PrismaService],
  controllers: [DigestsController],
  exports: [DigestsService],
})
export class DigestsModule {
  constructor() {
    console.log('DigestsModule loaded');
  }
}


