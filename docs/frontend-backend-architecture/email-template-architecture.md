# Email Template Architecture

## **Email-Web Design Consistency**
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
