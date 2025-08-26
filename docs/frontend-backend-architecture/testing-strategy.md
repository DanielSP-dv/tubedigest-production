# Testing Strategy

## **Frontend Testing**
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

## **End-to-End Testing**
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
