import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createHmac, randomBytes } from 'node:crypto';

const SIGNING_SECRET = vi.hoisted(() => {
  const secret = `whsec_${Buffer.from('clerk-webhook-test-secret-32bytes!').toString('base64')}`;
  process.env.CLERK_WEBHOOK_SIGNING_SECRET = secret;
  process.env.WEBHOOK_SECRET = 'test-webhook-secret';
  process.env.CLERK_SECRET_KEY = 'sk_test_unit';
  return secret;
});

const handle = vi.hoisted(() => vi.fn());
vi.mock('../../services/clerk-sync.service.js', () => ({ ClerkSyncService: { handle } }));
vi.mock('../../config/db.js', () => ({
  pool: { connect: vi.fn(), query: vi.fn() },
  db: {},
  withTenantContext: vi.fn(),
}));

import { app } from '../../server.js';

/** Signs a body exactly as Svix (Clerk's webhook sender) does. */
function svixHeaders(body: string, secret = SIGNING_SECRET) {
  const id = `msg_${randomBytes(8).toString('hex')}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');
  return { 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': `v1,${signature}` };
}

const userCreated = JSON.stringify({
  type: 'user.created',
  object: 'event',
  data: {
    id: 'user_fixture_1',
    object: 'user',
    first_name: 'Test',
    last_name: 'User',
    image_url: '',
    primary_email_address_id: 'idn_1',
    email_addresses: [{ id: 'idn_1', object: 'email_address', email_address: 'test.user@fixture.test' }],
    created_at: 1700000000000,
  },
});

describe('POST /api/webhooks/clerk', () => {
  beforeEach(() => {
    handle.mockReset().mockResolvedValue('synced');
  });

  it('accepts a correctly signed event and hands it to the sync service', async () => {
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .set(svixHeaders(userCreated))
      .send(userCreated);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, type: 'user.created', result: 'synced' });
    expect(handle).toHaveBeenCalledWith(expect.objectContaining({ type: 'user.created' }));
  });

  it('rejects an unsigned event without syncing', async () => {
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .send(userCreated);

    expect(res.status).toBe(400);
    expect(handle).not.toHaveBeenCalled();
  });

  it('rejects an event signed with a different secret', async () => {
    const wrongSecret = `whsec_${Buffer.from('attacker-controlled-secret-value!!').toString('base64')}`;
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .set(svixHeaders(userCreated, wrongSecret))
      .send(userCreated);

    expect(res.status).toBe(400);
    expect(handle).not.toHaveBeenCalled();
  });

  it('rejects a body altered after signing', async () => {
    const headers = svixHeaders(userCreated);
    const tampered = userCreated.replace('test.user@fixture.test', 'attacker@fixture.test');
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .set(headers)
      .send(tampered);

    expect(res.status).toBe(400);
    expect(handle).not.toHaveBeenCalled();
  });

  it('returns 5xx when syncing fails so Clerk retries', async () => {
    handle.mockRejectedValueOnce(new Error('insert or update on table violates foreign key constraint'));
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .set(svixHeaders(userCreated))
      .send(userCreated);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to sync Clerk event');
  });
});
