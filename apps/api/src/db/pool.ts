import pg from 'pg';
import type { Env } from '../config/env.js';

export type Db = pg.Pool;

/** Minimal query surface; lets repositories accept a pool or a transaction client. */
export interface Queryable {
  query<R extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<pg.QueryResult<R>>;
}

export function createPool(env: Pick<Env, 'DATABASE_URL' | 'DATABASE_POOL_MAX'>): Db {
  return new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

/** Run `work` inside a transaction; rolls back on any thrown error. */
export async function withTransaction<T>(
  db: Db,
  work: (tx: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
