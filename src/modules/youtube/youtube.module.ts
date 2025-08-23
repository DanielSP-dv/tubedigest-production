import { Module } from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  providers: [YouTubeService, PrismaService],
  exports: [YouTubeService],
})
export class YouTubeModule {}
