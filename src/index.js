import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(express.json());

// Simple test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test route working!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server running',
    message: 'Hello from Railway!',
    port: PORT
  });
});

// Start server
console.log('Starting minimal test server...');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
