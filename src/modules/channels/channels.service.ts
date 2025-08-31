import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { google } from 'googleapis';
import * as crypto from 'crypto';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  private decrypt(encB64: string): string {
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
  }

  async listChannels(userEmail: string) {
    console.log('🔍 [ChannelsService] Starting listChannels for user:', userEmail);

    const user = await this.prisma.user.findUnique({ 
      where: { email: userEmail },
      include: { tokens: { where: { provider: 'google' }, orderBy: { createdAt: 'desc' } } }
    });

    const token = user?.tokens[0];

    if (!token) {
      console.log('🔍 [ChannelsService] No OAuth token found, returning mock channels for development');
      return this.getMockChannels();
    }

    try {
      const accessToken = token.accessTokenEnc ? this.decrypt(token.accessTokenEnc) : undefined;
      const refreshToken = token.refreshTokenEnc ? this.decrypt(token.refreshTokenEnc) : undefined;

      const auth = new google.auth.OAuth2({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
      });
      auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

      const youtube = google.youtube({ version: 'v3', auth });
      const subs = await youtube.subscriptions.list({ part: ['snippet'], mine: true, maxResults: 50 });

      return (subs.data.items || []).map((it: any) => ({
        channelId: it.snippet?.resourceId?.channelId || '',
        title: it.snippet?.title || '',
        thumbnail: it.snippet?.thumbnails?.default?.url || '',
      })).filter((i: any) => i.channelId);
    } catch (e) {
      console.error('❌ [ChannelsService] YouTube API error:', e);
      throw new ServiceUnavailableException('upstream_error');
    }
  }

  async getSelectedChannelsForUser(userEmail: string) {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail }, include: { channelSubs: true } });
    return (user?.channelSubs ?? []).map(selection => ({
      channelId: selection.channelId,
      title: selection.title
    }));
  }

  async selectChannelsForUser(userEmail: string, channelIds: string[], titles: Record<string, string>) {
    if (channelIds.length > 10) throw new BadRequestException('limit_exceeded');

    const validChannelIds = channelIds.filter(id => id && id.trim() !== '');

    if (validChannelIds.length === 0) {
      console.log('🔍 [ChannelsService] No valid channel IDs provided, skipping save');
      return { ok: true };
    }

    const user = await this.prisma.user.upsert({ 
      where: { email: userEmail }, 
      update: {}, 
      create: { email: userEmail } 
    });

    await this.prisma.channelSubscription.deleteMany({ where: { userId: user.id } });

    const validData = validChannelIds.map((id) => ({
      userId: user.id, 
      channelId: id, 
      title: titles[id] || id
    }));

    if (validData.length > 0) {
      await this.prisma.channelSubscription.createMany({
        data: validData,
      });
    }
    
    return { ok: true };
  }

  private getMockChannels() {
    return [
      {
        channelId: 'UC2WmuBuFq6gL08QYG-JjXKw',
        title: 'Fireship',
        thumbnail: 'https://yt3.ggpht.com/ytc/AOPolaQKGjLiMnOChTcXGoElw4yQp5I8t8fR1MpVgZbDaQ=s88-c-k-c0x00ffffff-no-rj'
      },
      {
        channelId: 'UCLKPca3kwwd-B59HNr-_lvA',
        title: 'TechCrunch',
        thumbnail: 'https://yt3.ggpht.com/ytc/AOPolaRMDUWp7Dg1qf8X8P0_B4myfGIGhP8LhE6XKQMDOw=s88-c-k-c0x00ffffff-no-rj'
      },
    ];
  }
}


