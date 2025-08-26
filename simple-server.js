const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS
app.use(cors({
  origin: ['https://frontend-rho-topaz-86.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'TubeDigest Backend (Simple)',
    version: '1.0.0'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'TubeDigest Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Auth test endpoint
app.get('/api/auth/test', (req, res) => {
  res.json({
    message: 'Auth endpoint is accessible',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🚀 Simple TubeDigest server running on port ${port}`);
  console.log(`✅ Health check available at: http://localhost:${port}/health`);
});
