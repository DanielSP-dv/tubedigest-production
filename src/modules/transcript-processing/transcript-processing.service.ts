import { Injectable, Logger } from '@nestjs/common';
import { SearchAPIService } from '../search-api/search-api.service';
import { OpenAIService } from '../openai/openai.service';

export interface ProcessedTranscript {
  videoId: string;
  title: string;
  transcript: string;
  summary: string;
  chapters: Array<{title: string, startS: number, endS: number}>;
  source: 'searchapi' | 'openai';
  model?: string;
  tokens_used?: number;
}

@Injectable()
export class TranscriptProcessingService {
  private readonly logger = new Logger(TranscriptProcessingService.name);

  constructor(
    private readonly searchAPIService: SearchAPIService,
    private readonly openaiService: OpenAIService,
  ) {}

  /**
   * Process a video transcript using SearchAPI and OpenAI
   */
  async processVideoTranscript(videoId: string): Promise<ProcessedTranscript | null> {
    try {
      this.logger.log(`Processing transcript for video: ${videoId}`);

      // Step 1: Get video data from SearchAPI
      const videoData = await this.searchAPIService.getVideoById(videoId);
      if (!videoData) {
        this.logger.warn(`No video data found for ID: ${videoId}`);
        return null;
      }

      // Step 2: Create transcript-like text from SearchAPI data
      const transcriptText = this.createTranscriptFromSearchAPI(videoData);
      
      if (!transcriptText) {
        this.logger.warn(`No transcript data available for video: ${videoId}`);
        return null;
      }

      // Step 3: Use OpenAI to generate summary and chapters
      let summary = '';
      let chapters: Array<{title: string, startS: number, endS: number}> = [];
      let model = '';
      let tokensUsed = 0;

      if (this.openaiService.isAvailable()) {
        try {
          // Generate summary
          const summaryResponse = await this.openaiService.summarizeTranscript({
            text: transcriptText,
            videoId: videoId,
            title: videoData.title,
          });

          summary = summaryResponse.summary;
          model = summaryResponse.model;
          tokensUsed = summaryResponse.tokens_used;

          // Generate chapters
          chapters = await this.openaiService.generateChapters({
            text: transcriptText,
            videoId: videoId,
            title: videoData.title,
          });

          this.logger.log(`Successfully processed video ${videoId} with OpenAI (${tokensUsed} tokens)`);

        } catch (openaiError) {
          this.logger.error(`OpenAI processing failed for video ${videoId}:`, openaiError);
          // Fallback to basic processing
          summary = this.createBasicSummary(videoData);
          chapters = this.createBasicChapters(videoData);
        }
      } else {
        // Fallback when OpenAI is not available
        this.logger.warn(`OpenAI not available, using basic processing for video: ${videoId}`);
        summary = this.createBasicSummary(videoData);
        chapters = this.createBasicChapters(videoData);
      }

      return {
        videoId: videoId,
        title: videoData.title,
        transcript: transcriptText,
        summary: summary,
        chapters: chapters,
        source: this.openaiService.isAvailable() ? 'openai' : 'searchapi',
        model: model,
        tokens_used: tokensUsed,
      };

    } catch (error) {
      this.logger.error(`Failed to process transcript for video ${videoId}:`, error);
      throw new Error(`Transcript processing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create transcript-like text from SearchAPI video data
   */
  private createTranscriptFromSearchAPI(videoData: any): string {
    let transcript = '';

    // Add video description
    if (videoData.description) {
      transcript += `Video Description:\n${videoData.description}\n\n`;
    }

    // Add key moments as timestamps
    if (videoData.key_moments && videoData.key_moments.length > 0) {
      transcript += 'Key Moments:\n';
      videoData.key_moments.forEach((moment: any) => {
        const minutes = Math.floor(moment.start_seconds / 60);
        const seconds = moment.start_seconds % 60;
        const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        transcript += `${timestamp} - ${moment.title}\n`;
      });
      transcript += '\n';
    }

    // Add additional context
    if (videoData.channelTitle) {
      transcript += `Channel: ${videoData.channelTitle}\n`;
    }
    if (videoData.length) {
      transcript += `Duration: ${videoData.length}\n`;
    }
    if (videoData.views) {
      transcript += `Views: ${videoData.views.toLocaleString()}\n`;
    }

    return transcript;
  }

  /**
   * Create a basic summary when OpenAI is not available
   */
  private createBasicSummary(videoData: any): string {
    const title = videoData.title;
    const description = videoData.description || '';
    const keyMoments = videoData.key_moments || [];
    
    let summary = `Summary of "${title}"\n\n`;
    
    // Extract key topics from description
    const descriptionWords = description.toLowerCase().split(' ').slice(0, 20).join(' ');
    summary += `This video explores ${descriptionWords}...\n\n`;
    
    // Add key moments as bullet points
    if (keyMoments.length > 0) {
      summary += 'Key Topics Covered:\n';
      keyMoments.slice(0, 5).forEach((moment: any) => {
        summary += `• ${moment.title}\n`;
      });
    }
    
    summary += `\nVideo Duration: ${videoData.length || 'Unknown'}`;
    summary += `\nChannel: ${videoData.channelTitle || 'Unknown'}`;
    summary += `\nViews: ${videoData.views ? videoData.views.toLocaleString() : 'Unknown'}`;
    
    return summary;
  }

  /**
   * Create basic chapters when OpenAI is not available
   */
  private createBasicChapters(videoData: any): Array<{title: string, startS: number, endS: number}> {
    const keyMoments = videoData.key_moments || [];
    
    if (keyMoments.length === 0) {
      return [{ title: 'Introduction', startS: 0, endS: 300 }];
    }

    return keyMoments.map((moment: any, index: number) => {
      const nextMoment = keyMoments[index + 1];
      const endS = nextMoment ? nextMoment.start_seconds : moment.start_seconds + 300;
      
      return {
        title: moment.title,
        startS: moment.start_seconds,
        endS: endS,
      };
    });
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.searchAPIService.isAvailable();
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      searchAPI: this.searchAPIService.isAvailable(),
      openAI: this.openaiService.isAvailable(),
      available: this.isAvailable(),
      message: this.isAvailable() 
        ? 'Transcript processing is available' 
        : 'Transcript processing is not available - SearchAPI not configured',
    };
  }
}



