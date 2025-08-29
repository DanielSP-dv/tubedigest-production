const express = require('express');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3001;

// Google OAuth configuration
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://tubedigest-backend-working-production.up.railway.app/auth/google/callback';

// Initialize Google OAuth client
const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

// Simple in-memory session store (in production, use Redis or database)
const sessions = new Map();

// Encryption key for tokens
const encKey = process.env.TOKEN_ENC_KEY || crypto.createHash('sha256').update('dev-key').digest('hex');
const keyBuffer = Buffer.from(encKey.slice(0, 64), 'hex');

// Encryption/Decryption functions
function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(encB64) {
  const buf = Buffer.from(encB64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

// Enable CORS
app.use(cors({
  origin: ['https://frontend-rho-topaz-86.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'TubeDigest Backend (Railway)',
    version: '1.0.0',
    oauth: {
      clientId: clientId ? 'configured' : 'missing',
      redirectUri: redirectUri
    }
  });
});

// API prefix
app.use('/api', (req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  next();
});

// Get Google OAuth URL
app.get('/api/auth/google', (req, res) => {
  if (!clientId || !clientSecret) {
    return res.status(500).json({ 
      error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' 
    });
  }

  const scopes = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'openid',
    'email',
    'profile',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    prompt: 'consent',
  });

  res.json({ authUrl });
});

// OAuth callback endpoint
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    console.log('OAuth callback received with code:', code);
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Tokens received:', { access_token: !!tokens.access_token, refresh_token: !!tokens.refresh_token });

    // Get user info from Google
    const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`);
    if (!userInfoResponse.ok) {
      throw new Error(`Failed to fetch user info: ${userInfoResponse.statusText}`);
    }
    
    const userInfo = await userInfoResponse.json();
    console.log('User info received:', { email: userInfo.email, name: userInfo.name });

    // Store tokens securely (encrypted)
    const sessionId = crypto.randomBytes(32).toString('hex');
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

    sessions.set(sessionId, {
      userEmail: userInfo.email,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      createdAt: new Date()
    });

    // Set session cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Redirect to frontend with success
    const frontendUrl = 'https://frontend-rho-topaz-86.vercel.app';
    res.redirect(`${frontendUrl}?auth=success&email=${encodeURIComponent(userInfo.email)}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = 'https://frontend-rho-topaz-86.vercel.app';
    res.redirect(`${frontendUrl}?auth=error&message=${encodeURIComponent(error.message)}`);
  }
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const session = sessions.get(sessionId);
  
  // Check if token is expired
  if (session.expiryDate && new Date() > session.expiryDate) {
    // Try to refresh token
    if (session.refreshToken) {
      // TODO: Implement token refresh logic
      console.log('Token expired, refresh needed');
    }
    
    // Remove expired session
    sessions.delete(sessionId);
    res.clearCookie('sessionId');
    return res.status(401).json({ error: 'Session expired' });
  }

  res.json({
    id: `user-${session.userEmail}`,
    email: session.userEmail,
    createdAt: session.createdAt.toISOString()
  });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.cookies?.sessionId;
  
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
  }
  
  res.clearCookie('sessionId');
  res.json({ message: 'Logged out successfully' });
});

// Videos endpoints
app.get('/api/videos/digest', (req, res) => {
  // Mock video data
  const mockVideos = [
    {
      id: 'video-1',
      title: 'Unlocking the SEAL Team 6 Cheatcode (10/10 Difficulty) 😂',
      channelId: 'UCkoujZQZatbqy4KGcgjpVxQ',
      duration: '0:42',
      publishedAt: '2025-08-23',
      summary: 'The video discusses the process of using AI to analyze transcripts from YouTube\'s auto-captions or manual captions to generate summaries and extract chapters.',
      chapters: [{ title: 'Introduction', startTime: '0m' }]
    },
    {
      id: 'video-2',
      title: 'Hacker Explains Why You Should NEVER Pick Up a USB 😳',
      channelId: 'UCkoujZQZatbqy4KGcgjpVxQ',
      duration: '0:43',
      publishedAt: '2025-08-23',
      summary: 'The video WOFPI_1Y2gM discusses the process of using AI to analyze transcripts from YouTube\'s auto-captions or manual captions to generate summaries and extract chapters.',
      chapters: [{ title: 'Introduction', startTime: '0m' }]
    }
  ];
  
  res.json(mockVideos);
});

// Channels endpoints
app.get('/api/channels', (req, res) => {
  // Mock channel data
  const mockChannels = [
    {
      id: 'UCkoujZQZatbqy4KGcgjpVxQ',
      title: 'Tech With Tim',
      description: 'Programming tutorials and tech content',
      thumbnail: 'https://via.placeholder.com/120x90',
      subscriberCount: '2.1M',
      videoCount: 450,
      isSelected: true // Mock selected status
    },
    {
      id: 'UC8butISFwT-Wl7EV0hUK0BQ',
      title: 'freeCodeCamp.org',
      description: 'Learn to code for free',
      thumbnail: 'https://via.placeholder.com/120x90',
      subscriberCount: '8.5M',
      videoCount: 1200,
      isSelected: false // Mock selected status
    }
  ];
  res.json(mockChannels);
});

app.get('/api/channels/selected', (req, res) => {
  // Mock selected channels
  res.json([
    {
      id: 'UCkoujZQZatbqy4KGcgjpVxQ',
      title: 'Tech With Tim'
    }
  ]);
});

app.post('/api/channels/select', (req, res) => {
  const { channelIds, titles } = req.body;
  console.log(`Received channel selection: ${channelIds.join(', ')}`);
  // In a real app, you would save this to a database
  res.json({ message: 'Channel selected successfully', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Railway backend is working!',
    timestamp: new Date().toISOString(),
    oauth: {
      configured: !!(clientId && clientSecret),
      redirectUri: redirectUri
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 TubeDigest Backend running on port ${port}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 OAuth configured: ${!!(clientId && clientSecret)}`);
  console.log(`📍 Redirect URI: ${redirectUri}`);
});
