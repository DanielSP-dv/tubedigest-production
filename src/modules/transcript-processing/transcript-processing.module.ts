import { Module } from '@nestjs/common';
import { TranscriptProcessingService } from './transcript-processing.service';
import { TranscriptProcessingController } from './transcript-processing.controller';
import { SearchAPIModule } from '../search-api/search-api.module';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [SearchAPIModule, OpenAIModule],
  providers: [TranscriptProcessingService],
  controllers: [TranscriptProcessingController],
  exports: [TranscriptProcessingService],
})
export class TranscriptProcessingModule {}



