# Accessibility Requirements

## WCAG 2.1 AA Compliance

### Color & Contrast
- **Minimum Contrast**: 4.5:1 for normal text
- **Large Text**: 3:1 for 18px+ text
- **Color Independence**: Information not conveyed by color alone

### Focus Management
- **Visible Focus**: All interactive elements have clear focus indicators
- **Focus Order**: Logical tab sequence
- **Focus Trapping**: Modals trap focus appropriately

### Screen Reader Support
```html
<!-- Semantic HTML Structure -->
<main role="main" aria-label="Digest content">
    <section aria-labelledby="digest-heading">
        <h1 id="digest-heading">Today's Digest - August 14, 2025</h1>
        
        <article aria-labelledby="video-1-title">
            <h2 id="video-1-title">Video Title</h2>
            <p aria-label="Video summary">Summary content...</p>
            
            <button aria-label="Save 'Video Title' to Watch Later">
                <span aria-hidden="true">⭐</span>
                Save to Watch Later
            </button>
        </article>
    </section>
</main>

<!-- Live regions for dynamic updates -->
<div aria-live="polite" aria-atomic="true" id="save-notifications"></div>
```

### Image Alternative Text
- **Thumbnails**: "Video thumbnail for [Video Title] by [Channel Name]"
- **Icons**: Descriptive text or aria-hidden when decorative
- **Charts/Graphics**: Detailed alt text or data tables

## Keyboard Accessibility
```javascript
// Example: Keyboard navigation for video cards
function handleKeyNavigation(event) {
    const currentCard = event.target.closest('.video-card');
    const allCards = document.querySelectorAll('.video-card');
    const currentIndex = Array.from(allCards).indexOf(currentCard);
    
    switch(event.key) {
        case 'ArrowDown':
            focusCard(currentIndex + 1);
            event.preventDefault();
            break;
        case 'ArrowUp':
            focusCard(currentIndex - 1);
            event.preventDefault();
            break;
        case 'Enter':
        case ' ':
            handleCardAction(currentCard);
            event.preventDefault();
            break;
    }
}
```
