import { Controller, Get } from '@nestjs/common';

@Controller()
export class HomeController {
  @Get()
  root() {
    return {
      message: 'TubeDigest API',
      health: '/health',
      connectGoogle: '/auth/google',
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'TubeDigest Backend'
    };
  }
}


