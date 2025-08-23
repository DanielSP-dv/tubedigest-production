import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Controller('me')
export class MeController {
  @Get()
  getMe(@Req() req: Request) {
    // Check for user email in cookies (session validation)
    const userEmail = req.cookies?.userEmail;
    
    if (!userEmail) {
      throw new UnauthorizedException('No valid session found');
    }

    // Return user profile with session validation
    return {
      id: 'user-1',
      email: userEmail,
      createdAt: new Date(),
      tz: 'local',
      cadence: 'daily-09:00'
    };
  }

  @Get('session/health')
  getSessionHealth(@Req() req: Request) {
    const userEmail = req.cookies?.userEmail;
    
    return {
      hasValidSession: !!userEmail,
      userEmail: userEmail || null,
      timestamp: new Date().toISOString(),
      sessionValid: !!userEmail
    };
  }
}


