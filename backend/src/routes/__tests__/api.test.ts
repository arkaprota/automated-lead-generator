import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock withTenantContext for testing without an external PostgreSQL instance
vi.mock('../../config/db.js', () => ({
  pool: { connect: vi.fn(), query: vi.fn() },
  db: {},
  withTenantContext: vi.fn(async (_workspaceId: string, callback: (tenantDb: unknown) => Promise<unknown>) => {
    const mockTenantDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: '00000000-0000-0000-0000-000000000001',
                businessName: 'Mock Business',
                leadScore: 90,
                qualificationStatus: 'hot',
              },
            ]),
          }),
        }),
      }),
    };
    return callback(mockTenantDb);
  }),
}));

import { app } from '../../server.js';

describe('Cold Email SaaS API Test Suite', () => {
  it('GET /api/health should return ok and service details', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('automated-leads-backend');
  });

  describe('Pipeline 1: AI-Scraper-AI Lead Generation', () => {
    it('POST /api/leads/generate should translate intent to 5 queries, scrape, and qualify leads', async () => {
      const res = await request(app)
        .post('/api/leads/generate')
        .set('x-workspace-id', 'ws_test_tenant')
        .send({
          demographic: 'Web design clients in Kolkata',
          maxPerQuery: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.queriesGenerated).toHaveLength(5);
      expect(res.body.summary.totalScraped).toBeGreaterThan(0);
      expect(Array.isArray(res.body.leads)).toBe(true);
    });

    it('should reject requests with missing demographic', async () => {
      const res = await request(app)
        .post('/api/leads/generate')
        .set('x-workspace-id', 'ws_test_tenant')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Pipeline 2: AI Dynamic Pitch & Intent Classification', () => {
    it('POST /api/ai/classify-intent should classify positive interest as INTERESTED', async () => {
      const res = await request(app)
        .post('/api/ai/classify-intent')
        .set('x-workspace-id', 'ws_test_tenant')
        .send({
          replyText: 'Yes, we are definitely interested! When are you free for a 15-minute call?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.classification.intent).toBe('INTERESTED');
      expect(res.body.classification.confidence).toBeGreaterThan(0.8);
    });

    it('POST /api/ai/classify-intent should classify negative replies as NOT_INTERESTED', async () => {
      const res = await request(app)
        .post('/api/ai/classify-intent')
        .set('x-workspace-id', 'ws_test_tenant')
        .send({
          replyText: 'Please unsubscribe us immediately and remove from your list.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.classification.intent).toBe('NOT_INTERESTED');
    });
  });

  describe('Pipeline 3: Webhook Catching & Live Notification Trigger', () => {
    it('POST /api/webhooks/email-replies should catch reply, classify, and trigger live notification', async () => {
      const res = await request(app)
        .post('/api/webhooks/email-replies')
        .send({
          workspaceId: 'ws_test_tenant',
          replyText: 'Hi Alex, we are interested in getting a quote for our website rebuild. Please call us.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.intent).toBe('INTERESTED');
      expect(res.body.liveNotificationEmitted).toBe(true);
    });
  });
});
