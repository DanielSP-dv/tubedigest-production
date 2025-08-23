import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'TubeDigest Backend'
    };
  }

  @Get('test')
  getHealthTest() {
    return {
      status: 'ok',
      message: 'Health check test endpoint working',
      timestamp: new Date().toISOString()
    };
  }
}


