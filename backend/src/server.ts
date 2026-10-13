import express from 'express';
import http from 'http';
import cors from 'cors';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { SocketService } from './services/socket.service.js';
import { QueueService } from './services/queue.service.js';

export const app = express();
export const server = http.createServer(app);

// Initialize Real-time Socket.io
SocketService.init(server);

// Initialize Background Workers in production or when enabled
if (process.env.ENABLE_WORKER === 'true') {
  QueueService.initWorker();
}

// Middleware
app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root welcome
app.get('/', (_req, res) => {
  res.json({
    name: 'Cold Email Outreach & Lead Generation SaaS API',
    version: '1.0.0',
    documentation: '/api/health',
    status: 'online',
  });
});

// API Routes
app.use('/api', apiRouter);

// Centralized Error Handling
app.use(errorHandler);

// Graceful server startup
const PORT = env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 [Server] Cold Outreach & Lead Gen API listening on http://localhost:${PORT}`);
    console.log(`📡 [Socket.io] Ready for real-time tenant notifications`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] HTTP and Socket server closed.');
    process.exit(0);
  });
});
