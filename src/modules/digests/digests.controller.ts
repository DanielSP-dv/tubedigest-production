import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { DigestsService } from './digests.service';
import { Request } from 'express';

@Controller('digests')
export class DigestsController {
  constructor(private readonly digestsService: DigestsService) {}

  @Get('latest')
  async getLatestDigest(@Req() req: Request) {
    const userEmail = req.cookies?.userEmail;
    if (!userEmail) {
      return null;
    }
    return this.digestsService.getLatestDigest(userEmail);
  }

  @Post('run')
  async runDigest(@Req() req: Request) {
    const userEmail = req.cookies?.userEmail;
    if (!userEmail) {
      return { success: false, message: 'User not authenticated' };
    }
    return this.digestsService.assembleAndSend(userEmail);
  }

  @Get('preview')
  async getDigestPreview(@Req() req: Request) {
    const userEmail = req.cookies?.userEmail;
    if (!userEmail) {
      return { error: 'User not authenticated' };
    }
    return this.digestsService.generateDigestPreview(userEmail);
  }
}


