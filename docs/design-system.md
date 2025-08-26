# TubeDigest Design System

## Overview
This document defines the design system for the TubeDigest web interface, ensuring consistency, accessibility, and modern user experience across all components.

## Brand Identity

### Logo & Branding
- **Primary Logo**: TubeDigest with video/play icon
- **Tagline**: "Your YouTube content, curated and summarized"
- **Brand Voice**: Professional, helpful, and engaging

## Color Palette

### Primary Colors
```css
/* Primary Brand Colors */
--primary-500: #667eea;     /* Main brand color - Purple Blue */
--primary-600: #5a67d8;     /* Darker shade for hover states */
--primary-400: #7c3aed;     /* Lighter shade for backgrounds */
--primary-700: #4c51bf;     /* Darkest for text on light backgrounds */

/* Secondary Colors */
--secondary-500: #764ba2;   /* Complementary purple */
--secondary-600: #6b46c1;   /* Darker secondary */
--secondary-400: #8b5cf6;   /* Lighter secondary */
```

### Neutral Colors
```css
/* Neutral Grays */
--gray-50: #f9fafb;         /* Lightest background */
--gray-100: #f3f4f6;        /* Light background */
--gray-200: #e5e7eb;        /* Border color */
--gray-300: #d1d5db;        /* Disabled text */
--gray-400: #9ca3af;        /* Placeholder text */
--gray-500: #6b7280;        /* Body text */
--gray-600: #4b5563;        /* Heading text */
--gray-700: #374151;        /* Dark text */
--gray-800: #1f2937;        /* Darkest text */
--gray-900: #111827;        /* Background dark mode */
```

### Semantic Colors
```css
/* Success Colors */
--success-500: #10b981;     /* Green for success states */
--success-100: #d1fae5;     /* Light success background */

/* Warning Colors */
--warning-500: #f59e0b;     /* Orange for warnings */
--warning-100: #fef3c7;     /* Light warning background */

/* Error Colors */
--error-500: #ef4444;       /* Red for errors */
--error-100: #fee2e2;       /* Light error background */

/* Info Colors */
--info-500: #3b82f6;        /* Blue for information */
--info-100: #dbeafe;        /* Light info background */
```

## Typography

### Font Stack
```css
/* Primary Font */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace Font */
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

### Font Sizes
```css
/* Heading Scale */
--text-xs: 0.75rem;         /* 12px */
--text-sm: 0.875rem;        /* 14px */
--text-base: 1rem;          /* 16px */
--text-lg: 1.125rem;        /* 18px */
--text-xl: 1.25rem;         /* 20px */
--text-2xl: 1.5rem;         /* 24px */
--text-3xl: 1.875rem;       /* 30px */
--text-4xl: 2.25rem;        /* 36px */
--text-5xl: 3rem;           /* 48px */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System

### Base Spacing Unit
```css
--space-1: 0.25rem;         /* 4px */
--space-2: 0.5rem;          /* 8px */
--space-3: 0.75rem;         /* 12px */
--space-4: 1rem;            /* 16px */
--space-5: 1.25rem;         /* 20px */
--space-6: 1.5rem;          /* 24px */
--space-8: 2rem;            /* 32px */
--space-10: 2.5rem;         /* 40px */
--space-12: 3rem;           /* 48px */
--space-16: 4rem;           /* 64px */
--space-20: 5rem;           /* 80px */
--space-24: 6rem;           /* 96px */
```

## Border Radius
```css
--radius-sm: 0.25rem;       /* 4px */
--radius-md: 0.375rem;      /* 6px */
--radius-lg: 0.5rem;        /* 8px */
--radius-xl: 0.75rem;       /* 12px */
--radius-2xl: 1rem;         /* 16px */
--radius-full: 9999px;      /* Full circle */
```

## Shadows
```css
/* Elevation System */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

## Component Library

### Buttons
```css
/* Primary Button */
.btn-primary {
  background-color: var(--primary-500);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Secondary Button */
.btn-secondary {
  background-color: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-200);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--gray-200);
  border-color: var(--gray-300);
}
```

### Cards
```css
/* Video Card */
.video-card {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  transition: all 0.2s ease;
  border: 1px solid var(--gray-200);
}

.video-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* Digest Card */
.digest-card {
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--secondary-500) 100%);
  color: white;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
}
```

### Forms
```css
/* Input Fields */
.input {
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgb(102 126 234 / 0.1);
}

/* Search Bar */
.search-bar {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-full);
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
  width: 100%;
  max-width: 400px;
}
```

## Layout System

### Grid System
```css
/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

/* Grid */
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

/* Responsive Grid */
@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}
```

### Flexbox Utilities
```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-4 { gap: var(--space-4); }
.gap-6 { gap: var(--space-6); }
```

## Accessibility Guidelines

### Color Contrast
- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text (18px+)
- Use semantic colors for status indicators

### Focus States
- All interactive elements must have visible focus indicators
- Focus ring color: `var(--primary-500)`
- Focus ring offset: `2px`

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Logical tab order
- Skip links for main content

### Screen Reader Support
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for images
- ARIA labels for complex components
- Semantic HTML elements

## Animation Guidelines

### Transitions
```css
/* Standard Transition */
.transition {
  transition: all 0.2s ease;
}

/* Fast Transition */
.transition-fast {
  transition: all 0.1s ease;
}

/* Slow Transition */
.transition-slow {
  transition: all 0.3s ease;
}
```

### Hover Effects
- Subtle scale transforms (1.02x - 1.05x)
- Shadow elevation changes
- Color transitions
- Smooth easing functions

## Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
/* Base styles for mobile */

/* Tablet */
@media (min-width: 768px) {
  /* Tablet styles */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Desktop styles */
}

/* Large Desktop */
@media (min-width: 1280px) {
  /* Large desktop styles */
}
```

### Mobile Considerations
- Touch targets minimum 44px
- Adequate spacing between interactive elements
- Simplified navigation for mobile
- Optimized images and assets

## Performance Guidelines

### Loading States
- Skeleton screens for content loading
- Progressive image loading
- Lazy loading for below-the-fold content
- Optimistic UI updates

### Asset Optimization
- Compressed images (WebP format preferred)
- Minified CSS and JavaScript
- Critical CSS inlined
- Non-critical CSS loaded asynchronously

## Implementation Notes

### CSS Custom Properties
All design tokens are defined as CSS custom properties for easy theming and maintenance.

### Component Architecture
- Atomic design principles
- Reusable components
- Consistent prop interfaces
- Comprehensive documentation

### Testing
- Visual regression testing
- Accessibility testing
- Cross-browser compatibility
- Performance testing

This design system ensures a consistent, accessible, and modern user experience across the TubeDigest web interface.
