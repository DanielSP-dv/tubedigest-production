import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Set global prefix for API routes
  app.setGlobalPrefix('api');
  
  // Enable cookie parsing middleware
  app.use(cookieParser());
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://frontend-rho-topaz-86.vercel.app', 'http://localhost:3000']
      : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });
  
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}

bootstrap();


