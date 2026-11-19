import { eq, and } from 'drizzle-orm';
import { withTenantContext } from '../config/db.js';
import { users, workspaces, workspaceMembers } from '../db/schema.js';
import type { ProfileResponse } from '../types/profile-response.interface.js';

export class ProfileService {
  static async getProfile(userId: string, workspaceId: string): Promise<ProfileResponse> {
    // One transaction so a connection failure surfaces as 503 "Database unavailable" (users has no RLS)
    const { userRow, workspaceRow, memberRow } = await withTenantContext(workspaceId, async (tenantDb) => {
      const [u] = await tenantDb.select().from(users).where(eq(users.id, userId)).limit(1);
      const [ws] = await tenantDb.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
      const [member] = await tenantDb
        .select({ role: workspaceMembers.role })
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
        .limit(1);
      return { userRow: u, workspaceRow: ws, memberRow: member };
    });

    return {
      user: userRow
        ? {
            id: userRow.id,
            email: userRow.email,
            firstName: userRow.firstName,
            lastName: userRow.lastName,
            avatarUrl: userRow.avatarUrl,
            createdAt: userRow.createdAt.toISOString(),
          }
        : null,
      workspace: workspaceRow
        ? {
            id: workspaceRow.id,
            name: workspaceRow.name,
            plan: workspaceRow.plan,
            creditsRemaining: workspaceRow.creditsRemaining,
            aiProvider: workspaceRow.aiProvider,
            role: memberRow?.role ?? null,
          }
        : null,
    };
  }
}
