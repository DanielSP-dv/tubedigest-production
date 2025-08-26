# Google OAuth Setup Guide for TubeDigest

## 🚀 Quick Setup Steps

### 1. Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create/Select Project**
   - Create new project or select existing one
   - Project name: `tubedigest` (or your preferred name)

3. **Enable APIs**
   - Go to **APIs & Services** → **Library**
   - Search for and enable:
     - **YouTube Data API v3**
     - **Google+ API** (if available)

### 2. Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - **APIs & Services** → **OAuth consent screen**

2. **Choose User Type**
   - Select **"External"** (allows any Google user)
   - Click **"Create"**

3. **Fill Required Information**
   ```
   App name: TubeDigest
   User support email: [your-email@gmail.com]
   App logo: (optional)
   App domain: localhost
   Developer contact information: [your-email@gmail.com]
   ```

4. **Add Scopes**
   - Click **"Add or Remove Scopes"**
   - Add these scopes:
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`

5. **Add Test Users** (for External apps)
   - Add your email address as a test user
   - This allows you to test the OAuth flow

### 3. Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - **APIs & Services** → **Credentials**

2. **Create OAuth 2.0 Client ID**
   - Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
   - Application type: **"Web application"**

3. **Configure Client**
   ```
   Name: TubeDigest Web Client
   
   Authorized JavaScript origins:
   http://localhost:3000
   http://localhost:3001
   http://localhost:3002
   
   Authorized redirect URIs:
   http://localhost:3000/auth/google/callback
   ```

4. **Save and Get Credentials**
   - Click **"Create"**
   - **Copy the Client ID and Client Secret**

### 4. Environment Configuration

1. **Create .env file** (if not exists)
   ```bash
   cp env-template.txt .env
   ```

2. **Update .env with your credentials**
   ```env
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-actual-client-id-here
   GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   FRONTEND_URL=http://localhost:3001
   
   # Generate a random 32-byte hex key for token encryption
   TOKEN_ENC_KEY=your-32-byte-hex-encryption-key-here
   ```

3. **Generate Encryption Key**
   ```bash
   # Run this command to generate a secure encryption key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### 5. Test the Setup

1. **Restart your servers**
   ```bash
   # Stop current servers (Ctrl+C)
   # Then restart
   npm run dev
   cd frontend && npm run dev
   ```

2. **Test OAuth Flow**
   - Go to http://localhost:3001
   - Click "Sign In" button
   - Should redirect to Google OAuth
   - Complete the flow

## 🔧 Troubleshooting

### Common Issues:

1. **"Missing required parameter: client_id"**
   - Check that `GOOGLE_CLIENT_ID` is set in `.env`
   - Restart the server after updating `.env`

2. **"Redirect URI mismatch"**
   - Verify redirect URI in Google Console matches exactly
   - Should be: `http://localhost:3000/auth/google/callback`

3. **"Access blocked: Authorization Error"**
   - Add your email as test user in OAuth consent screen
   - Verify scopes are added correctly

4. **"Invalid client"**
   - Check that Client ID and Secret are correct
   - Ensure no extra spaces in `.env` file

### Verification Steps:

1. **Check Environment Variables**
   ```bash
   # Verify .env file exists and has correct values
   cat .env | grep GOOGLE
   ```

2. **Test API Endpoint**
   ```bash
   curl http://localhost:3000/auth/google
   # Should redirect to Google OAuth URL
   ```

3. **Check Server Logs**
   - Look for OAuth-related errors in server console
   - Verify environment variables are loaded

## 📋 Required Scopes

The application needs these Google OAuth scopes:

- `https://www.googleapis.com/auth/youtube.readonly` - Read YouTube data
- `https://www.googleapis.com/auth/userinfo.email` - Get user email
- `https://www.googleapis.com/auth/userinfo.profile` - Get user profile

## 🔒 Security Notes

1. **Never commit .env file** to version control
2. **Keep Client Secret secure** - don't share it
3. **Use HTTPS in production** - update redirect URIs accordingly
4. **Rotate encryption keys** periodically in production

## 🚀 Production Deployment

For production, update these values:

```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

And add your production domain to Google Console:
- Authorized JavaScript origins: `https://yourdomain.com`
- Authorized redirect URIs: `https://yourdomain.com/auth/google/callback`

## ✅ Success Indicators

When properly configured, you should see:
- ✅ Google OAuth consent screen when clicking "Sign In"
- ✅ Successful authentication flow
- ✅ User email displayed in the UI
- ✅ Access to YouTube data (if API key also configured)

---

**Need help?** Check the server logs for specific error messages and ensure all environment variables are properly set.
