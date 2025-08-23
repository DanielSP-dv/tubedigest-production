import { Controller, Get, Post, Query, Param, Request } from '@nestjs/common';
import { SearchAPIService, SearchAPIVideoResult } from './search-api.service';
import { SearchAPICacheService } from './search-api-cache.service';

@Controller('search-api')
export class SearchAPIController {
  constructor(
    private readonly searchAPIService: SearchAPIService,
    private readonly cacheService: SearchAPICacheService,
  ) {}

  /**
   * Search for YouTube videos using SearchAPI
   */
  @Get('search')
  async searchVideos(
    @Query('q') query: string,
    @Query('maxResults') maxResults: string = '10',
    @Request() req: any
  ) {
    if (!query) {
      return { error: 'Query parameter "q" is required' };
    }

    try {
      // First check cache
      const cachedResults = await this.cacheService.searchCachedVideos(query, parseInt(maxResults));
      
      if (cachedResults.length > 0) {
        return {
          source: 'cache',
          results: cachedResults,
          totalResults: cachedResults.length,
          message: 'Results from cache'
        };
      }

      // If no cache, call SearchAPI
      if (!this.searchAPIService.isAvailable()) {
        return { error: 'SearchAPI is not configured' };
      }

      const startTime = Date.now();
      const results = await this.searchAPIService.searchYouTubeVideos(query, parseInt(maxResults));
      const responseTime = Date.now() - startTime;

      // Cache the results
      for (const video of results) {
        await this.cacheService.cacheVideo(video, query, responseTime);
      }

      return {
        source: 'searchapi',
        results,
        totalResults: results.length,
        responseTimeMs: responseTime,
        message: 'Results from SearchAPI'
      };

    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Get video details by YouTube video ID
   */
  @Get('video/:videoId')
  async getVideoById(
    @Param('videoId') videoId: string,
    @Request() req: any
  ) {
    try {
      // First check cache
      const cachedVideo = await this.cacheService.getCachedVideo(videoId);
      
      if (cachedVideo) {
        return {
          source: 'cache',
          video: cachedVideo,
          message: 'Video data from cache'
        };
      }

      // If no cache, call SearchAPI
      if (!this.searchAPIService.isAvailable()) {
        return { error: 'SearchAPI is not configured' };
      }

      const startTime = Date.now();
      const video = await this.searchAPIService.getVideoById(videoId);
      const responseTime = Date.now() - startTime;

      if (!video) {
        return { error: 'Video not found' };
      }

      // Cache the result
      await this.cacheService.cacheVideo(video, undefined, responseTime);

      return {
        source: 'searchapi',
        video,
        responseTimeMs: responseTime,
        message: 'Video data from SearchAPI'
      };

    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Get cache statistics
   */
  @Get('cache/stats')
  async getCacheStats(@Request() req: any) {
    try {
      const stats = await this.cacheService.getCacheStats();
      return {
        stats,
        message: 'Cache statistics retrieved successfully'
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Clean up expired cache entries
   */
  @Post('cache/cleanup')
  async cleanupCache(@Request() req: any) {
    try {
      const cleanedCount = await this.cacheService.cleanupExpiredCache();
      return {
        cleanedCount,
        message: `Cleaned up ${cleanedCount} expired cache entries`
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Invalidate cache for a specific video
   */
  @Post('cache/invalidate/:videoId')
  async invalidateCache(
    @Param('videoId') videoId: string,
    @Request() req: any
  ) {
    try {
      const success = await this.cacheService.invalidateCache(videoId);
      return {
        success,
        videoId,
        message: success ? 'Cache invalidated successfully' : 'Failed to invalidate cache'
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Check SearchAPI availability and configuration
   */
  @Get('status')
  async getStatus(@Request() req: any) {
    try {
      const isAvailable = this.searchAPIService.isAvailable();
      const usageStats = await this.searchAPIService.getUsageStats();
      
      return {
        available: isAvailable,
        usageStats,
        message: isAvailable ? 'SearchAPI is configured and available' : 'SearchAPI is not configured'
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
