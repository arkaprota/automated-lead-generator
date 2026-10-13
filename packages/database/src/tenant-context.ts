import { sql } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';

/**
 * Executes a callback within a strict multi-tenant Row-Level Security (RLS) context.
 * Sets the PostgreSQL session variable `app.current_workspace_id`.
 */
export async function withTenantContext<T, TSchema extends Record<string, unknown>>(
  db: NeonHttpDatabase<TSchema>,
  workspaceId: string,
  callback: (tenantDb: NeonHttpDatabase<TSchema>) => Promise<T>
): Promise<T> {
  if (!workspaceId) {
    throw new Error('Tenant context violation: workspaceId is required');
  }

  // Set the local session workspace ID variable for Neon RLS
  await db.execute(sql`SET LOCAL app.current_workspace_id = ${workspaceId}`);
  return await callback(db);
}
