import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WebhookEvent } from '@clerk/backend/webhooks';

const calls = vi.hoisted(() => ({ inserts: [] as unknown[], upsertSets: [] as unknown[], tenantIds: [] as string[] }));

vi.mock('../../config/db.js', () => {
  const chain = {
    insert: () => ({
      values: (v: unknown) => {
        calls.inserts.push(v);
        return { onConflictDoUpdate: ({ set }: { set: unknown }) => (calls.upsertSets.push(set), Promise.resolve()) };
      },
    }),
    delete: () => ({ where: () => Promise.resolve() }),
  };
  return {
    db: chain,
    withTenantContext: vi.fn(async (id: string, cb: (tx: unknown) => unknown) => {
      calls.tenantIds.push(id);
      return cb(chain);
    }),
  };
});

import { ClerkSyncService } from '../clerk-sync.service.js';

const evt = (e: unknown) => e as WebhookEvent;

describe('ClerkSyncService', () => {
  beforeEach(() => {
    calls.inserts.length = 0;
    calls.upsertSets.length = 0;
    calls.tenantIds.length = 0;
  });

  it('upserts a user with the primary (not first) email address', async () => {
    await ClerkSyncService.handle(evt({
      type: 'user.created',
      data: {
        id: 'user_1', first_name: 'Ada', last_name: 'L', image_url: '', created_at: 1700000000000,
        primary_email_address_id: 'idn_2',
        email_addresses: [
          { id: 'idn_1', email_address: 'old@fixture.test' },
          { id: 'idn_2', email_address: 'primary@fixture.test' },
        ],
      },
    }));
    expect(calls.inserts[0]).toMatchObject({ id: 'user_1', email: 'primary@fixture.test', avatarUrl: null });
  });

  it('upserts the workspace inside its own tenant context', async () => {
    await ClerkSyncService.handle(evt({
      type: 'organization.created',
      data: { id: 'org_1', name: 'Acme', slug: 'acme', created_by: 'user_1', created_at: 1700000000000 },
    }));
    expect(calls.tenantIds).toEqual(['org_1']);
    expect(calls.inserts[0]).toMatchObject({ id: 'org_1', name: 'Acme', ownerUserId: 'user_1' });
  });

  it('stores membership roles without the "org:" prefix', async () => {
    await ClerkSyncService.handle(evt({
      type: 'organizationMembership.created',
      data: { role: 'org:admin', organization: { id: 'org_1' }, public_user_data: { user_id: 'user_1' } },
    }));
    expect(calls.inserts[0]).toEqual({ workspaceId: 'org_1', userId: 'user_1', role: 'admin' });
    expect(calls.upsertSets[0]).toMatchObject({ role: 'admin' });
  });

  it('ignores events it does not sync', async () => {
    const result = await ClerkSyncService.handle(evt({ type: 'session.created', data: {} }));
    expect(result).toBe('ignored');
    expect(calls.inserts).toHaveLength(0);
  });
});
