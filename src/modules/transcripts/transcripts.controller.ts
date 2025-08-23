import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TranscriptsService } from './transcripts.service';
import { ProcessTranscriptDto } from './dto/process-transcript.dto';
import { CreateTranscriptDto } from './dto/create-transcript.dto';

@Controller('transcripts')
export class TranscriptsController {
  constructor(private readonly transcriptsService: TranscriptsService) {}

  @Post('process')
  async processTranscript(@Body() dto: ProcessTranscriptDto) {
    return await this.transcriptsService.processTranscript(dto);
  }

  @Post('process/batch')
  async batchProcessTranscripts(
    @Body() body: { videoIds: string[]; userEmail?: string }
  ) {
    return await this.transcriptsService.batchProcessTranscripts(
      body.videoIds,
      body.userEmail
    );
  }

  @Post()
  async createTranscript(@Body() dto: CreateTranscriptDto) {
    return await this.transcriptsService.createTranscript(dto);
  }

  @Get('video/:videoId')
  async getTranscript(@Param('videoId') videoId: string) {
    return await this.transcriptsService.getTranscript(videoId);
  }

  @Get('batch')
  async getTranscriptsByVideoIds(@Query('videoIds') videoIds: string) {
    const videoIdArray = videoIds.split(',').map(id => id.trim());
    return await this.transcriptsService.getTranscriptsByVideoIds(videoIdArray);
  }

  @Get('stats')
  async getProcessingStats() {
    return await this.transcriptsService.getProcessingStats();
  }

  @Get('config')
  async getConfiguration() {
    // Return configuration for transcript processing
    return {
      supportedFormats: ['srt', 'vtt'],
      supportedLanguages: ['en'],
      maxTextLength: 50000,
      qualityThresholds: {
        minLength: 10,
        maxSpecialCharRatio: 0.3,
        minUniqueWordRatio: 0.3
      },
      processingOptions: {
        enableASR: process.env.ASR_ENABLED === 'true',
        enableLanguageDetection: true,
        enableQualityValidation: true
      }
    };
  }
}

