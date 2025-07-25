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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Fixed: Added quotes around 'POST'
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

// Simple request logging
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

const PORT = process.env.PORT || 8080;

// Database connection status
let dbConnected = false;
let serverReady = false;

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

// Health check route - always responds regardless of DB status
app.get('/', (req, res) => {
  console.log('📍 Health check requested from:', req.headers.origin || 'none');
  res.status(200).json({ 
    status: 'Server running',
    dbConnected: dbConnected,
    serverReady: serverReady,
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/health', (req, res) => {
  console.log('📍 Health endpoint requested');
  res.status(200).json({ 
    status: 'healthy', 
    database: dbConnected ? 'connected' : 'connecting',
    ready: serverReady 
  });
});

// API Routes - only if database is connected
app.use('/api/auth', (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ message: 'Database not ready' });
  }
  next();
}, authRoutes);

app.use('/api/deals', (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ message: 'Database not ready' });
  }
  next();
}, dealRoutes);

app.use('/api/flash-orders', (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ message: 'Database not ready' });
  }
  next();
}, flashOrderRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Admin connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Admin disconnected:', socket.id);
  });
});

// Start server FIRST, then initialize database
console.log('🚀 Starting server...');

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔒 CORS allowed origins:', allowedOrigins);
  serverReady = true;
  
  // Initialize database after server starts
  initializeDatabase();
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

server.on('listening', () => {
  console.log('🎧 Server is listening and ready for connections');
});

// Database initialization - runs AFTER server starts
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');
    await connectDB();
    console.log('✅ Database connected successfully');
    dbConnected = true;
    
    await createDefaultAdmin();
    console.log('✅ Database and admin initialized');
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    console.log('⚠️ Server will continue running without database');
    // Don't exit - let the server keep running
  }
};

// Add error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});
