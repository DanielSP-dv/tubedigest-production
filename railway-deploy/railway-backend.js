const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

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
    version: '1.0.0'
  });
});

// API prefix
app.use('/api', (req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  next();
});

// Auth endpoints
app.get('/api/auth/me', (req, res) => {
  // Mock user data for testing
  res.json({
    id: 'user-1',
    email: 'danielsecopro@gmail.com',
    createdAt: new Date().toISOString()
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/google', (req, res) => {
  res.json({ message: 'Google OAuth endpoint' });
});

// OAuth callback endpoint - CRITICAL FOR LOGIN
app.get('/auth/google/callback', (req, res) => {
  const { code } = req.query;
  
  console.log('OAuth callback received with code:', code);
  
  // In a real implementation, you would:
  // 1. Exchange the code for tokens
  // 2. Get user info from Google
  // 3. Create/update user in database
  // 4. Set session/cookies
  
  // For now, redirect to frontend with success
  const frontendUrl = 'https://frontend-rho-topaz-86.vercel.app';
  res.redirect(`${frontendUrl}?auth=success&code=${code}`);
});

app.get('/api/auth/google/callback', (req, res) => {
  res.json({ message: 'Google OAuth callback' });
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

// Channel endpoints
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
      isSelected: true
    },
    {
      id: 'UC8butISFwT-Wl7EV0hUK0BQ',
      title: 'freeCodeCamp.org',
      description: 'Learn to code for free',
      thumbnail: 'https://via.placeholder.com/120x90',
      subscriberCount: '8.5M',
      videoCount: 1200,
      isSelected: false
    }
  ];
  
  res.json(mockChannels);
});

app.get('/api/channels/selected', (req, res) => {
  // Mock selected channels
  const selectedChannels = [
    {
      id: 'UCkoujZQZatbqy4KGcgjpVxQ',
      title: 'Tech With Tim',
      description: 'Programming tutorials and tech content',
      thumbnail: 'https://via.placeholder.com/120x90',
      subscriberCount: '2.1M',
      videoCount: 450
    }
  ];
  
  res.json(selectedChannels);
});

app.post('/api/channels/select', (req, res) => {
  const { channelId } = req.body;
  console.log(`Channel selection request for: ${channelId}`);
  
  res.json({
    message: 'Channel selected successfully',
    channelId: channelId,
    timestamp: new Date().toISOString()
  });
});

app.delete('/api/channels/select/:channelId', (req, res) => {
  const { channelId } = req.params;
  console.log(`Channel deselection request for: ${channelId}`);
  
  res.json({
    message: 'Channel deselected successfully',
    channelId: channelId,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'TubeDigest Backend is working!',
    timestamp: new Date().toISOString(),
    backend: 'Railway'
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'TubeDigest Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      videos: '/api/videos/*',
      test: '/api/test',
      oauth_callback: '/auth/google/callback'
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 TubeDigest Railway Backend running on port ${port}`);
  console.log(`✅ Health check available at: http://localhost:${port}/health`);
  console.log(`🌐 API endpoints available at: http://localhost:${port}/api`);
  console.log(`🔐 OAuth callback available at: http://localhost:${port}/auth/google/callback`);
});
