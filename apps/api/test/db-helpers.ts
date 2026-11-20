import request from 'supertest';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { createPool, type Db } from '../src/db/pool.js';
import { DEMO_PASSWORD, seed } from '../src/db/seed.js';
import { silentLogger, testEnv, TEST_ORIGIN } from './helpers.js';

/** Disposable integration database (run.sh test points this at <db>_test). */
export const TEST_DB_URL = process.env.TEST_DATABASE_URL;

/** Drop and rebuild the schema, then apply the development seed. */
export async function prepareDatabase(url: string): Promise<Db> {
  const db = createPool({ DATABASE_URL: url, DATABASE_POOL_MAX: 4 });
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await runMigrations(db, silentLogger);
  await seed(db, silentLogger);
  return db;
}

type TestAgent = ReturnType<typeof request.agent>;

export interface SignedInAgent {
  readonly agent: TestAgent;
  readonly csrf: string;
}

/** Log in as a seeded demo user and return a cookie-carrying agent plus CSRF token. */
export async function signIn(db: Db, email: string): Promise<SignedInAgent> {
  const agent = request.agent(
    createApp({ env: testEnv(), logger: silentLogger, db, version: 'test' }),
  );
  const res = await agent
    .post('/api/v1/auth/login')
    .set('Origin', TEST_ORIGIN)
    .send({ email, password: DEMO_PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status}`);
  return { agent, csrf: res.body.data.csrfToken as string };
}

export const DEMO = {
  admin: 'admin@northstar.example',
  manager: 'manager@northstar.example',
  contributor: 'contributor@northstar.example',
  customerOwner: 'owner@atlas-retail.example',
  customerMember: 'member@atlas-retail.example',
  otherTenantAdmin: 'admin@meridian.example',
} as const;
