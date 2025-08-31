import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { ChannelsService } from './channels.service';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  async getChannels(@Req() req: Request) {
    try {
      console.log('🔍 [ChannelsController] getChannels called');
      const userEmail = req.cookies?.userEmail;
      if (!userEmail) {
        // Handle unauthenticated user
        return [];
      }
      console.log('🔍 [ChannelsController] User email from cookies:', userEmail);
      
      const result = await this.channelsService.listChannels(userEmail);
      console.log('✅ [ChannelsController] Result:', result?.length || 0, 'channels');
      return result;
    } catch (error) {
      console.error('❌ [ChannelsController] Error:', error);
      throw error;
    }
  }

  @Get('selected')
  async getSelectedChannels(@Req() req: Request) {
    const userEmail = req.cookies?.userEmail;
    if (!userEmail) {
        // Handle unauthenticated user
        return [];
      }
    console.log('🔍 [ChannelsController] getSelectedChannels for user:', userEmail);
    return this.channelsService.getSelectedChannelsForUser(userEmail);
  }

  @Post('select')
  async selectChannels(@Req() req: Request, @Body() body: { channelIds: string[]; titles?: Record<string, string> }) {
    const userEmail = req.cookies?.userEmail;
    if (!userEmail) {
        // Handle unauthenticated user
        return { success: false, message: 'User not authenticated' };
      }
    console.log('🔍 [ChannelsController] selectChannels for user:', userEmail);
    const titles = body.titles || {};
    return this.channelsService.selectChannelsForUser(userEmail, body.channelIds, titles);
  }
}


