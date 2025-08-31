import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { YouTubeService } from '../youtube/youtube.service';

@Injectable()
export class DigestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly youtubeService: YouTubeService,
  ) {}

  async getLatestDigest(userEmail: string) {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      return null;
    }
    return this.prisma.digestRun.findFirst({
      where: { userId: user.id },
      orderBy: { sentAt: 'desc' },
    });
  }

  async generateDigestPreview(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: 'User not found' };
    }

    const selectedChannels = await this.prisma.channelSubscription.findMany({
      where: { userId: user.id }
    });

    if (selectedChannels.length === 0) {
      return {
        title: 'No Channels Selected',
        summary: 'Please select some channels to see a preview of your digest.',
        videoCount: 0,
        videos: [],
      };
    }

    const recentVideos = await this.youtubeService.getVideosForChannels(user.id, selectedChannels.map(c => c.channelId));
    const previewVideos = recentVideos.slice(0, 5);

    return {
      title: `TubeDigest Preview — ${new Date().toLocaleDateString()}`,
      summary: `Preview of your digest with ${previewVideos.length} videos from your selected channels.`, 
      videoCount: previewVideos.length,
      videos: previewVideos.map((video: any) => ({
        id: video.id,
        title: video.title,
        summary: video.summary || 'No summary available',
        duration: this.formatDuration(video.durationS),
        thumbnail: video.thumbnail,
        publishedAt: video.publishedAt,
        channelTitle: video.channelTitle,
      })),
    };
  }

  async assembleAndSend(userEmail: string) {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      throw new Error('User not found');
    }

    const run = await this.prisma.digestRun.create({
      data: { userId: user.id, status: 'assembling' }
    });

    try {
      const selectedChannels = await this.prisma.channelSubscription.findMany({
        where: { userId: user.id }
      });

      if (selectedChannels.length === 0) {
        await this.prisma.digestRun.update({
          where: { id: run.id },
          data: { status: 'no_channels' }
        });
        return { id: run.id, status: 'no_channels' };
      }

      const newVideos = await this.youtubeService.getVideosForChannels(user.id, selectedChannels.map(c => c.channelId));

      if (newVideos.length === 0) {
        await this.prisma.digestRun.update({
          where: { id: run.id },
          data: { status: 'no_new_videos' }
        });
        return { id: run.id, status: 'no_new_videos' };
      }

      const webViewUrl = `${process.env.APP_URL || 'http://localhost:3000'}/digests/${run.id}`;
      const { html, text } = this.buildDigestEmail(newVideos, webViewUrl);
      const subject = `TubeDigest — ${new Date().toLocaleDateString()}`;
      
      const messageId = await this.email.sendDigest(userEmail, subject, html, text);

      await this.prisma.digestRun.update({
        where: { id: run.id },
        data: { status: 'sent', sentAt: new Date(), messageId }
      });
      
      return { id: run.id, messageId, itemCount: newVideos.length };
    } catch (error) {
      await this.prisma.digestRun.update({
        where: { id: run.id },
        data: { status: 'failed' }
      });
      throw error;
    }
  }

  private buildDigestEmail(videos: any[], webViewUrl: string): { html: string; text: string } {
    const itemsHtml = videos.map((video: any) => {
      return `
        <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 15px 0; color: #1a73e8; font-size: 18px;">
            <a href="${video.url}" style="color: #1a73e8; text-decoration: none;">${video.title}</a>
          </h3>
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>TubeDigest</h1>
        ${itemsHtml}
        <a href="${webViewUrl}">View this digest online</a>
      </body>
      </html>
    `;

    const text = videos.map((v: any) => `${v.title}\n${v.url}`).join('\n\n');

    return { html, text };
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}


