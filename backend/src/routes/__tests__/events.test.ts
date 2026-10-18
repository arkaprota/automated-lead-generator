import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock withTenantContext for testing without an external PostgreSQL instance
vi.mock('../../config/db.js', () => ({
  pool: { connect: vi.fn(), query: vi.fn() },
  db: {},
  withTenantContext: vi.fn(async (_workspaceId: string, callback: (tenantDb: unknown) => Promise<unknown>) => {
    const mockEvent = {
      id: '00000000-0000-0000-0000-000000000001',
      workspaceId: 'ws_test_tenant',
      name: 'Kolkata Restaurants Hunter',
      category: 'Restaurant',
      location: 'Kolkata',
      scheduleCron: '0 9 * * *',
      status: 'active',
      queryPrompt: null,
      totalLeadsFound: 6,
      lastRunAt: new Date().toISOString(),
      nextRunAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockTenantDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([mockEvent]),
      limit: vi.fn().mockResolvedValue([mockEvent]),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockEvent]),
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'lead_001',
                businessName: 'Kolkata Bistro',
                leadScore: 92,
                qualificationStatus: 'hot',
              },
            ]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              { ...mockEvent, status: 'stopped' },
            ]),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 1 }),
      }),
    };
    return callback(mockTenantDb);
  }),
}));

// Mock BullMQ redis connection
vi.mock('../../config/redis.js', () => ({
  getRedisClient: vi.fn(() => ({
    on: vi.fn(),
    quit: vi.fn(),
  })),
}));

// Mock BullMQ Queue
vi.mock('bullmq', () => {
  return {
    Queue: vi.fn().mockImplementation(() => ({
      add: vi.fn().mockResolvedValue({ id: 'job_1' }),
      getRepeatableJobs: vi.fn().mockResolvedValue([]),
      removeRepeatableByKey: vi.fn().mockResolvedValue(true),
    })),
    Worker: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      close: vi.fn(),
    })),
  };
});

import { app } from '../../server.js';

describe('Automated Search Events & Dedicated Leads API', () => {
  const workspaceId = 'ws_test_tenant';

  it('POST /api/events should create a new search event and schedule recurring daily scrape', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('x-workspace-id', workspaceId)
      .send({
        name: 'Kolkata Restaurants Hunter',
        category: 'Restaurant',
        location: 'Kolkata',
        scheduleCron: '0 9 * * *',
        status: 'active',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.event).toBeDefined();
    expect(res.body.event.category).toBe('Restaurant');
    expect(res.body.event.location).toBe('Kolkata');
  });

  it('GET /api/events should list all search events for the workspace', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBeGreaterThan(0);
  });

  it('PATCH /api/events/:id/status should toggle event between active and stopped', async () => {
    const res = await request(app)
      .patch('/api/events/00000000-0000-0000-0000-000000000001/status')
      .set('x-workspace-id', workspaceId)
      .send({ status: 'stopped' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.event.status).toBe('stopped');
  });

  it('POST /api/events/:id/trigger should execute on-demand scrape with deduplication', async () => {
    const res = await request(app)
      .post('/api/events/00000000-0000-0000-0000-000000000001/trigger')
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.totalScraped).toBeGreaterThan(0);
  });

  it('GET /api/events/:id/leads should retrieve dedicated leads for that event', async () => {
    const res = await request(app)
      .get('/api/events/00000000-0000-0000-0000-000000000001/leads')
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.eventId).toBe('00000000-0000-0000-0000-000000000001');
    expect(Array.isArray(res.body.leads)).toBe(true);
  });

  it('DELETE /api/events/:id should remove the event and cancel BullMQ repeatable job', async () => {
    const res = await request(app)
      .delete('/api/events/00000000-0000-0000-0000-000000000001')
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('deleted successfully');
  });
});
