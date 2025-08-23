import { BadRequestException, Injectable, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { google } from 'googleapis';
import * as crypto from 'crypto';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  // Save a user's selected channels (max 10)
  async saveSelection(userEmail: string, channelIds: string[], titles: Record<string, string>) {
    if (channelIds.length > 10) throw new BadRequestException('limit_exceeded');
    
    // Filter out null/undefined/empty channel IDs
    const validChannelIds = channelIds.filter(id => id && id.trim() !== '');
    
    if (validChannelIds.length === 0) {
      console.log('🔍 [ChannelsService] No valid channel IDs provided, skipping save');
      return;
    }
    
    const user = await this.prisma.user.upsert({ 
      where: { email: userEmail }, 
      update: {}, 
      create: { email: userEmail } 
    });
    
    // Remove previous selection
    await this.prisma.channelSubscription.deleteMany({ where: { userId: user.id } });
    
    // Insert new selection with only valid data
    const validData = validChannelIds.map((id) => ({
      userId: user.id, 
      channelId: id, 
      title: titles[id] || id
    }));
    
    console.log('🔍 [ChannelsService] Saving valid channel selections:', validData.length);
    
    if (validData.length > 0) {
      await this.prisma.channelSubscription.createMany({
        data: validData,
      });
    }
  }

  // Get a user's selected channels
  async getSelection(userEmail: string) {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail }, include: { channelSubs: true } });
    return user?.channelSubs ?? [];
  }

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

  // List YouTube subscriptions for a user
  async listChannels(userEmail: string) {
    console.log('🔍 [ChannelsService] Starting listChannels for user:', userEmail);
    
    // First find the user, then get their OAuth token
    const user = await this.prisma.user.findUnique({ 
      where: { email: userEmail },
      include: { tokens: { where: { provider: 'google' }, orderBy: { createdAt: 'desc' } } }
    });
    const token = user?.tokens[0] || null;
    console.log('🔍 [ChannelsService] Found token:', token ? 'YES' : 'NO');
    
    if (!token) {
      console.log('🔍 [ChannelsService] No OAuth token found, returning mock channels for development');
      // Return mock channels for development when no OAuth token exists
      return this.getMockChannels();
    }
    
    let accessToken: string | undefined;
    let refreshToken: string | undefined;
    
    try {
      accessToken = token.accessTokenEnc ? this.decrypt(token.accessTokenEnc) : undefined;
      refreshToken = token.refreshTokenEnc ? this.decrypt(token.refreshTokenEnc) : undefined;
    } catch (error) {
      console.log('🔍 [ChannelsService] Token decryption failed, falling back to mock channels');
      console.error('❌ [ChannelsService] Decryption error:', error);
      return this.getMockChannels();
    }
    
    console.log('🔍 [ChannelsService] Access token exists:', !!accessToken);
    console.log('🔍 [ChannelsService] Refresh token exists:', !!refreshToken);

    try {
      const auth = new google.auth.OAuth2({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
      });
      auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
      
      console.log('🔍 [ChannelsService] Making YouTube API call...');
      const youtube = google.youtube({ version: 'v3', auth });
      const subs = await youtube.subscriptions.list({ part: ['snippet'], mine: true, maxResults: 50 });
      
      console.log('🔍 [ChannelsService] YouTube API response:', subs.data);
      
      const items = (subs.data.items || []).map((it) => ({
        channelId: it.snippet?.resourceId?.channelId || '',
        title: it.snippet?.title || '',
        thumbnail: it.snippet?.thumbnails?.default?.url || '',
      })).filter((i) => i.channelId);
      
      console.log('🔍 [ChannelsService] Returning items:', items.length);
      return items;
    } catch (e) {
      console.error('❌ [ChannelsService] YouTube API error:', e);
      
      // Add proper error type checking
      if (e && typeof e === 'object' && 'message' in e) {
        console.error('❌ [ChannelsService] Error details:', e.message);
      }
      
      if (e && typeof e === 'object' && 'code' in e) {
        console.error('❌ [ChannelsService] Error code:', e.code);
      }
      
      throw new ServiceUnavailableException('upstream_error');
    }
  }

  // Convenience wrappers used by controller (MVP uses default user)
  async getSelectedChannelsForDefaultUser() {
    const userEmail = 'danielsecopro@gmail.com'; // Use actual user email
    return this.getSelection(userEmail);
  }

  async selectChannelsForDefaultUser(channelIds: string[], titles: Record<string, string>) {
    const userEmail = 'danielsecopro@gmail.com'; // Use actual user email
    await this.saveSelection(userEmail, channelIds, titles);
    return { ok: true };
  }

  async updateChannelSelectionForDefaultUser(channelId: string, selected: boolean) {
    const userEmail = 'danielsecopro@gmail.com'; // Use actual user email
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (selected) {
      // Add channel to selection
      await this.prisma.channelSubscription.upsert({
        where: { userId_channelId: { userId: user.id, channelId } },
        update: {},
        create: { userId: user.id, channelId, title: channelId }
      });
    } else {
      // Remove channel from selection
      await this.prisma.channelSubscription.deleteMany({
        where: { userId: user.id, channelId }
      });
    }

    return { ok: true, selected };
  }

  // New user-specific methods
  async getSelectedChannelsForUser(userEmail: string) {
    const selections = await this.getSelection(userEmail);
    // Return only the fields the frontend expects
    return selections.map(selection => ({
      channelId: selection.channelId,
      title: selection.title
    }));
  }

  async selectChannelsForUser(userEmail: string, channelIds: string[], titles: Record<string, string>) {
    await this.saveSelection(userEmail, channelIds, titles);
    return { ok: true };
  }

  async updateChannelSelectionForUser(userEmail: string, channelId: string, selected: boolean) {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (selected) {
      // Add channel to selection
      await this.prisma.channelSubscription.upsert({
        where: { userId_channelId: { userId: user.id, channelId } },
        update: {},
        create: { userId: user.id, channelId, title: channelId }
      });
    } else {
      // Remove channel from selection
      await this.prisma.channelSubscription.deleteMany({
        where: { userId: user.id, channelId }
      });
    }

    return { ok: true, selected };
  }

  // Mock channels for development when no OAuth token exists
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
      {
        channelId: 'UCIFk2uvCNcEmZ77g0ESKLcQ',
        title: 'Verge Science',
        thumbnail: 'https://yt3.ggpht.com/ytc/AOPolaQsF7KqHcLnyH4rEJlTqBuBzM4iqtYZS2IFj3MjdQ=s88-c-k-c0x00ffffff-no-rj'
      },
      {
        channelId: 'UC70SrI3VkT1MXALRtf0pcHg',
        title: 'Thomas Frank',
        thumbnail: 'https://yt3.ggpht.com/ytc/AOPolaQDKhc6DvFgF5WfIqA5B8J9_KOF5T9Y1L0qvQFTnA=s88-c-k-c0x00ffffff-no-rj'
      },
      {
        channelId: 'UCC0gns4a9fhVkGkngvSumAQ',
        title: 'The B1M',
        thumbnail: 'https://yt3.ggpht.com/ytc/AOPolaR4YX0VIr2XNTy_dTZ9c7BzBa6zUWlMZqH4GfPkAQ=s88-c-k-c0x00ffffff-no-rj'
      },
      {
        channelId: 'UCN-s3ugCIH5-5uA35aJcy6Q',
        title: 'Polymatter',
        thumbnail: 'https://yt3.ggpht.com/ytc/AOPolaQD2h_zJ8cNHXqGr5EKL3J8_2wqL9-_4JCnZl4O4w=s88-c-k-c0x00ffffff-no-rj'
      },
      {
        channelId: 'UC_x36zCEGilGpB1m-V4gmjg',
        title: 'Half as Interesting',
        thumbnail: 'https://yt3.ggpht.com/ytc/AOPolaQ8_X4BQr8RZ0j2TuWcJmzG4oL1vZ2QmFnOOQqpzA=s88-c-k-c0x00ffffff-no-rj'
      },
      {
        channelId: 'UCuG2KzrIMe3qoNcuDVpwnXw',
        title: 'Kurzgesagt',
        thumbnail: 'https://yt3.ggpht.com/ytc/AOPolaQVQ2h2lsQ9GbXLTnHl6n8FYKr8aMxK5Y3H9LBn=s88-c-k-c0x00ffffff-no-rj'
      },
      {
        channelId: 'UC123456789mock',
        title: 'Mock Channel 9',
        thumbnail: 'https://yt3.ggpht.com/ytc/AOPolaQMockThumbnail9=s88-c-k-c0x00ffffff-no-rj'
      }
    ];
  }
}


