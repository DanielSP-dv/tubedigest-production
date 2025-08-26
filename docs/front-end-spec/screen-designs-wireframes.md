# Screen Designs & Wireframes

## 1. Email Digest Template

### Email Header
```
[TubeDigest Logo]     Your Daily Digest - [Date]     [View in Browser]
                                                      [Settings]
```

### Video Card Layout (Email)
```
┌─────────────────────────────────────────────────────────────┐
│ [📺 Channel Icon] Channel Name • 2h ago                      │
│                                                             │
│ Video Title (Truncated if necessary...)                     │
│                                                             │
│ 📝 Summary: This video covers the key concepts of...        │
│    [First paragraph covering main topic and approach]      │
│                                                             │
│    [Second paragraph with key insights and takeaways]      │
│                                                             │
│    [Optional third paragraph for additional context]       │
│                                                             │
│ 🎯 Chapters (showing 8 of 12):                             │
│ • 00:00 Introduction & Overview                             │
│ • 02:15 Problem Statement                                   │
│ • 05:30 Core Concept Explanation                           │
│ • 09:45 First Implementation                                │
│ • 15:45 Advanced Techniques                                 │
│ • 22:10 Common Pitfalls                                     │
│ • 28:30 Best Practices                                      │
│ • 35:20 Conclusion & Next Steps                            │
│ [View all chapters ↗]                                      │
│                                                             │
│ [▶️ Watch on YouTube] [⭐ Save to Watch Later]              │
└─────────────────────────────────────────────────────────────┘
```

### Email Footer
```
───────────────────────────────────────────────────────────────
📊 Today's Digest: 5 videos from 4 channels
🕒 Estimated reading time: 3 minutes

[Manage Channels] [Change Schedule] [Unsubscribe]
TubeDigest • Making YouTube learning efficient
```

## 2. Web Dashboard - Latest Digest View

```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 TubeDigest]   [Latest] [Watch Later] [Search] [Settings] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Today's Digest - August 14, 2025                           │
│ 📊 5 videos • 3 channels • ~2h 15m total content           │
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│ │   Video 1   │ │   Video 2   │ │   Video 3   │           │
│ │[Thumbnail]  │ │[Thumbnail]  │ │[Thumbnail]  │           │
│ │Title...     │ │Title...     │ │Title...     │           │
│ │Channel      │ │Channel      │ │Channel      │           │
│ │[Summary]    │ │[Summary]    │ │[Summary]    │           │
│ │[▶️][⭐]     │ │[▶️][⭐]     │ │[▶️][⭐]     │           │
│ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│ ┌─────────────┐ ┌─────────────┐                           │
│ │   Video 4   │ │   Video 5   │                           │
│ │[Thumbnail]  │ │[Thumbnail]  │                           │
│ │Title...     │ │Title...     │                           │
│ │Channel      │ │Channel      │                           │
│ │[Summary]    │ │[Summary]    │                           │
│ │[▶️][⭐]     │ │[▶️][⭐]     │                           │
│ └─────────────┘ └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## 3. Watch Later Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 TubeDigest]   [Latest] [Watch Later] [Search] [Settings] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Watch Later (12 items)              [🔍 Search saved items] │
│                                                             │
│ Filters: [📅 All Time ▼] [📺 All Channels ▼]               │
│                                                             │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ [Thumbnail] Video Title Here                        [❌] │ │
│ │ 📺 Channel Name • Saved 2 days ago                      │ │
│ │ 📝 Brief summary of the video content...                │ │
│ │ [▶️ Watch] [📋 View Full Summary & Chapters]            │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ [Thumbnail] Another Video Title                     [❌] │ │
│ │ 📺 Different Channel • Saved 1 week ago                 │ │
│ │ 📝 Summary text for this video...                       │ │
│ │ [▶️ Watch] [📋 View Full Summary & Chapters]            │ │
│ └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 4. Channel Selection Screen

```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 TubeDigest]                              Step 2 of 3    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Select Your Channels (up to 10)                            │
│ Choose the channels you'd like to include in your digest   │
│                                                             │
│ [🔍 Search your subscriptions...]                          │
│                                                             │
│ Your Subscriptions:                   Selected: 3/10       │
│                                                             │
│ ┌─────────────────────────────────────┐                    │
│ │ [✅] [📺] Tech Channel Name           │ 📊 ~2 videos/week  │
│ │     Technology & Programming         │                   │
│ └─────────────────────────────────────┘                    │
│                                                             │
│ ┌─────────────────────────────────────┐                    │
│ │ [✅] [📺] Learning Channel            │ 📊 ~1 video/week  │
│ │     Education & Tutorials            │                   │
│ └─────────────────────────────────────┘                    │
│                                                             │
│ ┌─────────────────────────────────────┐                    │
│ │ [✅] [📺] Science Explained           │ 📊 ~3 videos/week  │
│ │     Science & Research               │                   │
│ └─────────────────────────────────────┘                    │
│                                                             │
│ ┌─────────────────────────────────────┐                    │
│ │ [  ] [📺] News Channel               │ 📊 ~5 videos/day  │
│ │     News & Politics                  │                   │
│ └─────────────────────────────────────┘                    │
│                                                             │
│                    [Previous] [Continue]                   │
└─────────────────────────────────────────────────────────────┘
```
