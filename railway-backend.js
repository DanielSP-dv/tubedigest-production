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
      test: '/api/test'
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 TubeDigest Railway Backend running on port ${port}`);
  console.log(`✅ Health check available at: http://localhost:${port}/health`);
  console.log(`🌐 API endpoints available at: http://localhost:${port}/api`);
});
