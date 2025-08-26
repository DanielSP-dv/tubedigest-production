# Performance & Optimization

## **Frontend Performance Strategy**
```typescript
// Code splitting for better performance
const LazyDashboard = lazy(() => import('./pages/Dashboard'));
const LazyWatchLater = lazy(() => import('./pages/WatchLater'));
const LazySettings = lazy(() => import('./pages/Settings'));

// Optimized image loading
const VideoThumbnail: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  return (
    <Image
      src={src}
      alt={alt}
      placeholder={<Skeleton.Image active />}
      preview={false}
      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
      loading="lazy"
    />
  );
};

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedVideoList: React.FC<{ videos: Video[] }> = ({ videos }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <VideoCard video={videos[index]} layout="list" />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={videos.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## **API Optimization**
```typescript
// Optimized backend queries with proper indexing
@Injectable()
export class OptimizedDigestService {
  async getLatestDigest(userId: string): Promise<DigestWithItems> {
    return this.prisma.digestRun.findFirst({
      where: { userId, status: 'sent' },
      orderBy: { scheduledFor: 'desc' },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: {
            video: {
              include: {
                channel: { select: { name: true, iconUrl: true } },
                summary: { select: { summaryText: true } },
                chapters: {
                  orderBy: { startS: 'asc' },
                  take: 15, // Limit chapters for performance
                }
              }
            }
          }
        }
      }
    });
  }
  
  // Paginated queries with cursor-based pagination
  async getWatchLaterItems(
    userId: string, 
    options: WatchLaterOptions
  ): Promise<PaginatedWatchLaterItems> {
    const { search, channelId, cursor, limit = 20 } = options;
    
    const where: Prisma.WatchLaterWhereInput = {
      userId,
      ...(search && {
        video: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { summary: { summaryText: { contains: search, mode: 'insensitive' } } }
          ]
        }
      }),
      ...(channelId && { video: { channelId } })
    };
    
    const items = await this.prisma.watchLater.findMany({
      where,
      take: limit + 1, // Take one extra to determine if there's a next page
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { savedAt: 'desc' },
      include: {
        video: {
          include: {
            channel: { select: { name: true, iconUrl: true } },
            summary: { select: { summaryText: true } }
          }
        }
      }
    });
    
    const hasNextPage = items.length > limit;
    const resultItems = hasNextPage ? items.slice(0, -1) : items;
    
    return {
      items: resultItems,
      hasNextPage,
      nextCursor: hasNextPage ? resultItems[resultItems.length - 1].id : null
    };
  }
}
```
