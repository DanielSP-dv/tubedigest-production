# Performance Considerations

## Core Web Vitals Targets
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

## Optimization Strategies

### Image Optimization
```html
<!-- Responsive images with WebP support -->
<picture>
    <source srcset="thumbnail-400.webp 400w, thumbnail-800.webp 800w" 
            type="image/webp">
    <img src="thumbnail-400.jpg" 
         srcset="thumbnail-400.jpg 400w, thumbnail-800.jpg 800w"
         sizes="(max-width: 768px) 100vw, 33vw"
         alt="Video thumbnail for [Title]"
         loading="lazy">
</picture>
```

### Code Splitting
```javascript
// Lazy load dashboard components
const WatchLaterPage = lazy(() => import('./pages/WatchLaterPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

// Route-based code splitting
function App() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                <Route path="/watch-later" element={<WatchLaterPage />} />
                <Route path="/search" element={<SearchPage />} />
            </Routes>
        </Suspense>
    );
}
```

### Caching Strategy
- **Static Assets**: Long-term caching with versioning
- **API Responses**: Short-term caching for digest data
- **Images**: CDN with automatic optimization
- **Service Worker**: Cache critical resources offline

## Email Performance
- **Image Optimization**: Compressed thumbnails < 50KB each
- **Minimal CSS**: Inline critical styles only
- **Fallback Content**: Text-only version for slow connections
- **External Resources**: Minimal external dependencies
