import { Router } from 'express';
import healthRouter from './health.routes.js';
import leadsRouter from './leads.routes.js';
import aiRouter from './ai.routes.js';
import campaignsRouter from './campaigns.routes.js';
import eventsRouter from './events.routes.js';
import webhooksRouter from './webhooks.routes.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const apiRouter = Router();

// Public health check
apiRouter.use('/health', healthRouter);

// Inbound Webhooks (Handles signature / payload verification)
apiRouter.use('/webhooks', webhooksRouter);

// Tenant-Isolated SaaS Endpoints
apiRouter.use('/leads', tenantMiddleware, leadsRouter);
apiRouter.use('/events', tenantMiddleware, eventsRouter);
apiRouter.use('/ai', tenantMiddleware, aiRouter);
apiRouter.use('/campaigns', tenantMiddleware, campaignsRouter);

export default apiRouter;

