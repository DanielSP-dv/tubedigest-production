# Google OAuth Setup for Vercel Deployment

## 🚀 Your TubeDigest App URL
**https://frontend-rho-topaz-86.vercel.app**

## 📋 Google Cloud Console Configuration

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Sign in with your Google account
- Select your TubeDigest project

### 2. Update OAuth 2.0 Credentials

1. **Navigate to Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Find your existing OAuth 2.0 Client ID
   - Click on it to edit

2. **Update Authorized JavaScript Origins**
   Add these URLs:
   ```
   http://localhost:3000
   http://localhost:3001
   https://frontend-rho-topaz-86.vercel.app
   https://frontend-k74mvkve8-daniels-projects-8eaaf3eb.vercel.app
   ```

3. **Update Authorized Redirect URIs**
   Add these URLs:
   ```
   http://localhost:3000/auth/google/callback
   http://localhost:3001/auth/google/callback
   https://frontend-rho-topaz-86.vercel.app/auth/google/callback
   https://frontend-k74mvkve8-daniels-projects-8eaaf3eb.vercel.app/auth/google/callback
   ```

4. **Save Changes**
   - Click **"Save"** at the bottom

### 3. Update Environment Variables

You need to update your backend environment variables with the Vercel URLs:

```env
# Google OAuth Configuration for Vercel
GOOGLE_CLIENT_ID=your-existing-client-id
GOOGLE_CLIENT_SECRET=your-existing-client-secret
GOOGLE_REDIRECT_URI=https://frontend-rho-topaz-86.vercel.app/auth/google/callback
FRONTEND_URL=https://frontend-rho-topaz-86.vercel.app
APP_URL=https://frontend-rho-topaz-86.vercel.app
```

### 4. Backend Deployment Configuration

When you deploy your backend (Railway/Render), make sure to set these environment variables:

```env
NODE_ENV=production
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://frontend-rho-topaz-86.vercel.app/auth/google/callback
FRONTEND_URL=https://frontend-rho-topaz-86.vercel.app
APP_URL=https://frontend-rho-topaz-86.vercel.app
```

### 5. Update Frontend Configuration

After deploying the backend, update your `frontend/vercel.json`:

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

## 🔍 Verification Steps

1. **Test OAuth Flow**
   - Go to: https://frontend-rho-topaz-86.vercel.app
   - Click "Create Your First Digest" or "Sign In"
   - Should redirect to Google OAuth consent screen
   - Complete the authentication flow

2. **Check for Errors**
   - Open browser developer tools (F12)
   - Look for any OAuth-related errors in the console
   - Check network tab for failed requests

## 🚨 Common Issues & Solutions

### "Redirect URI mismatch"
- **Solution**: Double-check that the redirect URI in Google Console exactly matches your Vercel URL
- **Format**: `https://frontend-rho-topaz-86.vercel.app/auth/google/callback`

### "Invalid client"
- **Solution**: Verify your Client ID and Secret are correct
- **Check**: No extra spaces or characters in environment variables

### "Access blocked"
- **Solution**: Add your email as a test user in OAuth consent screen
- **Location**: Google Console → OAuth consent screen → Test users

### CORS errors
- **Solution**: Ensure backend CORS configuration includes your Vercel domain
- **Check**: Backend should allow `https://frontend-rho-topaz-86.vercel.app`

## 📱 Quick Test

Once configured, your friends can:
1. Visit: https://frontend-rho-topaz-86.vercel.app
2. Click "Create Your First Digest"
3. Sign in with Google
4. Start creating YouTube channel digests!

## 🔒 Security Notes

- ✅ Never commit Client Secret to version control
- ✅ Use HTTPS URLs in production
- ✅ Keep your Google Cloud project secure
- ✅ Monitor OAuth usage in Google Console

---

**Need help?** Check the browser console for specific error messages and ensure all URLs match exactly!
