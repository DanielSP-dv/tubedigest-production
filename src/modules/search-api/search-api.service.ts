import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SearchAPIVideoResult {
  id: string;
  title: string;
  description: string;
  transcript?: string;
  summary?: string;
  duration?: string;
  publishedAt?: string;
  channelTitle?: string;
  channelId?: string;
  link?: string;
  views?: number;
  length?: string;
  published_time?: string;
  channel?: {
    id: string;
    title: string;
  };
  key_moments?: Array<{
    title: string;
    start_seconds: number;
  }>;
}

export interface SearchAPIResponse {
  search_metadata: {
    id: string;
    status: string;
    created_at: string;
    request_time_taken: number;
  };
  search_parameters: {
    engine: string;
    q: string;
    device: string;
    google_domain: string;
    hl: string;
    gl: string;
  };
  search_information: {
    query_displayed: string;
    total_results: number;
    time_taken_displayed: number;
  };
  video_results?: SearchAPIVideoResult[];
  error?: string;
}

@Injectable()
export class SearchAPIService {
  private readonly logger = new Logger(SearchAPIService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.searchapi.io/api/v1/search';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SEARCHAPI_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('SearchAPI key not configured. SearchAPI features will be disabled.');
    }
  }

  /**
   * Search for YouTube videos using SearchAPI
   */
  async searchYouTubeVideos(query: string, maxResults: number = 10): Promise<SearchAPIVideoResult[]> {
    if (!this.apiKey) {
      throw new Error('SearchAPI key not configured');
    }

    try {
      this.logger.log(`Searching YouTube for: "${query}"`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          engine: 'youtube',
          q: query,
          api_key: this.apiKey,
          num: maxResults,
          gl: 'us',
          hl: 'en'
        },
        timeout: 10000
      });

      const data: SearchAPIResponse = response.data;
      
      if (data.error) {
        throw new Error(`SearchAPI error: ${data.error}`);
      }

      if (!data.video_results || data.video_results.length === 0) {
        this.logger.warn(`No video results found for query: "${query}"`);
        return [];
      }

      // Map the SearchAPI response to our expected format
      const mappedResults = data.video_results.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        link: video.link,
        views: video.views,
        length: video.length,
        published_time: video.published_time,
        channelTitle: video.channel?.title,
        channelId: video.channel?.id,
        key_moments: video.key_moments,
        // Extract video ID from link if available
        videoId: video.link ? video.link.match(/[?&]v=([^&]+)/)?.[1] : video.id
      }));

      this.logger.log(`Found ${mappedResults.length} videos for query: "${query}"`);
      return mappedResults;

    } catch (error) {
      this.logger.error(`SearchAPI request failed for query "${query}":`, (error as Error).message);
      throw new Error(`Failed to search YouTube videos: ${(error as Error).message}`);
    }
  }

  /**
   * Get video details by YouTube video ID
   */
  async getVideoById(videoId: string): Promise<SearchAPIVideoResult | null> {
    if (!this.apiKey) {
      throw new Error('SearchAPI key not configured');
    }

    try {
      this.logger.log(`Fetching video details for ID: ${videoId}`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          engine: 'youtube',
          q: videoId,
          api_key: this.apiKey,
          num: 1,
          gl: 'us',
          hl: 'en'
        },
        timeout: 10000
      });

      const data: SearchAPIResponse = response.data;
      
      if (data.error) {
        throw new Error(`SearchAPI error: ${data.error}`);
      }

      if (!data.video_results || data.video_results.length === 0) {
        this.logger.warn(`No video found for ID: ${videoId}`);
        return null;
      }

      const video = data.video_results[0];
      
      // Map the response to our expected format
      const mappedVideo = {
        id: video.id,
        title: video.title,
        description: video.description,
        link: video.link,
        views: video.views,
        length: video.length,
        published_time: video.published_time,
        channelTitle: video.channel?.title,
        channelId: video.channel?.id,
        key_moments: video.key_moments,
        // For now, we'll use the description as a basic summary
        // In a real implementation, you might want to use AI to generate a proper summary
        summary: video.description ? video.description.substring(0, 500) + '...' : undefined,
        // For now, we don't have transcript data from SearchAPI
        // This would need to be fetched separately or generated
        transcript: undefined
      };
      
      this.logger.log(`Found video: ${mappedVideo.title} for ID: ${videoId}`);
      return mappedVideo;

    } catch (error) {
      this.logger.error(`SearchAPI request failed for video ID ${videoId}:`, (error as Error).message);
      throw new Error(`Failed to get video details: ${(error as Error).message}`);
    }
  }

  /**
   * Check if SearchAPI is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get API usage statistics (if available)
   */
  async getUsageStats(): Promise<any> {
    if (!this.apiKey) {
      return null;
    }

    try {
      // This would depend on SearchAPI's actual usage endpoint
      // For now, return basic availability info
      return {
        available: true,
        apiKey: this.apiKey ? 'configured' : 'not configured'
      };
    } catch (error) {
      this.logger.error('Failed to get usage stats:', (error as Error).message);
      return null;
    }
  }
}
