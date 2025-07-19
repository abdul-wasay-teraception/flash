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
app.use(express.json({ limit: '10mb' }));

// Simple CORS configuration (like the working file)
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

const PORT = process.env.PORT || 8080;

// Health check routes
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'Server running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy'
  });
});

app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    message: 'API test successful',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/flash-orders', flashOrderRoutes);

// Create HTTP server
const server = createServer(app);

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173', 
      'http://localhost:3000',
      'http://192.168.18.118:5173',
      'https://buyflashnow.com',
      'https://www.buyflashnow.com'
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Admin connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Admin disconnected:', socket.id);
  });
});

// Database initialization with fallback (like the working file)
const initializeApp = async () => {
  try {
    await connectDB();
    await createDefaultAdmin();
    console.log('✅ Database and admin initialized');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('🔄 Server will start anyway...');
    console.log('💡 Database will be unavailable but server will run');
  }
};

// Start server (following the working pattern)
initializeApp().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
