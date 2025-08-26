# Email Template Design

## Design Priorities
1. **Mobile-First**: 60%+ of email opens are on mobile
2. **Dark Mode Compatible**: Support for dark mode email clients
3. **Client Compatibility**: Works across Gmail, Outlook, Apple Mail, etc.
4. **Loading Speed**: Optimized images and minimal external resources

## Email Template Specifications

### Header Section
- **Brand Recognition**: TubeDigest logo + tagline
- **Date Context**: Clear digest date and timeframe
- **Quick Actions**: Settings and web view links

### Content Cards
- **Visual Hierarchy**: Channel icon → Title → Summary → Chapters → Actions
- **Scannable Format**: Bullet points for chapters with timestamps
- **Clear CTAs**: Distinct buttons for "Watch" vs "Save"
- **Progressive Enhancement**: Fallback text for images

### Responsive Breakpoints
- **Mobile (320-480px)**: Single column, stacked cards
- **Tablet (481-768px)**: Single column, more padding
- **Desktop (768px+)**: Full layout with sidebar potential

## Email HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Daily TubeDigest</title>
    <style>
        /* CSS custom properties from design system */
        :root {
            --primary-500: #667eea;
            --gray-600: #4b5563;
            --space-4: 1rem;
        }
        
        /* Email-specific styles */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .video-card {
            background: #ffffff;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            border: 1px solid #e5e7eb;
        }
        
        .cta-button {
            background-color: var(--primary-500);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            display: inline-block;
            margin: 8px 8px 8px 0;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .video-card {
                background: #1f2937;
                border-color: #374151;
                color: #f9fafb;
            }
        }
    </style>
</head>
<!-- Email body content -->
</html>
```
