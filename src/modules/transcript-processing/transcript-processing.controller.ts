import { Controller, Get, Post, Param, Logger } from '@nestjs/common';
import { TranscriptProcessingService } from './transcript-processing.service';

@Controller('transcript-processing')
export class TranscriptProcessingController {
  private readonly logger = new Logger(TranscriptProcessingController.name);

  constructor(private readonly transcriptProcessingService: TranscriptProcessingService) {}

  @Get('status')
  getStatus() {
    return this.transcriptProcessingService.getStatus();
  }

  @Post('process/:videoId')
  async processVideoTranscript(@Param('videoId') videoId: string) {
    this.logger.log(`Processing transcript for video: ${videoId}`);
    const result = await this.transcriptProcessingService.processVideoTranscript(videoId);
    
    if (!result) {
      return {
        success: false,
        message: `No transcript data found for video: ${videoId}`,
        videoId: videoId,
      };
    }

    return {
      success: true,
      message: 'Transcript processed successfully',
      data: result,
    };
  }
}



