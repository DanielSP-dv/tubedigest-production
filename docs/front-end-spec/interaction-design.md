# Interaction Design

## Micro-Interactions

### Save to Watch Later Animation
```css
@keyframes saveSuccess {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); background-color: var(--success-500); }
}

.save-button.saved {
    animation: saveSuccess 0.3s ease;
}
```

### Loading States
- **Skeleton Screens**: For initial page loads
- **Progressive Loading**: Content appears as it loads
- **Optimistic UI**: Immediate feedback for user actions

### Hover States
- **Video Cards**: Subtle lift with shadow increase
- **Buttons**: Color transition + slight scale
- **Links**: Underline animation

## Gesture Support (Mobile)
- **Swipe to Save**: Swipe right on video cards to save
- **Pull to Refresh**: Refresh latest digest
- **Long Press**: Context menu for additional actions

## Keyboard Navigation
- **Tab Order**: Logical navigation through interface
- **Keyboard Shortcuts**:
  - `S` - Save current item to Watch Later
  - `/` - Focus search
  - `Esc` - Close modals/clear search
  - `Arrow Keys` - Navigate between items
