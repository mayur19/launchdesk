import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import type { Db } from '../src/db/pool.js';
import { DEMO_PASSWORD } from '../src/db/seed.js';
import { prepareDatabase } from './db-helpers.js';
import { silentLogger, testEnv, TEST_ORIGIN } from './helpers.js';

/**
 * Real-PostgreSQL integration tests. Enabled when TEST_DATABASE_URL points at
 * a disposable database (run.sh test sets this up). The schema is dropped!
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('integration: auth against PostgreSQL', () => {
  let db: Db;

  beforeAll(async () => {
    db = await prepareDatabase(url!);
  });

  afterAll(async () => {
    await db?.end();
  });

  it('is idempotent when migrations run twice', async () => {
    await expect(runMigrations(db, silentLogger)).resolves.toEqual([]);
  });

  it('logs in, enforces CSRF, reads session, logs out', async () => {
    const agent = request.agent(
      createApp({ env: testEnv(), logger: silentLogger, db, version: 'test' }),
    );

    const login = await agent
      .post('/api/v1/auth/login')
      .set('Origin', TEST_ORIGIN)
      .send({ email: 'admin@northstar.example', password: DEMO_PASSWORD });
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie']?.[0]).toMatch(/HttpOnly; SameSite=Lax/);
    const csrf: string = login.body.data.csrfToken;

    const me = await agent.get('/api/v1/me');
    expect(me.body.data.email).toBe('admin@northstar.example');

    const noCsrf = await agent.post('/api/v1/auth/logout').set('Origin', TEST_ORIGIN);
    expect(noCsrf.status).toBe(403);

    const logout = await agent
      .post('/api/v1/auth/logout')
      .set('Origin', TEST_ORIGIN)
      .set('X-CSRF-Token', csrf);
    expect(logout.status).toBe(200);
    expect((await agent.get('/api/v1/me')).status).toBe(401);

    const audit = await db.query(
      "SELECT count(*)::int AS n FROM audit_events WHERE action = 'auth.login'",
    );
    expect(audit.rows[0].n).toBeGreaterThan(0);
  });

  it('exposes the customer account binding for customer-portal users', async () => {
    const agent = request.agent(
      createApp({ env: testEnv(), logger: silentLogger, db, version: 'test' }),
    );
    await agent
      .post('/api/v1/auth/login')
      .set('Origin', TEST_ORIGIN)
      .send({ email: 'owner@atlas-retail.example', password: DEMO_PASSWORD });
    const me = await agent.get('/api/v1/me');
    expect(me.body.data.role).toBe('CUSTOMER_OWNER');
    expect(me.body.data.customerAccountId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('enforces the role catalogue and customer binding in the database', async () => {
    const org = await db.query<{ id: string }>(
      "SELECT id FROM organizations WHERE slug = 'northstar-cloud'",
    );
    const insert = (role: string) =>
      db.query(
        `INSERT INTO users (organization_id, email, display_name, role, password_hash)
         VALUES ($1, $2, 'X', $3, 'x')`,
        [org.rows[0]!.id, `${role.toLowerCase()}-check@example.test`, role],
      );
    await expect(insert('ORG_ADMIN')).rejects.toThrow(/users_role_check/);
    await expect(insert('CUSTOMER_OWNER')).rejects.toThrow(/users_customer_binding_check/);
  });

  it('prevents binding a user to another tenant customer account', async () => {
    const meridian = await db.query<{ id: string }>(
      "SELECT id FROM organizations WHERE slug = 'meridian-implementations'",
    );
    const atlas = await db.query<{ id: string }>(
      "SELECT id FROM customer_accounts WHERE name = 'Atlas Retail'",
    );
    await expect(
      db.query(
        `INSERT INTO users (organization_id, email, display_name, role, customer_account_id, password_hash)
         VALUES ($1, 'cross@example.test', 'X', 'CUSTOMER_MEMBER', $2, 'x')`,
        [meridian.rows[0]!.id, atlas.rows[0]!.id],
      ),
    ).rejects.toThrow(/users_customer_account_fk/);
  });

  it('rejects wrong passwords generically', async () => {
    const res = await request(
      createApp({ env: testEnv(), logger: silentLogger, db, version: 'test' }),
    )
      .post('/api/v1/auth/login')
      .set('Origin', TEST_ORIGIN)
      .send({ email: 'admin@northstar.example', password: 'wrong-password-123' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Authentication required');
  });
});
