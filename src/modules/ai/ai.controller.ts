import { Controller, Post, Body, Get } from '@nestjs/common';
import { AIService } from './ai.service';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('test-summary')
  async testSummary(@Body() body: { transcript: string }) {
    try {
      const summary = await this.aiService.generateSummary(body.transcript);
      return {
        success: true,
        summary,
        transcriptLength: body.transcript.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        transcriptLength: body.transcript.length
      };
    }
  }

  @Post('test-chapters')
  async testChapters(@Body() body: { transcript: string }) {
    try {
      const chapters = await this.aiService.extractChapters(body.transcript);
      return {
        success: true,
        chapters,
        transcriptLength: body.transcript.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        transcriptLength: body.transcript.length
      };
    }
  }

  @Get('test')
  async testAI() {
    const testTranscript = "This is a test transcript about artificial intelligence and machine learning. We will discuss the basics of AI, how it works, and its applications in modern technology. The video covers topics like neural networks, deep learning, and practical applications.";
    
    try {
      const summary = await this.aiService.generateSummary(testTranscript);
      const chapters = await this.aiService.extractChapters(testTranscript);
      
      return {
        success: true,
        summary,
        chapters,
        testTranscript
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testTranscript
      };
    }
  }
}
