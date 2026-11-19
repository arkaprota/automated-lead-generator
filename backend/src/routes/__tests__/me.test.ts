import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.hoisted(() => {
  process.env.WEBHOOK_SECRET = 'test-webhook-secret';
  process.env.CLERK_SECRET_KEY = 'sk_test_unit';
});

vi.mock('../../utils/verify-clerk-token.util.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/verify-clerk-token.util.js')>()),
  verifyClerkToken: vi.fn(async (token: string) =>
    token === 'valid-test-token' ? { userId: 'user_fixture_1', workspaceId: 'org_fixture_1' } : null
  ),
}));

const getProfile = vi.hoisted(() => vi.fn());
vi.mock('../../services/profile.service.js', () => ({ ProfileService: { getProfile } }));
vi.mock('../../config/db.js', () => ({
  pool: { connect: vi.fn(), query: vi.fn() },
  db: {},
  withTenantContext: vi.fn(),
}));

import { app } from '../../server.js';
import { IntegrationNotConfiguredError } from '../../errors/integration-not-configured.error.js';

const PROFILE_FIXTURE = {
  user: {
    id: 'user_fixture_1',
    email: 'test.user@fixture.test',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  workspace: {
    id: 'org_fixture_1',
    name: 'Fixture Workspace',
    plan: 'starter',
    creditsRemaining: 500,
    aiProvider: 'gemini',
    role: 'admin',
  },
};

describe('GET /api/me', () => {
  beforeEach(() => {
    getProfile.mockReset().mockResolvedValue(PROFILE_FIXTURE);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
    expect(getProfile).not.toHaveBeenCalled();
  });

  it('returns the profile for the identity in the verified token', async () => {
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer valid-test-token');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(PROFILE_FIXTURE);
    expect(getProfile).toHaveBeenCalledWith('user_fixture_1', 'org_fixture_1');
  });

  it('ignores a forged x-workspace-id header', async () => {
    await request(app)
      .get('/api/me')
      .set('Authorization', 'Bearer valid-test-token')
      .set('x-workspace-id', 'org_victim');

    expect(getProfile).toHaveBeenCalledWith('user_fixture_1', 'org_fixture_1');
  });

  it('returns 503 when the database is unavailable', async () => {
    getProfile.mockRejectedValueOnce(new IntegrationNotConfiguredError('database', 'unavailable'));
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer valid-test-token');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Database unavailable');
  });
});
