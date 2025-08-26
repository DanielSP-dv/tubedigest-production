# 🚀 TubeDigest Deployment Guide

## 🎉 Frontend Successfully Deployed!

Your TubeDigest frontend is now live at:
**https://frontend-k74mvkve8-daniels-projects-8eaaf3eb.vercel.app**

## 🔧 Backend Deployment Options

### Option 1: Railway (Recommended - Free Tier)

1. **Sign up at Railway**: https://railway.app
2. **Connect your GitHub repository**
3. **Create a new project** and select your TubeDigest repository
4. **Add environment variables** from your `.env` file:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=file:./dev.db
   REDIS_HOST=localhost
   REDIS_PORT=6379
   APP_URL=https://frontend-k74mvkve8-daniels-projects-8eaaf3eb.vercel.app
   FRONTEND_URL=https://frontend-k74mvkve8-daniels-projects-8eaaf3eb.vercel.app
   GOOGLE_REDIRECT_URI=https://frontend-k74mvkve8-daniels-projects-8eaaf3eb.vercel.app/auth/google/callback
   ```
5. **Deploy!** Railway will automatically detect the Node.js app and deploy it

### Option 2: Render (Alternative - Free Tier)

1. **Sign up at Render**: https://render.com
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Configure the service**:
   - **Name**: `tubedigest-backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. **Add environment variables** (same as above)
6. **Deploy!**

## 🔗 Update Frontend Configuration

After deploying the backend, update the `frontend/vercel.json` file with your backend URL:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend-url.onrender.com/$1"
    },
    {
      "source": "/auth/(.*)",
      "destination": "https://your-backend-url.onrender.com/auth/$1"
    }
  ]
}
```

Then redeploy the frontend:
```bash
cd frontend
vercel --prod
```

## 🌐 Final URLs

Once both are deployed:
- **Frontend**: https://frontend-k74mvkve8-daniels-projects-8eaaf3eb.vercel.app
- **Backend**: https://your-backend-url.onrender.com (or Railway URL)

## 🎯 Share with Friends

Your friends can now access TubeDigest at:
**https://frontend-k74mvkve8-daniels-projects-8eaaf3eb.vercel.app**

## 🔍 Troubleshooting

### Frontend Issues
- Check Vercel deployment logs at: https://vercel.com/daniels-projects-8eaaf3eb/frontend
- Ensure backend URL is correctly configured in `vercel.json`

### Backend Issues
- Check deployment logs in Railway/Render dashboard
- Verify all environment variables are set correctly
- Ensure database migrations are applied

### CORS Issues
- Verify the frontend URL is in the backend CORS configuration
- Check that the backend URL in `vercel.json` matches your actual backend URL

## 📱 Features Available

Your friends can now:
- ✅ Create YouTube channel digests
- ✅ Get email notifications
- ✅ Use Google OAuth authentication
- ✅ Manage their digest preferences
- ✅ View processed transcripts and summaries

## 🚀 Next Steps

1. Deploy the backend using Railway or Render
2. Update the frontend configuration with the backend URL
3. Test the full application flow
4. Share the URL with your friends!

---

**Need help?** Check the deployment logs or contact me for assistance!
