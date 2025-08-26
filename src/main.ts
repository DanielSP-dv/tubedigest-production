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
  
  // Enable CORS for frontend (updated for Railway)
  const allowedOrigins = [
    'https://frontend-rho-topaz-86.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  
  // Add Railway domain to allowed origins if available
  if (process.env.RAILWAY_STATIC_URL) {
    allowedOrigins.push(process.env.RAILWAY_STATIC_URL);
  }
  
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? allowedOrigins
      : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });
  
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  console.log(`🚀 Application starting on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  
  await app.listen(port);
  console.log(`✅ Application is running on: http://localhost:${port}`);
}

bootstrap();


