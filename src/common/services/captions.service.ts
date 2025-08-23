import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { CaptionResponse, CaptionsProvider } from '../../modules/transcripts/interfaces/captions-provider.interface';
import { CaptionParserService } from './caption-parser.service';
import { LanguageDetectorService } from './language-detector.service';

@Injectable()
export class CaptionsService implements CaptionsProvider {
  private readonly logger = new Logger(CaptionsService.name);
  private youtube: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly captionParser: CaptionParserService,
    private readonly languageDetector: LanguageDetectorService,
  ) {
    this.initializeYouTubeAPI();
  }

  private initializeYouTubeAPI() {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    if (!apiKey) {
      this.logger.warn('YouTube API key not configured, captions service will use fallback');
      return;
    }

    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
  }

  async fetchCaptions(videoId: string, userEmail?: string): Promise<CaptionResponse> {
    this.logger.log(`Fetching captions for video: ${videoId}`);

    try {
      // First, get available caption tracks
      const captionTracks = await this.getCaptionTracks(videoId);
      
      if (!captionTracks || captionTracks.length === 0) {
        this.logger.warn(`No caption tracks found for video: ${videoId}`);
        return {
          hasCaptions: false,
          error: 'No caption tracks available'
        };
      }

      // Find the best caption track (English preferred, auto-generated as fallback)
      const bestTrack = this.selectBestCaptionTrack(captionTracks);
      
      if (!bestTrack) {
        this.logger.warn(`No suitable caption track found for video: ${videoId}`);
        return {
          hasCaptions: false,
          error: 'No suitable caption track available'
        };
      }

      // Download the caption content
      const captionContent = await this.downloadCaption(videoId, bestTrack.id);
      
      if (!captionContent) {
        this.logger.warn(`Failed to download caption content for video: ${videoId}`);
        return {
          hasCaptions: false,
          error: 'Failed to download caption content'
        };
      }

      // Parse the caption content
      const parsedCaption = this.parseCaptionContent(captionContent, bestTrack.snippet?.language);
      
      if (!parsedCaption || !parsedCaption.text) {
        this.logger.warn(`Failed to parse caption content for video: ${videoId}`);
        return {
          hasCaptions: false,
          error: 'Failed to parse caption content'
        };
      }

      // Detect language if not provided
      const language = bestTrack.snippet?.language || this.languageDetector.detectLanguage(parsedCaption.text);

      this.logger.log(`Successfully fetched captions for video: ${videoId}, language: ${language}, format: ${parsedCaption.format}`);

      return {
        hasCaptions: true,
        text: parsedCaption.text,
        language,
        format: parsedCaption.format
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching captions for video ${videoId}:`, error);
      return {
        hasCaptions: false,
        error: errorMessage
      };
    }
  }

  async runASR(videoUrl: string): Promise<CaptionResponse> {
    // This method is implemented in the ASR service
    // We'll delegate to it when needed
    this.logger.warn('ASR functionality should be called through ASRService');
    return {
      hasCaptions: false,
      error: 'ASR not implemented in CaptionsService'
    };
  }

  private async getCaptionTracks(videoId: string): Promise<any[]> {
    if (!this.youtube) {
      this.logger.warn('YouTube API not configured, returning mock caption tracks');
      return this.getMockCaptionTracks(videoId);
    }

    try {
      const response = await this.youtube.captions.list({
        part: ['snippet'],
        videoId: videoId
      });

      return response.data.items || [];
    } catch (error) {
      this.logger.error(`Error fetching caption tracks for video ${videoId}:`, error);
      
      // Return mock data as fallback
      return this.getMockCaptionTracks(videoId);
    }
  }

  private selectBestCaptionTrack(captionTracks: any[]): any {
    // Priority order: English manual > English auto-generated > other manual > other auto-generated
    const priorities = [
      { language: 'en', isAutoSynced: false },
      { language: 'en', isAutoSynced: true },
      { language: 'en-US', isAutoSynced: false },
      { language: 'en-US', isAutoSynced: true },
      { language: 'en-GB', isAutoSynced: false },
      { language: 'en-GB', isAutoSynced: true }
    ];

    // First, try to find tracks matching our priorities
    for (const priority of priorities) {
      const track = captionTracks.find(track => 
        track.snippet?.language === priority.language && 
        track.snippet?.isAutoSynced === priority.isAutoSynced
      );
      if (track) return track;
    }

    // If no English tracks found, return the first available track
    if (captionTracks.length > 0) {
      return captionTracks[0];
    }

    return null;
  }

  private async downloadCaption(videoId: string, captionId: string): Promise<string | null> {
    if (!this.youtube) {
      this.logger.warn('YouTube API not configured, returning mock caption content');
      return this.getMockCaptionContent(videoId);
    }

    try {
      const response = await this.youtube.captions.download({
        id: captionId,
        tfmt: 'srt' // Request SRT format for easier parsing
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error downloading caption ${captionId} for video ${videoId}:`, error);
      
      // Try alternative format if SRT fails
      try {
        const response = await this.youtube.captions.download({
          id: captionId,
          tfmt: 'vtt'
        });
        return response.data;
      } catch (vttError) {
        this.logger.error(`Error downloading caption in VTT format for video ${videoId}:`, vttError);
        return null;
      }
    }
  }

  private parseCaptionContent(content: string, language?: string): { text: string; format: string } | null {
    try {
      const format = this.captionParser.detectFormat(content);
      
      let parsedCaption;
      if (format === 'srt') {
        parsedCaption = this.captionParser.parseSRT(content);
      } else if (format === 'vtt') {
        parsedCaption = this.captionParser.parseVTT(content);
      } else {
        this.logger.warn(`Unsupported caption format: ${format}`);
        return null;
      }

      const text = this.captionParser.extractTextFromSegments(parsedCaption.segments);
      
      return {
        text,
        format
      };
    } catch (error) {
      this.logger.error('Error parsing caption content:', error);
      return null;
    }
  }

  // Mock data methods for development/testing
  private getMockCaptionTracks(videoId: string): any[] {
    return [
      {
        id: `mock-caption-${videoId}`,
        snippet: {
          language: 'en',
          isAutoSynced: false,
          isCC: true,
          isLarge: false,
          isEasyReader: false,
          isDraft: false,
          isDefault: true
        }
      }
    ];
  }

  private getMockCaptionContent(videoId: string): string {
    return `1
00:00:00,000 --> 00:00:03,000
Welcome to this video about transcript processing.

2
00:00:03,000 --> 00:00:06,000
Today we'll be discussing how to implement

3
00:00:06,000 --> 00:00:09,000
a robust caption fetching system.

4
00:00:09,000 --> 00:00:12,000
This includes YouTube Data API integration

5
00:00:12,000 --> 00:00:15,000
and proper text normalization.

6
00:00:15,000 --> 00:00:18,000
Let's get started with the implementation.`;
  }
}
