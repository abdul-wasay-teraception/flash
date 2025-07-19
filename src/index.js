import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config();

import authRoutes from './routes/auth.route.js';
import dealRoutes from './routes/deal.route.js';
import flashOrderRoutes from './routes/flashOrder.route.js';
import { connectDB } from './lib/db.js';
import { createDefaultAdmin } from './controllers/auth.controller.js';

const app = express();
app.use(cookieParser());

app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json({ limit: '10mb' }));

// Simple CORS configuration (exactly like working file)
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://192.168.18.118:5173',
    'https://buyflashnow.com',
    'https://www.buyflashnow.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
}));

const PORT = process.env.PORT || 5002;

// Simple health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API test successful!',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/flash-orders', flashOrderRoutes);

// Database initialization with fallback (exactly like working file)
const initializeApp = async () => {
  try {
    await connectDB();
    await createDefaultAdmin();
    console.log('✅ Database and admin initialized');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('🔄 Server will start anyway...');
  }
};

// Start server (exactly like working file pattern)
initializeApp().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
