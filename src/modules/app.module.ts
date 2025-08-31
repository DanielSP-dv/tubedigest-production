import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MeController } from './me/me.controller';
import { HomeController } from './home/home.controller';
import { ChannelsModule } from './channels/channels.module';
import { DigestsModule } from './digests/digests.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    ChannelsModule,
    DigestsModule,
    EmailModule,
  ],
  controllers: [HomeController, MeController],
})
export class AppModule {
  constructor() {
    console.log('AppModule loaded with simplified modules for MVP');
  }
}


