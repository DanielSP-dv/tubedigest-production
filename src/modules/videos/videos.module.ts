import { Module, forwardRef } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { YouTubeModule } from '../youtube/youtube.module';
import { AIModule } from '../ai/ai.module';
import { JobsModule } from '../jobs/jobs.module';
import { SearchAPIModule } from '../search-api/search-api.module';

@Module({
  imports: [YouTubeModule, AIModule, SearchAPIModule, forwardRef(() => JobsModule)],
  controllers: [VideosController],
  providers: [VideosService, PrismaService],
  exports: [VideosService],
})
export class VideosModule {}
