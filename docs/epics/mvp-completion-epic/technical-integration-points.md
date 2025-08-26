# Technical Integration Points

**Frontend Integration:**
- Extend existing React Router setup with new routes
- Enhance current Dashboard component with sidebar
- Add new ChannelSelectionPage component
- Integrate with existing Ant Design component library

**Backend Integration:**
- Extend existing OAuth callback to redirect to channel selection
- Add new API endpoints for channel preferences
- Integrate email service (Nodemailer/SendGrid)
- Enhance existing video feed API with channel filtering

**Database Integration:**
- Add user_channel_selections table for storing preferences
- Extend existing user model with channel preferences
- Add digest_sends table for tracking email delivery

**External Service Integration:**
- YouTube Data API v3 for fetching subscribed channels
- Email service provider (Nodemailer/SendGrid) for digest delivery
- Maintain existing YouTube API integration for video fetching
