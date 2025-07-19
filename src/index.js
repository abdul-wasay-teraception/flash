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

// Simple CORS configuration
app.use(cors({
   origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://192.168.18.118:5173',
   
    'https://buyflashnow.com',  // ← Make sure this is included
    'https://www.buyflashnow.com'  // ← Add www version too
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
}));

const PORT = process.env.PORT || 5001;

// Create HTTP server
const server = createServer(app);

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173', 
      'http://localhost:3000',
      'http://192.168.18.118:5173',
       'http://buyflashnow.com',
    'https://buyflashnow.com'
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
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
    await createDefaultAdmin();
    console.log('✅ Database and admin initialized');
  } catch (err) {
    console.error('❌ MongoDB Atlas connection failed:', err.message);
    console.log('🔄 Server will start anyway for development...');
    console.log('💡 Try these solutions:');
    console.log('   1. Use mobile hotspot');
    console.log('   2. Change DNS to 8.8.8.8');
    console.log('   3. Try again later when internet is stable');
  }
};

// Start server
initializeApp().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
