import { Pool, type PoolClient } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema.js';
import { env } from './env.js';

export type TenantDb = NodePgDatabase<typeof schema>;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Full certificate verification — Neon serves publicly trusted certs
  ssl: env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: true } : false,
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.warn('[PostgreSQL Pool Warning]', err.message);
});

export const db = drizzle(pool, { schema });

/**
 * Execute database operations within a tenant-isolated transaction enforcing PostgreSQL RLS
 * Sets session variable `app.current_workspace_id` scoped to the current transaction.
 */
export async function withTenantContext<T>(
  workspaceId: string,
  callback: (clientDb: TenantDb) => Promise<T>
): Promise<T> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    // Set PostgreSQL session config for Neon Row-Level Security
    // SET cannot take bind parameters; set_config(..., true) is the parameterised, transaction-local equivalent
    await client.query(`SELECT set_config('app.current_workspace_id', $1, true)`, [workspaceId]);
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
