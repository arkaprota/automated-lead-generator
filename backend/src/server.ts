import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { env, isAuthBypassed } from './config/env.js';
import { globalRateLimit } from './middleware/rate-limit.middleware.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { SocketService } from './services/socket.service.js';
import { QueueService } from './services/queue.service.js';
import { EventScrapeWorker } from './workers/event-scrape.worker.js';

export const app = express();
export const server = http.createServer(app);

// Initialize Real-time Socket.io
SocketService.init(server);

// Initialize Background Workers in production or when enabled
if (process.env.ENABLE_WORKER === 'true') {
  QueueService.initWorker();
  EventScrapeWorker.initWorker();
}

if (isAuthBypassed) {
  console.warn('⚠️  [Auth] CLERK_SECRET_KEY is empty — API auth is BYPASSED (development only).');
}

// Middleware
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(globalRateLimit);

app.use(express.json({
  limit: '1mb',
  // Raw bytes are kept for webhook HMAC verification
  verify: (req, _res, buf) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
