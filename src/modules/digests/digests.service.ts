import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { VideosService } from '../videos/videos.service';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class DigestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly videosService: VideosService,
    private readonly jobsService: JobsService,
  ) {}

  // --- Methods expected by controller/tests (lightweight stubs for compatibility) ---
  async testDigest() {
    return { status: 'ok' };
  }

  async debugDigest() {
    return { debug: true };
  }

  async getLatestDigest() {
    return { latest: true };
  }

  async scheduleDigestWithOptions(email: string, options: { cadence: string; startDate?: Date; customDays?: number }) {
    const user = await this.prisma.user.upsert({ 
      where: { email }, 
      update: {}, 
      create: { email } 
    });

    // Validate cadence
    const validCadences = ['immediate', 'daily', 'weekly', 'custom'];
    if (!validCadences.includes(options.cadence)) {
      throw new Error(`Invalid cadence: ${options.cadence}. Must be one of: ${validCadences.join(', ')}`);
    }

    // Calculate next run time based on cadence
    let nextRun: Date;
    switch (options.cadence) {
      case 'immediate':
        nextRun = new Date();
        break;
      case 'daily':
        nextRun = new Date();
        nextRun.setHours(9, 0, 0, 0); // 9:00 AM
        if (nextRun <= new Date()) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        nextRun = new Date();
        nextRun.setHours(9, 0, 0, 0); // 9:00 AM on Monday
        const dayOfWeek = nextRun.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
        nextRun.setDate(nextRun.getDate() + daysUntilMonday);
        break;
      case 'custom':
        if (!options.startDate) {
          throw new Error('Start date is required for custom cadence');
        }
        nextRun = new Date(options.startDate);
        break;
      default:
        nextRun = new Date();
    }

    // Create digest schedule
    const schedule = await this.prisma.digestSchedule.create({
      data: {
        userId: user.id,
        cadence: options.cadence,
        customDays: options.customDays,
        nextRun,
        enabled: true,
      }
    });

                    // Schedule the job
                if (options.cadence === 'immediate') {
                  await this.jobsService.scheduleDigestForUserImmediate(email);
                } else {
                  await this.jobsService.scheduleRecurringDigest(email, options.cadence, nextRun, options.customDays);
                }

    return {
      id: schedule.id,
      email,
      cadence: options.cadence,
      nextRun,
      status: 'scheduled'
    };
  }

  async scheduleDigest(email: string, cadence: string) {
    return this.scheduleDigestWithOptions(email, { cadence });
  }

  async getUserSchedules(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return [];
    }

    return this.prisma.digestSchedule.findMany({
      where: { userId: user.id, enabled: true },
      orderBy: { nextRun: 'asc' }
    });
  }

  async cancelSchedule(scheduleId: string, email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    const schedule = await this.prisma.digestSchedule.findFirst({
      where: { id: scheduleId, userId: user.id }
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    await this.prisma.digestSchedule.update({
      where: { id: scheduleId },
      data: { enabled: false }
    });

    return { id: scheduleId, status: 'cancelled' };
  }

  async generateDigestPreview(email: string) {
    const user = await this.prisma.user.upsert({ 
      where: { email }, 
      update: {}, 
      create: { email } 
    });

    // Get user's selected channels
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

    // Get recent videos for preview (last 7 days)
    const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentVideos = await this.videosService.getVideosForDigest(user.id, sinceDate);

    // Limit to 5 videos for preview
    const previewVideos = recentVideos.slice(0, 5);

    return {
      title: `TubeDigest Preview — ${new Date().toLocaleDateString()}`,
      summary: `Preview of your digest with ${previewVideos.length} videos from your selected channels.`,
      videoCount: previewVideos.length,
      videos: previewVideos.map(video => ({
        id: video.id,
        title: video.title,
        summary: video.summary?.summaryText || 'No summary available',
        duration: this.formatDuration(video.durationS),
        thumbnail: '', // TODO: Add thumbnail field to video model
        publishedAt: video.publishedAt,
        channelTitle: '', // TODO: Add channelTitle field to video model
      })),
    };
  }

  async testEmail() {
    try {
      const testSubject = 'TubeDigest Test Email';
      const testHtml = `
        <h1>TubeDigest Test Email</h1>
        <p>This is a test email sent at ${new Date().toISOString()}</p>
        <p>If you receive this, the email system is working correctly!</p>
      `;
      const testText = 'TubeDigest Test Email - Email system is working correctly!';
      
      const messageId = await this.email.sendDigest('danielsecopro@gmail.com', testSubject, testHtml, testText);
      return { email: 'danielsecopro@gmail.com', status: 'sent', messageId };
    } catch (error) {
      return { email: 'danielsecopro@gmail.com', status: 'failed', error: (error as Error).message };
    }
  }

  async testDigestForEmail(email: string) {
    try {
      const testSubject = `TubeDigest Test Digest for ${email}`;
      const testHtml = `
        <h1>TubeDigest Test Digest</h1>
        <p>This is a test digest email sent to ${email}</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <p>If you receive this, the digest email system is working correctly!</p>
      `;
      const testText = `TubeDigest Test Digest for ${email} - Digest email system is working correctly!`;
      
      const messageId = await this.email.sendDigest(email, testSubject, testHtml, testText);
      return { email, status: 'sent', messageId };
    } catch (error) {
      return { email, status: 'failed', error: (error as Error).message };
    }
  }

  async testGmailForEmail(email: string) {
    try {
      const testSubject = `TubeDigest Gmail Test for ${email}`;
      const testHtml = `
        <h1>TubeDigest Gmail Test</h1>
        <p>This is a Gmail test email sent to ${email}</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <p>If you receive this, the Gmail integration is working correctly!</p>
      `;
      
      const messageId = await this.email.sendTestToGmail(email, testSubject, testHtml);
      return { email, status: 'sent', messageId };
    } catch (error) {
      return { email, status: 'failed', error: (error as Error).message };
    }
  }

  async integrationTest() {
    return { integration: 'ok' };
  }

  async assembleAndSend(userEmail: string) {
    const user = await this.prisma.user.upsert({ 
      where: { email: userEmail }, 
      update: {}, 
      create: { email: userEmail } 
    });
    
    const run = await this.prisma.digestRun.create({ 
      data: { userId: user.id, status: 'assembling' } 
    });

    try {
      // Get user's selected channels
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

      // Get last digest run to determine window
      const lastRun = await this.prisma.digestRun.findFirst({
        where: { userId: user.id, status: 'sent' },
        orderBy: { sentAt: 'desc' }
      });

      const sinceDate = lastRun?.sentAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago

      // Fetch new videos for all subscribed channels
      for (const channel of selectedChannels) {
        await this.videosService.fetchNewVideosForChannel(userEmail, channel.channelId, 24);
      }

      // Get new videos from selected channels since last digest
      const newVideos = await this.videosService.getVideosForDigest(user.id, sinceDate);

      if (newVideos.length === 0) {
        await this.prisma.digestRun.update({ 
          where: { id: run.id }, 
          data: { status: 'no_new_videos' } 
        });
        return { id: run.id, status: 'no_new_videos' };
      }

      // Create digest items
      const digestItems = await Promise.all(
        newVideos.map((video, index) =>
          this.prisma.digestItem.create({
            data: {
              digestRunId: run.id,
              videoId: video.id,
              position: index + 1
            }
          })
        )
      );

      // Generate web view URL (signed link placeholder)
      const webViewUrl = `${process.env.APP_URL || 'http://localhost:3000'}/digests/${run.id}`;

      // Build HTML email with text fallback
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
    const itemsHtml = videos.map(video => {
      const chaptersHtml = video.chapters.length > 0 
        ? `<ul style="margin: 10px 0; padding-left: 20px;">${video.chapters.map((ch: any) => 
            `<li style="margin: 5px 0;">${this.formatTimestamp(ch.startS)} - ${ch.title}</li>`
          ).join('')}</ul>`
        : '<p style="color: #666; font-style: italic;">No chapters available</p>';

      const summary = video.summary?.summaryText || 'No summary available';
      
      return `
        <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 15px 0; color: #1a73e8; font-size: 18px;">
            <a href="${video.url}" style="color: #1a73e8; text-decoration: none;">${video.title}</a>
          </h3>
          <div style="margin-bottom: 15px; color: #666; font-size: 14px;">
            <span style="margin-right: 20px;"><strong>Published:</strong> ${video.publishedAt.toLocaleDateString()}</span>
            <span><strong>Duration:</strong> ${this.formatDuration(video.durationS)}</span>
          </div>
          <div style="margin-bottom: 15px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">Summary:</p>
            <p style="margin: 0; line-height: 1.6; color: #444;">${summary}</p>
          </div>
          <div style="margin-bottom: 15px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">Chapters:</p>
            ${chaptersHtml}
          </div>
          <a href="/api/watchlater?videoId=${video.id}" style="display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500;">Save to Watch Later</a>
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TubeDigest</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h1 style="color: #1a73e8; margin: 0 0 20px 0; font-size: 28px; text-align: center;">TubeDigest</h1>
          <p style="color: #666; margin: 0 0 30px 0; text-align: center; font-size: 16px;">Here are the latest videos from your selected channels:</p>
          ${itemsHtml}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          <div style="text-align: center; color: #666; font-size: 14px;">
            <a href="${webViewUrl}" style="color: #1a73e8; text-decoration: none; margin-right: 20px;">View this digest online</a>
            <a href="/unsubscribe" style="color: #666; text-decoration: none;">Unsubscribe</a>
          </div>
        </div>
      </body>
      </html>
    `;

    // Generate text fallback
    const text = this.buildDigestText(videos, webViewUrl);

    return { html, text };
  }

  private buildDigestText(videos: any[], webViewUrl: string): string {
    const itemsText = videos.map(video => {
      const chaptersText = video.chapters.length > 0 
        ? video.chapters.map((ch: any) => 
            `  ${this.formatTimestamp(ch.startS)} - ${ch.title}`
          ).join('\n')
        : '  No chapters available';

      const summary = video.summary?.summaryText || 'No summary available';
      
      return `
${video.title}
Published: ${video.publishedAt.toLocaleDateString()}
Duration: ${this.formatDuration(video.durationS)}
URL: ${video.url}

Summary:
${summary}

Chapters:
${chaptersText}

---
`;
    }).join('');

    return `
TubeDigest - ${new Date().toLocaleDateString()}

Here are the latest videos from your selected channels:

${itemsText}

View this digest online: ${webViewUrl}

To unsubscribe, visit: /unsubscribe
`;
  }

  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private formatDuration(seconds: number): string {
    return this.formatTimestamp(seconds);
  }
}


