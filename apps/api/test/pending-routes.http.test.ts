import type { Role } from '@launchdesk/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Db } from '../src/db/pool.js';
import { PENDING_ROUTES } from '../src/modules/index.js';
import { deriveCsrfToken } from '../src/security/tokens.js';
import { silentLogger, testEnv, TEST_ORIGIN } from './helpers.js';

const TOKEN = 'test-session-token';
const env = testEnv();

/** Fake pool: any session lookup resolves to a user with the given role. */
function appAs(role: Role) {
  const db = {
    query: async (sql: string) =>
      sql.includes('FROM sessions')
        ? {
            rows: [
              {
                user_id: '00000000-0000-4000-8000-000000000001',
                organization_id: '00000000-0000-4000-8000-0000000000aa',
                organization_name: 'Northstar Cloud',
                email: 'x@example.test',
                display_name: 'X',
                role,
                customer_account_id: role.startsWith('CUSTOMER')
                  ? '00000000-0000-4000-8000-0000000000cc'
                  : null,
              },
            ],
            rowCount: 1,
          }
        : { rows: [], rowCount: 0 },
  } as unknown as Db;
  return createApp({ env, logger: silentLogger, db, version: 'test' });
}

const ID = '00000000-0000-4000-8000-000000000123';

async function call(role: Role, method: 'get' | 'post', path: string) {
  const agent = request(appAs(role));
  const url = `/api/v1${path}`;
  const cookie = `${env.SESSION_COOKIE_NAME}=${TOKEN}`;
  if (method === 'get') return agent.get(url).set('Cookie', cookie);
  return agent
    .post(url)
    .set('Cookie', cookie)
    .set('Origin', TEST_ORIGIN)
    .set('X-CSRF-Token', deriveCsrfToken(TOKEN, env.SESSION_SECRET));
}

describe('pending API surface', () => {
  it.each([
    ['IMPLEMENTATION_MANAGER', 'get', '/templates', 'LD-015'],
    ['IMPLEMENTATION_MANAGER', 'post', `/templates/${ID}/validate`, 'LD-016'],
    ['IMPLEMENTATION_MANAGER', 'post', '/projects', 'LD-023'],
    ['PROVIDER_CONTRIBUTOR', 'get', `/projects/${ID}`, 'LD-024'],
    ['IMPLEMENTATION_MANAGER', 'post', `/projects/${ID}/transition`, 'LD-028'],
    ['PROVIDER_CONTRIBUTOR', 'post', `/tasks/${ID}/transition`, 'LD-031'],
    ['IMPLEMENTATION_MANAGER', 'post', `/milestones/${ID}/submit`, 'LD-038'],
    ['CUSTOMER_OWNER', 'post', `/milestones/${ID}/decide`, 'LD-039'],
    ['PROVIDER_ADMIN', 'get', `/projects/${ID}/risks`, 'LD-045'],
    ['CUSTOMER_MEMBER', 'get', `/files/${ID}/download`, 'LD-042'],
    ['CUSTOMER_MEMBER', 'get', '/customer/projects', 'LD-051'],
    ['PROVIDER_ADMIN', 'get', '/reports/export.csv', 'LD-057'],
    ['CUSTOMER_OWNER', 'get', '/notifications', 'LD-054'],
    ['PROVIDER_ADMIN', 'get', '/audit-logs', 'LD-059'],
  ] as const)('%s %s %s -> 501 %s', async (role, method, path, ticket) => {
    const res = await call(role, method, path);
    expect(res.status).toBe(501);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_IMPLEMENTED', details: { ticket } },
    });
  });

  it.each([
    ['CUSTOMER_OWNER', 'get', '/projects'],
    ['CUSTOMER_MEMBER', 'post', `/milestones/${ID}/decide`],
    ['PROVIDER_CONTRIBUTOR', 'post', '/projects'],
    ['IMPLEMENTATION_MANAGER', 'get', '/audit-logs'],
    ['PROVIDER_ADMIN', 'get', '/customer/projects'],
  ] as const)('%s %s %s -> 403 before reaching the placeholder', async (role, method, path) => {
    expect((await call(role, method, path)).status).toBe(403);
  });

  it('rejects anonymous callers on every pending route', async () => {
    const app = createApp({
      env,
      logger: silentLogger,
      db: { query: async () => ({ rows: [], rowCount: 0 }) } as unknown as Db,
      version: 'test',
    });
    for (const route of PENDING_ROUTES.filter((r) => r.method === 'get')) {
      const res = await request(app).get(`/api/v1${route.path.replace(/:\w+/g, ID)}`);
      expect(res.status, route.path).toBe(401);
    }
  });

  it('gives every pending route an LD ticket', () => {
    expect(PENDING_ROUTES.length).toBeGreaterThan(30);
    for (const route of PENDING_ROUTES) expect(route.ticket).toMatch(/^LD-\d{3}$/);
  });
});
