import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchAPIService } from './search-api.service';
import { SearchAPIController } from './search-api.controller';
import { SearchAPICacheService } from './search-api-cache.service';

@Module({
  imports: [ConfigModule],
  providers: [SearchAPIService, SearchAPICacheService],
  controllers: [SearchAPIController],
  exports: [SearchAPIService, SearchAPICacheService],
})
export class SearchAPIModule {}
