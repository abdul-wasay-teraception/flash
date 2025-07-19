import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

import authRoutes from './routes/auth.route.js';
import dealRoutes from './routes/deal.route.js';
import flashOrderRoutes from './routes/flashOrder.route.js';
import { connectDB } from './lib/db.js';
import { createDefaultAdmin } from './controllers/auth.controller.js';

const app = express();
app.use(cookieParser());

app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

// Enhanced CORS configuration for Railway with manual header setting
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'http://192.168.18.118:5173',
  'https://buyflashnow.com',
  'https://www.buyflashnow.com'
];

// First, use the cors middleware
app.use(cors({
  origin: function (origin, callback) {
    console.log('🌍 Request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ No origin - allowing request');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed for origin:', origin);
      return callback(null, true);
    } else {
      console.log('❌ CORS blocked for origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Add manual CORS headers as backup (Railway might be overriding the cors middleware)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    
    console.log('🔧 Manual CORS headers set for origin:', origin);
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✈️ Handling OPTIONS preflight request');
    return res.status(200).end();
  }
  
  next();
});

// Add error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

// Simple request logging
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

const PORT = process.env.PORT || 8080;

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    corsOrigins: allowedOrigins
  });
});

// Test route for CORS debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'CORS test successful!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    headers: req.headers,
    allowedOrigins: allowedOrigins
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/flash-orders', flashOrderRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Admin connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Admin disconnected:', socket.id);
  });
});

// Database initialization with fallback
const initializeApp = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');
    await createDefaultAdmin();
    console.log('✅ Database and admin initialized');
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('🔒 CORS allowed origins:', allowedOrigins);
    });
  } catch (err) {
    console.error('❌ Server initialization failed:', err);
    process.exit(1);
  }
};

initializeApp();
