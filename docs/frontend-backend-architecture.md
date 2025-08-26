# TubeDigest Frontend-Backend Architecture

*Created by: Architect*  
*Date: August 14, 2025*  
*Version: 2.0 - Incorporating UX Specification & Component Library*

## Executive Summary

This architecture integrates the existing NestJS backend with a React frontend using Ant Design, optimizing for the **email-first, dashboard-supporting** user experience defined in the Front End Specification.

**Key Architectural Decisions:**
- **Frontend Stack**: React + Ant Design + TypeScript
- **Backend Stack**: NestJS + Postgres + Redis (unchanged)
- **Integration Pattern**: REST APIs with JWT authentication
- **Deployment**: Separate frontend/backend deployments with shared domain
- **Email Strategy**: Custom HTML/CSS templates with Ant Design visual language

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Tier"
        A[Email Clients] 
        B[Web Browser - React App]
    end
    
    subgraph "Frontend Tier"
        C[React + Ant Design]
        D[Email Templates - HTML/CSS]
        E[Static Asset CDN]
    end
    
    subgraph "Backend Tier - NestJS"
        F[API Gateway/Routes]
        G[Auth Module]
        H[Digest Module]
        I[Video Module]
        J[Watch Later Module]
        K[Jobs Module]
    end
    
    subgraph "Data Tier"
        L[Postgres DB]
        M[Redis Cache/Queue]
    end
    
    subgraph "External Services"
        N[YouTube Data API]
        O[Email Provider]
        P[LLM Provider]
    end
    
    A --> D
    B --> C
    C --> F
    D --> O
    F --> G
    F --> H
    F --> I
    F --> J
    G --> L
    H --> L
    H --> M
    I --> N
    J --> L
    K --> M
    O --> A
    K --> P
    
    style C fill:#1890ff,color:#fff
    style D fill:#52c41a,color:#fff
    style F fill:#fa8c16,color:#fff
```

## Frontend Architecture

### **Technology Stack**
```json
{
  "framework": "React 18+",
  "uiLibrary": "Ant Design 5.x",
  "language": "TypeScript",
  "bundler": "Vite",
  "stateManagement": "React Query + Zustand",
  "routing": "React Router v6",
  "testing": "Jest + React Testing Library",
  "styling": "CSS Modules + Ant Design tokens"
}
```

### **Project Structure**
```
frontend/
├── src/
│   ├── components/
│   │   ├── atoms/           # Basic Ant Design wrappers
│   │   ├── molecules/       # Video cards, search bars
│   │   ├── organisms/       # Digest grids, navigation
│   │   └── templates/       # Page layouts
│   ├── pages/
│   │   ├── Dashboard.tsx    # Latest digest view
│   │   ├── WatchLater.tsx   # Saved videos
│   │   ├── Settings.tsx     # User preferences
│   │   └── Auth/            # OAuth flow
│   ├── hooks/
│   │   ├── useAuth.ts       # Authentication state
│   │   ├── useDigest.ts     # Digest data fetching
│   │   └── useWatchLater.ts # Watch later management
│   ├── services/
│   │   ├── api.ts           # API client configuration
│   │   ├── auth.ts          # Auth service
│   │   └── types.ts         # TypeScript interfaces
│   ├── styles/
│   │   ├── antd-theme.ts    # Ant Design customization
│   │   └── globals.css      # Global styles
│   └── utils/
│       ├── formatters.ts    # Date, time formatting
│       └── constants.ts     # App constants
├── public/
│   ├── index.html
│   └── favicon.ico
└── package.json
```

### **Component Architecture with Ant Design**

#### **Core Components Mapping**
```typescript
// VideoCard - Primary content component
interface VideoCardProps {
  video: {
    id: string;
    title: string;
    channelName: string;
    summaryParagraphs: string[];
    chapters: Chapter[];
    thumbnail: string;
    duration: number;
    publishedAt: string;
  };
  onSave: (videoId: string) => Promise<void>;
  onWatch: (videoUrl: string) => void;
  isSaved?: boolean;
  layout?: 'grid' | 'list' | 'email';
}

// Using Ant Design Card as base
const VideoCard: React.FC<VideoCardProps> = ({ video, onSave, onWatch, isSaved, layout = 'grid' }) => {
  return (
    <Card
      hoverable
      cover={<img alt={video.title} src={video.thumbnail} />}
      actions={[
        <Button 
          type="primary" 
          icon={<PlayCircleOutlined />}
          onClick={() => onWatch(video.youtubeUrl)}
        >
          Watch
        </Button>,
        <Button 
          icon={isSaved ? <StarFilled /> : <StarOutlined />}
          onClick={() => onSave(video.id)}
          loading={savingState === video.id}
        >
          {isSaved ? 'Saved' : 'Save'}
        </Button>
      ]}
    >
      <Card.Meta
        title={video.title}
        description={
          <div className="video-content">
            <div className="channel-info">
              <Text type="secondary">{video.channelName}</Text>
              <Text type="secondary"> • {formatTimeAgo(video.publishedAt)}</Text>
            </div>
            
            <div className="summary">
              {video.summaryParagraphs.map((paragraph, index) => (
                <Paragraph key={index}>{paragraph}</Paragraph>
              ))}
            </div>
            
            <Collapse ghost>
              <Panel header={`Chapters (${video.chapters.length})`} key="1">
                <List
                  size="small"
                  dataSource={video.chapters.slice(0, 10)}
                  renderItem={(chapter) => (
                    <List.Item>
                      <Text code>{formatTimestamp(chapter.startTime)}</Text>
                      <Text>{chapter.title}</Text>
                    </List.Item>
                  )}
                />
                {video.chapters.length > 10 && (
                  <Button type="link">View all {video.chapters.length} chapters</Button>
                )}
              </Panel>
            </Collapse>
          </div>
        }
      />
    </Card>
  );
};
```

#### **Dashboard Layout**
```typescript
// Main dashboard using Ant Design Layout
const DashboardLayout: React.FC = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header>
        <div className="logo">
          <img src="/logo.svg" alt="TubeDigest" />
        </div>
        <Menu mode="horizontal" defaultSelectedKeys={['latest']}>
          <Menu.Item key="latest" icon={<MailOutlined />}>
            Latest Digest
          </Menu.Item>
          <Menu.Item key="watchlater" icon={<StarOutlined />}>
            Watch Later
          </Menu.Item>
          <Menu.Item key="search" icon={<SearchOutlined />}>
            Search
          </Menu.Item>
          <Menu.Item key="settings" icon={<SettingOutlined />}>
            Settings
          </Menu.Item>
        </Menu>
        <UserMenu />
      </Layout.Header>
      
      <Layout.Content style={{ padding: '24px', margin: 0 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </Layout.Content>
    </Layout>
  );
};

// Latest Digest View
const LatestDigestPage: React.FC = () => {
  const { data: digest, isLoading } = useQuery(['digest', 'latest'], getLatestDigest);
  
  if (isLoading) return <Skeleton active />;
  
  return (
    <div>
      <PageHeader
        title={`Today's Digest - ${format(new Date(), 'MMMM do, yyyy')}`}
        subTitle={`${digest.items.length} videos from ${digest.channelCount} channels`}
      />
      
      <Row gutter={[16, 16]}>
        {digest.items.map((video) => (
          <Col xs={24} sm={12} lg={8} key={video.id}>
            <VideoCard
              video={video}
              onSave={saveToWatchLater}
              onWatch={openYouTubeVideo}
              isSaved={watchLaterIds.includes(video.id)}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};
```

## Backend API Updates

### **Enhanced API Endpoints for Frontend**

#### **Authentication & User Management**
```typescript
// Enhanced auth endpoints
@Controller('auth')
export class AuthController {
  // Existing OAuth endpoints remain the same
  
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req): Promise<UserProfileDto> {
    return {
      id: req.user.id,
      email: req.user.email,
      timezone: req.user.timezone,
      preferences: {
        digestCadence: req.user.digestCadence,
        digestTime: req.user.digestTime,
        selectedChannels: req.user.selectedChannels
      }
    };
  }
  
  @Patch('me/preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(
    @Request() req, 
    @Body() preferences: UpdatePreferencesDto
  ): Promise<UserProfileDto> {
    // Update user preferences
  }
}
```

#### **Enhanced Digest Endpoints**
```typescript
@Controller('digests')
export class DigestsController {
  @Get('latest')
  @UseGuards(JwtAuthGuard)
  async getLatestDigest(@Request() req): Promise<DigestResponseDto> {
    const digest = await this.digestsService.getLatestDigest(req.user.id);
    return {
      id: digest.id,
      date: digest.scheduledFor,
      items: digest.items.map(item => ({
        id: item.video.id,
        title: item.video.title,
        channelName: item.video.channel.name,
        channelIcon: item.video.channel.iconUrl,
        summaryParagraphs: JSON.parse(item.video.summary.summaryText),
        chapters: item.video.chapters.map(ch => ({
          id: ch.id,
          title: ch.title,
          startTime: ch.startS,
          endTime: ch.endS
        })),
        thumbnail: item.video.thumbnailUrl,
        duration: item.video.durationS,
        publishedAt: item.video.publishedAt,
        youtubeUrl: item.video.url
      })),
      channelCount: new Set(digest.items.map(item => item.video.channelId)).size,
      totalDuration: digest.items.reduce((sum, item) => sum + item.video.durationS, 0)
    };
  }
  
  @Get('archive')
  @UseGuards(JwtAuthGuard)
  async getDigestArchive(
    @Request() req,
    @Query() query: PaginationDto
  ): Promise<DigestArchiveDto> {
    // Return paginated digest history
  }
  
  @Get(':id/web-view')
  async getDigestWebView(
    @Param('id') digestId: string,
    @Query('token') token: string
  ): Promise<DigestWebViewDto> {
    // Verify signed token and return digest for web view
    const isValid = this.digestsService.verifyDigestToken(digestId, token);
    if (!isValid) throw new UnauthorizedException();
    
    return this.digestsService.getDigestWebView(digestId);
  }
}
```

#### **Enhanced Watch Later Endpoints**
```typescript
@Controller('watch-later')
export class WatchLaterController {
  @Post()
  @UseGuards(JwtAuthGuard)
  async saveToWatchLater(
    @Request() req,
    @Body() body: { videoId: string; digestId?: string }
  ): Promise<WatchLaterItemDto> {
    return this.watchLaterService.saveItem(req.user.id, body.videoId, body.digestId);
  }
  
  @Get()
  @UseGuards(JwtAuthGuard)
  async getWatchLaterItems(
    @Request() req,
    @Query() query: WatchLaterQueryDto
  ): Promise<WatchLaterListDto> {
    const { search, channelId, dateFrom, dateTo, page = 1, limit = 20 } = query;
    
    return this.watchLaterService.getItems(req.user.id, {
      search,
      channelId,
      dateFrom,
      dateTo,
      pagination: { page, limit }
    });
  }
  
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async removeFromWatchLater(
    @Request() req,
    @Param('id') itemId: string
  ): Promise<void> {
    await this.watchLaterService.removeItem(req.user.id, itemId);
  }
  
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getWatchLaterStats(@Request() req): Promise<WatchLaterStatsDto> {
    return {
      totalItems: await this.watchLaterService.getItemCount(req.user.id),
      byChannel: await this.watchLaterService.getItemsByChannel(req.user.id),
      byMonth: await this.watchLaterService.getItemsByMonth(req.user.id)
    };
  }
}
```

### **Enhanced Data Model for Frontend**

```sql
-- Enhanced schema for frontend needs
-- Add indexes for frontend queries
CREATE INDEX idx_watch_later_user_created ON watch_later(user_id, saved_at DESC);
CREATE INDEX idx_videos_published ON videos(published_at DESC);
CREATE INDEX idx_digest_items_position ON digest_items(digest_run_id, position);

-- Add full-text search support
CREATE INDEX idx_videos_search ON videos USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_summaries_search ON summaries USING gin(to_tsvector('english', summary_text));

-- Add user preferences table for frontend settings
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  theme VARCHAR(10) DEFAULT 'light',
  digest_email_enabled BOOLEAN DEFAULT true,
  browser_notifications BOOLEAN DEFAULT false,
  compact_view BOOLEAN DEFAULT false,
  items_per_page INTEGER DEFAULT 20,
  default_video_sort VARCHAR(20) DEFAULT 'newest',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add digest web view tokens
CREATE TABLE digest_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_run_id UUID REFERENCES digest_runs(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Email Template Architecture

### **Email-Web Design Consistency**
```typescript
// Shared design tokens between web and email
export const EmailDesignTokens = {
  colors: {
    primary: '#1890ff',     // Matches Ant Design primary
    secondary: '#8c8c8c',   // Ant Design text-secondary
    success: '#52c41a',     // Ant Design success
    background: '#ffffff',
    border: '#f0f0f0'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    heading: { fontSize: '20px', fontWeight: '600', lineHeight: '28px' },
    body: { fontSize: '14px', fontWeight: '400', lineHeight: '22px' },
    small: { fontSize: '12px', fontWeight: '400', lineHeight: '20px' }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: '6px'
};

// Email template service
@Injectable()
export class EmailTemplateService {
  generateDigestEmail(user: User, digest: DigestRun): string {
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your TubeDigest - ${format(digest.scheduledFor, 'MMMM do, yyyy')}</title>
        <style>${this.getEmailStyles()}</style>
      </head>
      <body>
        <div class="email-container">
          ${this.generateHeader(user, digest)}
          ${digest.items.map(item => this.generateVideoCard(item, digest.id)).join('')}
          ${this.generateFooter(user, digest)}
        </div>
      </body>
      </html>
    `;
    
    return this.minifyHtml(template);
  }
  
  private generateVideoCard(item: DigestItem, digestId: string): string {
    const video = item.video;
    const summary = JSON.parse(video.summary.summaryText);
    
    return `
      <div class="video-card">
        <div class="video-header">
          <img src="${video.channel.iconUrl}" alt="${video.channel.name}" class="channel-icon">
          <span class="channel-name">${video.channel.name}</span>
          <span class="publish-time">${formatTimeAgo(video.publishedAt)}</span>
        </div>
        
        <h2 class="video-title">${video.title}</h2>
        
        <div class="video-summary">
          ${summary.map(paragraph => `<p>${paragraph}</p>`).join('')}
        </div>
        
        <div class="video-chapters">
          <h3>Chapters${video.chapters.length > 10 ? ` (showing 10 of ${video.chapters.length})` : ''}:</h3>
          <ul class="chapters-list">
            ${video.chapters.slice(0, 10).map(chapter => `
              <li>
                <span class="timestamp">${formatTimestamp(chapter.startS)}</span>
                <span class="chapter-title">${chapter.title}</span>
              </li>
            `).join('')}
            ${video.chapters.length > 10 ? `
              <li class="view-all">
                <a href="${this.getWebViewUrl(digestId)}#video-${video.id}">
                  View all ${video.chapters.length} chapters ↗
                </a>
              </li>
            ` : ''}
          </ul>
        </div>
        
        <div class="video-actions">
          <a href="${video.url}" class="btn btn-primary">
            ▶️ Watch on YouTube
          </a>
          <a href="${this.getSaveToWatchLaterUrl(video.id, digestId)}" class="btn btn-secondary">
            ⭐ Save to Watch Later
          </a>
        </div>
      </div>
    `;
  }
}
```

## State Management Architecture

### **React Query + Zustand Pattern**
```typescript
// API layer with React Query
export const digestQueries = {
  latest: () => ({
    queryKey: ['digest', 'latest'],
    queryFn: () => api.get('/digests/latest').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  }),
  
  archive: (page: number, limit: number) => ({
    queryKey: ['digest', 'archive', page, limit],
    queryFn: () => api.get(`/digests/archive?page=${page}&limit=${limit}`).then(res => res.data),
  }),
};

export const watchLaterQueries = {
  list: (filters: WatchLaterFilters) => ({
    queryKey: ['watchLater', 'list', filters],
    queryFn: () => api.get('/watch-later', { params: filters }).then(res => res.data),
  }),
  
  stats: () => ({
    queryKey: ['watchLater', 'stats'],
    queryFn: () => api.get('/watch-later/stats').then(res => res.data),
  }),
};

// Global state with Zustand
interface AppStore {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  
  // UI state
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  setUser: (user: User | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  isAuthenticated: false,
  sidebarCollapsed: false,
  theme: 'light',
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
}));

// Custom hooks for data fetching
export function useLatestDigest() {
  return useQuery(digestQueries.latest());
}

export function useWatchLater(filters: WatchLaterFilters = {}) {
  return useQuery(watchLaterQueries.list(filters));
}

export function useSaveToWatchLater() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (videoId: string) => api.post('/watch-later', { videoId }),
    onSuccess: () => {
      // Invalidate watch later queries
      queryClient.invalidateQueries(['watchLater']);
      
      // Show success notification
      notification.success({
        message: 'Saved to Watch Later',
        description: 'Video has been added to your Watch Later list',
        duration: 3,
      });
    },
    onError: (error) => {
      notification.error({
        message: 'Failed to save',
        description: 'Could not add video to Watch Later. Please try again.',
      });
    },
  });
}
```

## Performance & Optimization

### **Frontend Performance Strategy**
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

### **API Optimization**
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

## Security Architecture

### **Frontend Security**
```typescript
// JWT token management
class TokenManager {
  private static readonly TOKEN_KEY = 'tubedigest_token';
  private static readonly REFRESH_KEY = 'tubedigest_refresh';
  
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  static setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_KEY, refreshToken);
  }
  
  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }
  
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

// API client with automatic token refresh
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

api.interceptors.request.use((config) => {
  const token = TokenManager.getToken();
  if (token && !TokenManager.isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('tubedigest_refresh');
      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;
          TokenManager.setTokens(token, newRefreshToken);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${token}`;
          return axios.request(error.config);
        } catch (refreshError) {
          TokenManager.clearTokens();
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### **Email Security**
```typescript
// Signed URLs for email actions
@Injectable()
export class EmailSecurityService {
  constructor(private readonly configService: ConfigService) {}
  
  generateSaveToWatchLaterUrl(videoId: string, digestId: string, userId: string): string {
    const payload = {
      action: 'save_to_watch_later',
      videoId,
      digestId,
      userId,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    };
    
    const token = jwt.sign(payload, this.configService.get('JWT_SECRET'));
    return `${this.configService.get('FRONTEND_URL')}/api/email-actions/save?token=${token}`;
  }
  
  generateWebViewUrl(digestId: string): string {
    const token = jwt.sign(
      { digestId, exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) }, // 30 days
      this.configService.get('JWT_SECRET')
    );
    return `${this.configService.get('FRONTEND_URL')}/digest/${digestId}?token=${token}`;
  }
  
  @Post('email-actions/save')
  async handleSaveFromEmail(@Query('token') token: string): Promise<{ success: boolean }> {
    try {
      const payload = jwt.verify(token, this.configService.get('JWT_SECRET')) as any;
      
      if (payload.action !== 'save_to_watch_later') {
        throw new UnauthorizedException('Invalid action');
      }
      
      await this.watchLaterService.saveItem(payload.userId, payload.videoId, payload.digestId);
      
      return { success: true };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
```

## Deployment Architecture

### **Deployment Strategy**
```yaml
# docker-compose.yml for local development
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:4000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
  
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/tubedigest
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key
      - FRONTEND_URL=http://localhost:3000
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=tubedigest
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### **Production Deployment**
```yaml
# Production considerations
Production Stack:
  Frontend:
    - Platform: Vercel/Netlify
    - CDN: Cloudflare
    - Domain: app.tubedigest.com
    
  Backend:
    - Platform: Railway/Heroku/Docker
    - Database: Managed Postgres (Supabase/RDS)
    - Cache: Managed Redis (Upstash/ElastiCache)
    - Workers: Background job processing
    
  Monitoring:
    - Frontend: Vercel Analytics + Sentry
    - Backend: Prometheus + Grafana
    - Logs: Structured JSON logging
    
  CI/CD:
    - GitHub Actions
    - Automated testing
    - Staged deployments
```

## Testing Strategy

### **Frontend Testing**
```typescript
// Component testing with React Testing Library
describe('VideoCard', () => {
  const mockVideo = {
    id: '1',
    title: 'Test Video',
    channelName: 'Test Channel',
    summaryParagraphs: ['First paragraph', 'Second paragraph'],
    chapters: [
      { id: '1', title: 'Introduction', startTime: 0, endTime: 30 }
    ],
    thumbnail: 'test.jpg',
    duration: 300,
    publishedAt: '2025-01-01T00:00:00Z',
    youtubeUrl: 'https://youtube.com/watch?v=test'
  };
  
  it('renders video information correctly', () => {
    render(
      <VideoCard
        video={mockVideo}
        onSave={jest.fn()}
        onWatch={jest.fn()}
        isSaved={false}
      />
    );
    
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('Test Channel')).toBeInTheDocument();
    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByText('Introduction')).toBeInTheDocument();
  });
  
  it('calls onSave when save button is clicked', () => {
    const onSave = jest.fn();
    render(
      <VideoCard
        video={mockVideo}
        onSave={onSave}
        onWatch={jest.fn()}
        isSaved={false}
      />
    );
    
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('1');
  });
});

// Integration testing with MSW
const server = setupServer(
  rest.get('/api/digests/latest', (req, res, ctx) => {
    return res(ctx.json(mockDigestResponse));
  }),
  
  rest.post('/api/watch-later', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### **End-to-End Testing**
```typescript
// Playwright E2E tests
test('complete user flow: view digest and save video', async ({ page }) => {
  // Mock API responses
  await page.route('/api/digests/latest', route => {
    route.fulfill({ json: mockDigestData });
  });
  
  // Navigate to dashboard
  await page.goto('/dashboard');
  
  // Verify digest loads
  await expect(page.locator('h1')).toContainText('Today\'s Digest');
  
  // Click save on first video
  await page.locator('.video-card').first().locator('button:has-text("Save")').click();
  
  // Verify success notification
  await expect(page.locator('.ant-notification')).toContainText('Saved to Watch Later');
  
  // Navigate to Watch Later
  await page.click('text=Watch Later');
  
  // Verify video appears in Watch Later
  await expect(page.locator('.watch-later-item')).toBeVisible();
});

test('email template renders correctly', async ({ page }) => {
  await page.goto('/email-preview/latest');
  
  // Test responsive breakpoints
  await page.setViewportSize({ width: 375, height: 667 }); // Mobile
  await expect(page.locator('.video-card')).toBeVisible();
  
  await page.setViewportSize({ width: 1200, height: 800 }); // Desktop
  await expect(page.locator('.video-card')).toBeVisible();
});
```

## Migration & Rollout Plan

### **Phase 1: Foundation (Week 1-2)**
1. **Setup React application** with Ant Design
2. **Implement authentication** flow with existing backend
3. **Create basic components** (VideoCard, Layout, Navigation)
4. **Setup API integration** with React Query

### **Phase 2: Core Features (Week 3-4)**
1. **Latest Digest view** with video cards
2. **Watch Later functionality** with save/remove
3. **Search and filtering** capabilities
4. **Email template implementation** with custom HTML/CSS

### **Phase 3: Enhancement (Week 5-6)**
1. **Responsive optimization** for mobile devices
2. **Performance optimization** (code splitting, lazy loading)
3. **Testing implementation** (unit, integration, E2E)
4. **Email client testing** across different providers

### **Phase 4: Production (Week 7-8)**
1. **Security audit** and penetration testing
2. **Performance monitoring** setup
3. **Deployment pipeline** configuration
4. **User acceptance testing** and feedback

## Success Metrics & Monitoring

### **Frontend Performance Metrics**
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle Size**: Initial load < 500KB gzipped
- **Time to Interactive**: < 3s on 3G connection
- **Error Rate**: < 0.1% of page loads

### **User Experience Metrics**
- **Email Click-through Rate**: Target > 25%
- **Save-to-Watch-Later Rate**: Target > 15% of viewed videos
- **Session Duration**: Average > 5 minutes
- **Return Visit Rate**: > 60% weekly retention

### **Technical Metrics**
- **API Response Times**: 95th percentile < 500ms
- **Database Query Performance**: All queries < 100ms
- **Background Job Success Rate**: > 99.5%
- **Email Delivery Rate**: > 98%

---

## Conclusion

This architecture provides a solid foundation for the TubeDigest frontend while maintaining the robust backend system already designed. The integration of Ant Design with custom email templates ensures consistency across email and web experiences while optimizing for the "scan and decide" user workflow.

The architecture is designed to:
- **Scale efficiently** with user growth
- **Maintain performance** across devices and email clients
- **Support future enhancements** like Notion-style organization
- **Provide excellent developer experience** with TypeScript and modern tooling

**Next Steps**: Proceed to PO validation of all artifacts, then begin development phase with the Scrum Master and Development team.

*This architecture is ready for implementation and aligns with all PRD requirements and UX specifications.*
