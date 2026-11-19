import type { UserJSON, OrganizationJSON, OrganizationMembershipJSON } from '@clerk/backend';
import type { WebhookEvent } from '@clerk/backend/webhooks';
import { eq, and } from 'drizzle-orm';
import { db, withTenantContext } from '../config/db.js';
import { users, workspaces, workspaceMembers } from '../db/schema.js';

/** Clerk roles look like "org:admin"; we store the bare role. */
const toRole = (clerkRole: string): string => clerkRole.replace(/^org:/, '');

/**
 * Mirrors Clerk users, organizations (= workspaces) and memberships into Postgres.
 * Every write is an idempotent upsert/delete, so Clerk's retries are safe.
 */
export class ClerkSyncService {
  static async handle(event: WebhookEvent): Promise<'synced' | 'ignored'> {
    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        await ClerkSyncService.upsertUser(event.data);
        return 'synced';
      case 'user.deleted':
        if (event.data.id) await db.delete(users).where(eq(users.id, event.data.id));
        return 'synced';
      case 'organization.created':
      case 'organization.updated':
        await ClerkSyncService.upsertWorkspace(event.data);
        return 'synced';
      case 'organization.deleted': {
        const orgId = event.data.id;
        if (orgId) {
          await withTenantContext(orgId, (tenantDb) => tenantDb.delete(workspaces).where(eq(workspaces.id, orgId)));
        }
        return 'synced';
      }
      case 'organizationMembership.created':
      case 'organizationMembership.updated':
        await ClerkSyncService.upsertMembership(event.data);
        return 'synced';
      case 'organizationMembership.deleted': {
        const orgId = event.data.organization.id;
        const userId = event.data.public_user_data.user_id;
        await withTenantContext(orgId, (tenantDb) =>
          tenantDb
            .delete(workspaceMembers)
            .where(and(eq(workspaceMembers.workspaceId, orgId), eq(workspaceMembers.userId, userId)))
        );
        return 'synced';
      }
      default:
        return 'ignored';
    }
  }

  private static async upsertUser(user: UserJSON): Promise<void> {
    const primary =
      user.email_addresses.find((e) => e.id === user.primary_email_address_id) ?? user.email_addresses[0];
    if (!primary) throw new Error(`Clerk user ${user.id} has no email address`);

    const values = {
      email: primary.email_address,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.image_url || null,
      updatedAt: new Date(),
    };
    await db
      .insert(users)
      .values({ id: user.id, ...values, createdAt: new Date(user.created_at) })
      .onConflictDoUpdate({ target: users.id, set: values });
  }

  private static async upsertWorkspace(org: OrganizationJSON): Promise<void> {
    const values = { name: org.name, slug: org.slug, updatedAt: new Date() };
    await withTenantContext(org.id, (tenantDb) =>
      tenantDb
        .insert(workspaces)
        .values({ id: org.id, ownerUserId: org.created_by ?? '', ...values, createdAt: new Date(org.created_at) })
        .onConflictDoUpdate({ target: workspaces.id, set: values })
    );
  }

  /** Requires the user and workspace rows; if Clerk delivers this first, the FK fails and Clerk retries later. */
  private static async upsertMembership(membership: OrganizationMembershipJSON): Promise<void> {
    const orgId = membership.organization.id;
    const role = toRole(membership.role);
    await withTenantContext(orgId, (tenantDb) =>
      tenantDb
        .insert(workspaceMembers)
        .values({ workspaceId: orgId, userId: membership.public_user_data.user_id, role })
        .onConflictDoUpdate({
          target: [workspaceMembers.workspaceId, workspaceMembers.userId],
          set: { role, updatedAt: new Date() },
        })
    );
  }
}
