import { Router } from 'express';
import healthRouter from './health.routes.js';
import leadsRouter from './leads.routes.js';
import aiRouter from './ai.routes.js';
import campaignsRouter from './campaigns.routes.js';
import eventsRouter from './events.routes.js';
import webhooksRouter from './webhooks.routes.js';
import workspaceSettingsRouter from './workspace-settings.routes.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { verifyWebhookSignature } from '../middleware/webhook-signature.middleware.js';
import { aiRateLimit } from '../middleware/rate-limit.middleware.js';

const apiRouter = Router();

// Public health check
apiRouter.use('/health', healthRouter);

// Inbound Webhooks (HMAC-signed by the email provider)
apiRouter.use('/webhooks', verifyWebhookSignature, webhooksRouter);

// Tenant-Isolated SaaS Endpoints
apiRouter.use('/leads', tenantMiddleware, aiRateLimit, leadsRouter);
apiRouter.use('/events', tenantMiddleware, eventsRouter);
apiRouter.use('/ai', tenantMiddleware, aiRateLimit, aiRouter);
apiRouter.use('/campaigns', tenantMiddleware, campaignsRouter);
apiRouter.use('/workspace', tenantMiddleware, workspaceSettingsRouter);

export default apiRouter;

