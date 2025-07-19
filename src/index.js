import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Simple health check
app.get('/', (req, res) => {
  console.log('Health check hit');
  res.json({ 
    status: 'OK',
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/health', (req, res) => {
  console.log('Health endpoint hit');
  res.json({ 
    status: 'healthy',
    message: 'All systems go!'
  });
});

app.get('/api/test', (req, res) => {
  console.log('API test hit');
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Catch all other routes
app.get('*', (req, res) => {
  console.log('Catch-all route hit:', req.path);
  res.json({ 
    message: `Route ${req.path} not found, but server is working!`,
    availableRoutes: ['/', '/health', '/api/test']
  });
});

// Start server
console.log('🚀 Starting minimal server...');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on 0.0.0.0:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🎯 Server is ready to accept connections');
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

console.log('📋 Script loaded, server should be starting...');
