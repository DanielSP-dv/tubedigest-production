import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private youtube: any;
  private quotaUsed = 0;
  private quotaResetTime!: Date;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initializeYouTubeAPI();
    this.resetQuotaTracking();
  }

  private initializeYouTubeAPI() {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    if (!apiKey) {
      this.logger.warn('YouTube API key not configured, using mock data');
      return;
    }

    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
  }

  private resetQuotaTracking() {
    const resetHours = this.configService.get<number>('YOUTUBE_API_QUOTA_RESET_HOURS', 24);
    this.quotaResetTime = new Date(Date.now() + resetHours * 60 * 60 * 1000);
    this.quotaUsed = 0;
  }

  private checkQuotaLimit(): boolean {
    const quotaLimit = this.configService.get<number>('YOUTUBE_API_QUOTA_LIMIT', 10000);
    
    // Reset quota if time has passed
    if (new Date() > this.quotaResetTime) {
      this.resetQuotaTracking();
    }

    if (this.quotaUsed >= quotaLimit) {
      this.logger.warn(`YouTube API quota limit reached: ${this.quotaUsed}/${quotaLimit}`);
      return false;
    }

    return true;
  }

  private updateQuotaUsage(cost: number = 1) {
    this.quotaUsed += cost;
    this.logger.debug(`YouTube API quota used: ${this.quotaUsed}`);
  }

  // Enhanced method with OAuth token management and fallback logic
  async getChannelVideosWithOAuth(userEmail: string, channelId: string, maxResults: number = 50): Promise<any[]> {
    this.logger.log(`Fetching videos for channel: ${channelId} with OAuth for user: ${userEmail}`);
    
    try {
      // First try with OAuth tokens
      const videos = await this.getChannelVideosWithOAuthTokens(userEmail, channelId, maxResults);
      if (videos.length > 0) {
        return videos;
      }
      
      // Fallback to API key if OAuth fails
      this.logger.log(`OAuth failed, falling back to API key for channel: ${channelId}`);
      return await this.getChannelVideosWithAPIKey(channelId, maxResults);
      
    } catch (error) {
      this.logger.error(`Error fetching videos for channel ${channelId}:`, error);
      
      // Final fallback to Search API
      this.logger.log(`API key failed, falling back to Search API for channel: ${channelId}`);
      return await this.getChannelVideosWithSearchAPI(channelId, maxResults);
    }
  }

  private async getChannelVideosWithOAuthTokens(userEmail: string, channelId: string, maxResults: number): Promise<any[]> {
    try {
      // Get user's OAuth tokens
      const user = await this.prisma.user.findUnique({
        where: { email: userEmail },
        include: { tokens: { where: { provider: 'google' }, orderBy: { createdAt: 'desc' }, take: 1 } }
      });

      if (!user || !user.tokens.length) {
        this.logger.warn(`No OAuth tokens found for user: ${userEmail}`);
        return [];
      }

      const token = user.tokens[0];
      const accessToken = this.decryptToken(token.accessTokenEnc);
      
      if (!accessToken) {
        this.logger.warn(`Invalid access token for user: ${userEmail}`);
        return [];
      }

      // Create OAuth2 client with user's tokens
      const oauth2Client = new google.auth.OAuth2(
        this.configService.get<string>('GOOGLE_CLIENT_ID'),
        this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
        this.configService.get<string>('GOOGLE_REDIRECT_URI')
      );
      
      oauth2Client.setCredentials({ access_token: accessToken });
      
      const youtubeOAuth = google.youtube({ version: 'v3', auth: oauth2Client });
      
      // Try to get channel uploads playlist
      const channelResponse = await youtubeOAuth.channels.list({
        part: ['contentDetails'],
        id: [channelId]
      });

      const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadsPlaylistId) {
        this.logger.warn(`No uploads playlist found for channel: ${channelId}`);
        return [];
      }

      // Get videos from uploads playlist
      const playlistResponse = await youtubeOAuth.playlistItems.list({
        part: ['snippet'],
        playlistId: uploadsPlaylistId,
        maxResults: maxResults
      });

      const videoIds = playlistResponse.data.items?.map(item => item.snippet?.resourceId?.videoId).filter((id): id is string => Boolean(id)) || [];
      
      if (videoIds.length === 0) {
        return [];
      }

      // Get detailed video information
      return await this.getVideoDetailsWithOAuth(youtubeOAuth, videoIds);
      
    } catch (error) {
      this.logger.error(`Error fetching videos with OAuth for channel ${channelId}:`, error);
      return [];
    }
  }

  private async getChannelVideosWithAPIKey(channelId: string, maxResults: number): Promise<any[]> {
    if (!this.youtube) {
      this.logger.warn('YouTube API not configured, returning mock data');
      return this.getMockChannelVideos(channelId, maxResults);
    }

    if (!this.checkQuotaLimit()) {
      throw new Error('YouTube API quota limit exceeded');
    }

    try {
      const response = await this.youtube.search.list({
        part: ['snippet'],
        channelId: channelId,
        order: 'date',
        type: 'video',
        maxResults: maxResults,
        publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
      });

      this.updateQuotaUsage(100); // Search.list costs 100 units

      const videoIds = response.data.items?.map((item: any) => item.id.videoId) || [];
      
      if (videoIds.length === 0) {
        return [];
      }

      // Get detailed video information
      const videoDetails = await this.getVideoDetails(videoIds);
      
      return videoDetails;
    } catch (error) {
      this.logger.error(`Error fetching videos with API key for channel ${channelId}:`, error);
      throw error;
    }
  }

  private async getChannelVideosWithSearchAPI(channelId: string, maxResults: number): Promise<any[]> {
    if (!this.youtube) {
      this.logger.warn('YouTube API not configured, returning mock data');
      return this.getMockChannelVideos(channelId, maxResults);
    }

    if (!this.checkQuotaLimit()) {
      throw new Error('YouTube API quota limit exceeded');
    }

    try {
      // Use Search API as fallback - search for videos from the channel
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: `channel:${channelId}`,
        order: 'date',
        type: 'video',
        maxResults: maxResults,
        publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      this.updateQuotaUsage(100); // Search.list costs 100 units

      const videoIds = response.data.items?.map((item: any) => item.id.videoId) || [];
      
      if (videoIds.length === 0) {
        return [];
      }

      // Get detailed video information
      const videoDetails = await this.getVideoDetails(videoIds);
      
      return videoDetails;
    } catch (error) {
      this.logger.error(`Error fetching videos with Search API for channel ${channelId}:`, error);
      // Return mock data as final fallback
      return this.getMockChannelVideos(channelId, maxResults);
    }
  }

  private async getVideoDetailsWithOAuth(youtubeOAuth: any, videoIds: string[]): Promise<any[]> {
    try {
      const response = await youtubeOAuth.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: videoIds
      });

      return response.data.items?.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails?.high?.url,
        duration: this.parseDuration(video.contentDetails.duration),
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
        url: `https://www.youtube.com/watch?v=${video.id}`
      })) || [];
    } catch (error) {
      this.logger.error('Error fetching video details with OAuth:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async getChannelVideos(channelId: string, maxResults: number = 50): Promise<any[]> {
    return this.getChannelVideosWithAPIKey(channelId, maxResults);
  }

  async getVideoDetails(videoIds: string[]): Promise<any[]> {
    if (!this.youtube) {
      return this.getMockVideoDetails(videoIds);
    }

    if (!this.checkQuotaLimit()) {
      throw new Error('YouTube API quota limit exceeded');
    }

    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: videoIds
      });

      this.updateQuotaUsage(1); // Videos.list costs 1 unit per video

      return response.data.items?.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails?.high?.url,
        duration: this.parseDuration(video.contentDetails.duration),
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
        url: `https://www.youtube.com/watch?v=${video.id}`
      })) || [];
    } catch (error) {
      this.logger.error('Error fetching video details:', error);
      throw error;
    }
  }

  private decryptToken(encB64: string): string | null {
    try {
      const crypto = require('crypto');
      const buf = Buffer.from(encB64, 'base64');
      const iv = buf.subarray(0, 12);
      const tag = buf.subarray(12, 28);
      const data = buf.subarray(28);
      const keyHex = process.env.TOKEN_ENC_KEY || crypto.createHash('sha256').update('dev-key').digest('hex');
      const key = Buffer.from(keyHex.slice(0, 64), 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const dec = Buffer.concat([decipher.update(data), decipher.final()]);
      return dec.toString('utf8');
    } catch (error) {
      this.logger.error('Error decrypting token:', error);
      return null;
    }
  }

  private parseDuration(duration: string): number {
    // Parse ISO 8601 duration format (PT4M13S) to seconds
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  async getVideoTranscript(videoId: string): Promise<string | null> {
    try {
      // For now, we'll use a mock transcript since youtube-transcript-api is Python-based
      // In production, you'd want to use a Node.js YouTube transcript library or API
      this.logger.log(`Fetching transcript for video: ${videoId}`);
      
      // Mock transcript - in real implementation, this would call a transcript API
      return this.getMockTranscript(videoId);
    } catch (error) {
      this.logger.warn(`Could not fetch transcript for video ${videoId}:`, error);
      return null;
    }
  }

  // Mock data methods for development/testing
  private getMockChannelVideos(channelId: string, maxResults: number): any[] {
    const mockVideos = [];
    for (let i = 1; i <= Math.min(maxResults, 10); i++) {
      mockVideos.push({
        id: `mock-${channelId}-${i}`,
        title: `Mock Video ${i} from ${channelId}`,
        description: `This is a mock video description for testing purposes.`,
        publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        channelId: channelId,
        channelTitle: `Mock Channel ${channelId}`,
        thumbnail: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><rect width="480" height="360" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-family="Arial, sans-serif" font-size="16">Video ${i}</text></svg>`,
        duration: 1800 + (i * 300), // 30-60 minutes
        viewCount: 1000 + (i * 100),
        likeCount: 50 + (i * 10),
        url: `https://www.youtube.com/watch?v=mock-${channelId}-${i}`
      });
    }
    return mockVideos;
  }

  private getMockVideoDetails(videoIds: string[]): any[] {
    return videoIds.map((id, index) => ({
      id: id,
      title: `Mock Video ${index + 1}`,
      description: `This is a mock video description for testing purposes.`,
      publishedAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      channelId: 'mock-channel',
      channelTitle: 'Mock Channel',
      thumbnail: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><rect width="480" height="360" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-family="Arial, sans-serif" font-size="16">Video ${index + 1}</text></svg>`,
      duration: 1800 + (index * 300),
      viewCount: 1000 + (index * 100),
      likeCount: 50 + (index * 10),
      url: `https://www.youtube.com/watch?v=${id}`
    }));
  }

  private getMockTranscript(videoId: string): string {
    return `This is a mock transcript for video ${videoId}. In a real implementation, this would contain the actual transcript from YouTube's auto-captions or manual captions. The transcript would be processed by AI to generate summaries and extract chapters. This mock transcript includes multiple sentences to simulate real content that would be analyzed for key points and insights.`;
  }

  getQuotaStatus(): { used: number; limit: number; resetTime: Date } {
    const quotaLimit = this.configService.get<number>('YOUTUBE_API_QUOTA_LIMIT', 10000);
    return {
      used: this.quotaUsed,
      limit: quotaLimit,
      resetTime: this.quotaResetTime
    };
  }

  async getChannelInfo(channelId: string): Promise<{ id: string; title: string; thumbnail?: string } | null> {
    this.logger.log(`Fetching channel info for: ${channelId}`);
    
    if (!this.checkQuotaLimit()) {
      this.logger.warn('YouTube API quota limit reached, cannot fetch channel info');
      return null;
    }

    try {
      if (!this.youtube) {
        this.logger.warn('YouTube API not initialized, cannot fetch channel info');
        return null;
      }

      const response = await this.youtube.channels.list({
        part: ['snippet'],
        id: [channelId],
        maxResults: 1
      });

      this.updateQuotaUsage(1); // channels.list costs 1 quota unit

      const channel = response.data.items?.[0];
      if (!channel) {
        this.logger.warn(`Channel not found: ${channelId}`);
        return null;
      }

      return {
        id: channel.id!,
        title: channel.snippet?.title || 'Unknown Channel',
        thumbnail: channel.snippet?.thumbnails?.default?.url
      };
    } catch (error) {
      this.logger.error(`Error fetching channel info for ${channelId}:`, error);
      return null;
    }
  }
}
