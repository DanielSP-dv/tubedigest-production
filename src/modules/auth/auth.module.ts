import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenManagementService } from './token-management.service';
import { PrismaClient } from '@prisma/client';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [SecurityModule],
  controllers: [AuthController],
  providers: [
    AuthService, 
    TokenManagementService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
})
export class AuthModule {}


