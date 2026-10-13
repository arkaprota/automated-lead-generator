import { Pool, type PoolClient } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema.js';
import { env } from './env.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });

/**
 * Execute database operations within a tenant-isolated transaction enforcing PostgreSQL RLS
 * Sets session variable `app.current_workspace_id` scoped to the current transaction.
 */
export async function withTenantContext<T>(
  workspaceId: string,
  callback: (clientDb: ReturnType<typeof drizzle>) => Promise<T>
): Promise<T> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    // Set PostgreSQL session config for Neon Row-Level Security
    await client.query(`SET LOCAL app.current_workspace_id = $1`, [workspaceId]);
    const tenantDb = drizzle(client, { schema });
    const result = await callback(tenantDb);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
