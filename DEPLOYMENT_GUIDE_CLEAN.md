# 🚀 TubeDigest Deployment Guide

## Backend Deployment to Render.com

### Step 1: Environment Variables
Add these environment variables to your Render.com service:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=file:./dev.db
REDIS_HOST=localhost
REDIS_PORT=6379
BREVO_API_KEY=your-brevo-api-key-here
SMTP_FROM=digest@tubedigest.com
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
RESEND_API_KEY=your-resend-api-key-here
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
APP_URL=https://frontend-rho-topaz-86.vercel.app
FRONTEND_URL=https://frontend-rho-topaz-86.vercel.app
YOUTUBE_API_KEY=your-youtube-api-key-here
YOUTUBE_API_QUOTA_LIMIT=10000
YOUTUBE_API_QUOTA_RESET_HOURS=24
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=https://frontend-rho-topaz-86.vercel.app/auth/google/callback
TOKEN_ENC_KEY=your-32-byte-hex-encryption-key-here
SESSION_SECRET_KEY=your-64-byte-hex-session-secret-key-here
OPENAI_API_KEY=your-openai-api-key-here
AI_MODEL=gpt-4
AI_MAX_TOKENS=1000
SEARCHAPI_KEY=your-searchapi-key-here
```

### Step 2: Build and Start Commands
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Step 3: Update Frontend Configuration
After backend deployment, update `frontend/vercel.json` with the new backend URL.

## Frontend: https://frontend-rho-topaz-86.vercel.app
