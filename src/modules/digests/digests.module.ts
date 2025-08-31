import { Module } from '@nestjs/common';
import { DigestsService } from './digests.service';
import { DigestsController } from './digests.controller';
import { EmailModule } from '../email/email.module';
import { PrismaService } from '../../prisma/prisma.service';
import { YouTubeModule } from '../youtube/youtube.module';

@Module({
  imports: [EmailModule, YouTubeModule],
  providers: [DigestsService, PrismaService],
  controllers: [DigestsController],
  exports: [DigestsService],
})
export class DigestsModule {
  constructor() {
    console.log('DigestsModule loaded');
  }
}


