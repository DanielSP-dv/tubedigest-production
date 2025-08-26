# Backend API Updates

## **Enhanced API Endpoints for Frontend**

### **Authentication & User Management**
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

### **Enhanced Digest Endpoints**
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

### **Enhanced Watch Later Endpoints**
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

## **Enhanced Data Model for Frontend**

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
