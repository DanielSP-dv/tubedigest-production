import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private youtube: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    if (apiKey) {
      this.youtube = google.youtube({ version: 'v3', auth: apiKey });
    }
  }

  async getVideosForChannels(userId: string, channelIds: string[]): Promise<any[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { tokens: true } });
    if (!user || !user.tokens.length) {
      throw new Error('User not found or has no tokens');
    }

    const token = user.tokens[0];
    const accessToken = this.decryptToken(token.accessTokenEnc);
    if (!accessToken) {
      throw new Error('Invalid access token');
    }

    const oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI')
    );
    oauth2Client.setCredentials({ access_token: accessToken });
    const youtubeOAuth = google.youtube({ version: 'v3', auth: oauth2Client });

    const videos = [];
    for (const channelId of channelIds) {
      const response = await youtubeOAuth.search.list({
        part: ['snippet'],
        channelId: channelId,
        order: 'date',
        type: ['video'],
        maxResults: 5,
      });

      if (response.data.items) {
        for (const item of response.data.items) {
          if (item.id && item.snippet) {
            videos.push({
              id: item.id.videoId,
              title: item.snippet.title,
              summary: item.snippet.description,
              thumbnail: item.snippet.thumbnails?.default?.url,
              publishedAt: item.snippet.publishedAt,
              channelTitle: item.snippet.channelTitle,
              url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              durationS: 0, // Duration is not available in search results
            });
          }
        }
      }
    }
    return videos;
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
}
