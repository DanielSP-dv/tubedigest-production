import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SearchAPIVideoResult } from './search-api.service';

@Injectable()
export class SearchAPICacheService {
  private readonly logger = new Logger(SearchAPICacheService.name);
  private readonly prisma = new PrismaClient();

  /**
   * Get cached video data by YouTube video ID
   */
  async getCachedVideo(videoId: string): Promise<SearchAPIVideoResult | null> {
    try {
      const cached = await this.prisma.searchAPICache.findFirst({
        where: {
          videoId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      if (!cached) {
        this.logger.debug(`No valid cache found for video ID: ${videoId}`);
        return null;
      }

      this.logger.log(`Cache hit for video ID: ${videoId}`);
      return {
        id: cached.videoId,
        title: cached.title,
        description: cached.description || '',
        transcript: cached.transcript || undefined,
        summary: cached.summary || undefined,
        duration: cached.duration || undefined,
        publishedAt: cached.publishedAt?.toISOString(),
        channelTitle: cached.channelTitle || undefined,
        channelId: cached.channelId || undefined
      };

    } catch (error) {
      this.logger.error(`Failed to get cached video ${videoId}:`, (error as Error).message);
      return null;
    }
  }

  /**
   * Cache video data from SearchAPI
   */
  async cacheVideo(videoData: SearchAPIVideoResult, searchQuery?: string, responseTimeMs?: number): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Cache for 30 days

      await this.prisma.searchAPICache.upsert({
        where: { videoId: videoData.id },
        update: {
          title: videoData.title,
          description: videoData.description,
          transcript: videoData.transcript,
          summary: videoData.summary,
          duration: videoData.duration,
          publishedAt: videoData.publishedAt ? new Date(videoData.publishedAt) : null,
          channelTitle: videoData.channelTitle,
          channelId: videoData.channelId,
          searchQuery,
          apiResponseTimeMs: responseTimeMs,
          updatedAt: new Date(),
          expiresAt,
          isActive: true
        },
        create: {
          videoId: videoData.id,
          title: videoData.title,
          description: videoData.description,
          transcript: videoData.transcript,
          summary: videoData.summary,
          duration: videoData.duration,
          publishedAt: videoData.publishedAt ? new Date(videoData.publishedAt) : null,
          channelTitle: videoData.channelTitle,
          channelId: videoData.channelId,
          searchQuery,
          apiResponseTimeMs: responseTimeMs,
          expiresAt,
          isActive: true
        }
      });

      this.logger.log(`Cached video data for ID: ${videoData.id}`);

    } catch (error) {
      this.logger.error(`Failed to cache video ${videoData.id}:`, (error as Error).message);
    }
  }

  /**
   * Search cached videos by query
   */
  async searchCachedVideos(query: string, limit: number = 10): Promise<SearchAPIVideoResult[]> {
    try {
      const cached = await this.prisma.searchAPICache.findMany({
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ],
          AND: [
            {
              OR: [
                { title: { contains: query } },
                { description: { contains: query } },
                { searchQuery: { contains: query } }
              ]
            }
          ]
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });

      return cached.map(item => ({
        id: item.videoId,
        title: item.title,
        description: item.description || '',
        transcript: item.transcript || undefined,
        summary: item.summary || undefined,
        duration: item.duration || undefined,
        publishedAt: item.publishedAt?.toISOString(),
        channelTitle: item.channelTitle || undefined,
        channelId: item.channelId || undefined
      }));

    } catch (error) {
      this.logger.error(`Failed to search cached videos for query "${query}":`, (error as Error).message);
      return [];
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<number> {
    try {
      const result = await this.prisma.searchAPICache.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      this.logger.log(`Cleaned up ${result.count} expired cache entries`);
      return result.count;

    } catch (error) {
      this.logger.error('Failed to cleanup expired cache:', (error as Error).message);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    activeEntries: number;
    expiredEntries: number;
    totalSize: number;
  }> {
    try {
      const [total, active, expired] = await Promise.all([
        this.prisma.searchAPICache.count(),
        this.prisma.searchAPICache.count({ where: { isActive: true } }),
        this.prisma.searchAPICache.count({ 
          where: { 
            expiresAt: { lt: new Date() },
            isActive: true 
          } 
        })
      ]);

      // Estimate total size (rough calculation)
      const totalSize = total * 1024; // Assume ~1KB per entry

      return {
        totalEntries: total,
        activeEntries: active,
        expiredEntries: expired,
        totalSize
      };

    } catch (error) {
      this.logger.error('Failed to get cache stats:', (error as Error).message);
      return {
        totalEntries: 0,
        activeEntries: 0,
        expiredEntries: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Invalidate cache for a specific video
   */
  async invalidateCache(videoId: string): Promise<boolean> {
    try {
      await this.prisma.searchAPICache.updateMany({
        where: { videoId },
        data: { isActive: false }
      });

      this.logger.log(`Invalidated cache for video ID: ${videoId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to invalidate cache for video ${videoId}:`, (error as Error).message);
      return false;
    }
  }
}
