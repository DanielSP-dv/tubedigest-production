import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { OpenAIService, SummarizationRequest, SummarizationResponse } from './openai.service';

@Controller('openai')
export class OpenAIController {
  private readonly logger = new Logger(OpenAIController.name);

  constructor(private readonly openaiService: OpenAIService) {}

  @Get('status')
  getStatus() {
    const isAvailable = this.openaiService.isAvailable();
    return {
      available: isAvailable,
      message: isAvailable ? 'OpenAI is configured and available' : 'OpenAI is not configured - missing API key',
    };
  }

  @Post('summarize')
  async summarizeTranscript(@Body() request: SummarizationRequest): Promise<SummarizationResponse> {
    this.logger.log(`Received summarization request for video: ${request.videoId}`);
    return await this.openaiService.summarizeTranscript(request);
  }

  @Post('chapters')
  async generateChapters(@Body() request: SummarizationRequest) {
    this.logger.log(`Received chapter generation request for video: ${request.videoId}`);
    const chapters = await this.openaiService.generateChapters(request);
    return {
      chapters,
      videoId: request.videoId,
      count: chapters.length,
    };
  }
}



