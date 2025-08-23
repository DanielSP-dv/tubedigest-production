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
}


