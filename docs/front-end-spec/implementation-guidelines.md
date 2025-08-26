# Implementation Guidelines

## Component Architecture

### Atomic Design Structure
```
src/components/
├── atoms/
│   ├── Button.tsx
│   ├── Icon.tsx
│   ├── Typography.tsx
│   └── Input.tsx
├── molecules/
│   ├── VideoCard.tsx
│   ├── SearchBar.tsx
│   ├── ChapterList.tsx
│   └── SaveButton.tsx
├── organisms/
│   ├── DigestGrid.tsx
│   ├── Navigation.tsx
│   ├── WatchLaterList.tsx
│   └── EmailTemplate.tsx
├── templates/
│   ├── DashboardLayout.tsx
│   ├── DigestEmailLayout.tsx
│   └── AuthLayout.tsx
└── pages/
    ├── Dashboard.tsx
    ├── WatchLater.tsx
    ├── Settings.tsx
    └── ChannelSelection.tsx
```

### Component Props Interface
```typescript
// VideoCard component interface
interface VideoCardProps {
    video: {
        id: string;
        title: string;
        channel: string;
        summaryParagraphs: string[]; // 2-3 paragraphs for richer context
        chapters: Chapter[]; // Full chapter list, UI shows first 10-15 max
        thumbnail: string;
        url: string;
        duration: number;
    };
    onSave: (videoId: string) => void;
    onWatch: (videoId: string) => void;
    isSaved?: boolean;
    variant?: 'email' | 'dashboard' | 'compact';
    maxChaptersShown?: number; // Default 10, max 15
}

// Chapter interface
interface Chapter {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
}
```

## State Management
```typescript
// Global state structure
interface AppState {
    user: {
        id: string;
        email: string;
        timezone: string;
        preferences: UserPreferences;
    };
    digest: {
        latest: DigestData;
        archive: DigestData[];
        loading: boolean;
        error: string | null;
    };
    watchLater: {
        items: WatchLaterItem[];
        loading: boolean;
        filters: FilterState;
    };
    channels: {
        selected: Channel[];
        available: Channel[];
        loading: boolean;
    };
}
```

## Email Template Implementation
```typescript
// Email template generator
export function generateDigestEmail(
    user: User,
    videos: VideoSummary[],
    digestId: string
): string {
    const template = `
        <!DOCTYPE html>
        <html>
        <head>
            ${getEmailHead()}
        </head>
        <body>
            ${getEmailHeader(user, new Date())}
            ${videos.map(video => getVideoCard(video, digestId)).join('')}
            ${getEmailFooter(user)}
        </body>
        </html>
    `;
    
    return minifyHtml(template);
}

function getVideoCard(video: VideoSummary, digestId: string): string {
    return `
        <div class="video-card">
            <div class="video-header">
                <img src="${video.channelIcon}" alt="${video.channelName} icon">
                <span class="channel-name">${video.channelName}</span>
                <span class="publish-time">${formatTime(video.publishedAt)}</span>
            </div>
            
            <h2 class="video-title">${video.title}</h2>
            
            <div class="video-summary">
                ${video.summaryParagraphs.map(paragraph => 
                    `<p>${paragraph}</p>`
                ).join('')}
            </div>
            
            <div class="video-chapters">
                <h3>Chapters${video.chapters.length > 10 ? ` (showing 10 of ${video.chapters.length})` : ''}:</h3>
                <ul>
                    ${video.chapters.slice(0, 10).map(chapter => 
                        `<li>${formatTimestamp(chapter.startTime)} ${chapter.title}</li>`
                    ).join('')}
                    ${video.chapters.length > 10 ? 
                        `<li class="view-all"><a href="${getFullChaptersUrl(video.id)}">View all ${video.chapters.length} chapters ↗</a></li>` 
                        : ''
                    }
                </ul>
            </div>
            
            <div class="video-actions">
                <a href="${video.youtubeUrl}" class="cta-button watch-button">
                    ▶️ Watch on YouTube
                </a>
                <a href="${getSaveUrl(video.id, digestId)}" class="cta-button save-button">
                    ⭐ Save to Watch Later
                </a>
            </div>
        </div>
    `;
}
```

## Testing Strategy

### Visual Regression Testing
```javascript
// Example Playwright test for email template
test('digest email renders correctly', async ({ page }) => {
    await page.goto('/email-preview/latest');
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page).toHaveScreenshot('digest-email-desktop.png');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('digest-email-mobile.png');
    
    // Test dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page).toHaveScreenshot('digest-email-dark.png');
});
```

### Accessibility Testing
```javascript
// Example accessibility test
test('digest page is accessible', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test screen reader content
    const pageTitle = await page.locator('h1').textContent();
    expect(pageTitle).toContain('Digest');
    
    // Test color contrast
    await injectAxe(page);
    const results = await checkA11y(page);
    expect(results.violations).toHaveLength(0);
});
```
