import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health/health.controller';
import { MeController } from './me/me.controller';
import { HomeController } from './home/home.controller';
import { ChannelsModule } from './channels/channels.module';
import { DigestsModule } from './digests/digests.module';
import { JobsModule } from './jobs/jobs.module';
import { VideosModule } from './videos/videos.module';
import { TranscriptsModule } from './transcripts/transcripts.module';
import { SearchAPIModule } from './search-api/search-api.module';
import { OpenAIModule } from './openai/openai.module';
import { TranscriptProcessingModule } from './transcript-processing/transcript-processing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    ChannelsModule,
    DigestsModule,
    JobsModule,
    VideosModule,
    TranscriptsModule,
    SearchAPIModule,
    OpenAIModule,
    TranscriptProcessingModule,
  ],
  controllers: [HomeController, HealthController, MeController],
})
export class AppModule {
  constructor() {
    console.log('AppModule loaded with DigestsModule, JobsModule, VideosModule, and SearchAPIModule');
  }
}


