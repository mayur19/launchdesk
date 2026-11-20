import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Db } from '../src/db/pool.js';
import { DEMO, prepareDatabase, signIn, TEST_DB_URL, type SignedInAgent } from './db-helpers.js';
import { silentLogger, testEnv, TEST_ORIGIN } from './helpers.js';

/**
 * Customer accounts vertical slice (LD-008) against real PostgreSQL:
 * tenant isolation, role enforcement, validation, pagination and audit.
 */
describe.skipIf(!TEST_DB_URL)('integration: customer accounts', () => {
  let db: Db;
  let admin: SignedInAgent;
  let manager: SignedInAgent;
  let contributor: SignedInAgent;
  let customerOwner: SignedInAgent;
  let customerMember: SignedInAgent;
  let otherTenant: SignedInAgent;

  beforeAll(async () => {
    db = await prepareDatabase(TEST_DB_URL!);
    admin = await signIn(db, DEMO.admin);
    manager = await signIn(db, DEMO.manager);
    contributor = await signIn(db, DEMO.contributor);
    customerOwner = await signIn(db, DEMO.customerOwner);
    customerMember = await signIn(db, DEMO.customerMember);
    otherTenant = await signIn(db, DEMO.otherTenantAdmin);
  });

  afterAll(async () => {
    await db?.end();
  });

  const create = (who: SignedInAgent, body: Record<string, unknown>) =>
    who.agent
      .post('/api/v1/customers')
      .set('Origin', TEST_ORIGIN)
      .set('X-CSRF-Token', who.csrf)
      .send(body);

  describe('list', () => {
    it('returns only the caller tenant customers, sorted, with page meta', async () => {
      const res = await admin.agent.get('/api/v1/customers');
      expect(res.status).toBe(200);
      expect(res.body.data.map((c: { name: string }) => c.name)).toEqual([
        'Atlas Retail',
        'Blue Harbor Logistics',
        'Vela Health',
      ]);
      expect(res.body.meta).toEqual({ total: 3, page: 1, limit: 25 });
    });

    it('paginates', async () => {
      const res = await manager.agent.get('/api/v1/customers?limit=2&page=2');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toEqual({ total: 3, page: 2, limit: 2 });
    });

    it('searches by name, treating LIKE wildcards literally', async () => {
      const hit = await contributor.agent.get('/api/v1/customers?search=harbor');
      expect(hit.body.data.map((c: { name: string }) => c.name)).toEqual(['Blue Harbor Logistics']);
      const wildcard = await contributor.agent.get('/api/v1/customers?search=%25');
      expect(wildcard.body.data).toEqual([]);
    });

    it('filters by status', async () => {
      const res = await admin.agent.get('/api/v1/customers?status=ARCHIVED');
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    it('rejects invalid query parameters with 422', async () => {
      const res = await admin.agent.get('/api/v1/customers?limit=1000');
      expect(res.status).toBe(422);
    });

    it('never shows one tenant the customers of another', async () => {
      const res = await otherTenant.agent.get('/api/v1/customers');
      expect(res.body.data.map((c: { name: string }) => c.name)).toEqual([
        'Kestrel Bank',
        'Orion Foods',
      ]);
    });
  });

  describe('role enforcement', () => {
    it('denies customer-portal users listing customer accounts (403)', async () => {
      for (const who of [customerOwner, customerMember]) {
        const res = await who.agent.get('/api/v1/customers');
        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
        expect(JSON.stringify(res.body)).not.toContain('Blue Harbor');
      }
    });

    it('denies customer-portal users reading a customer account by id (403)', async () => {
      const list = await admin.agent.get('/api/v1/customers');
      const id = list.body.data[0].id as string;
      expect((await customerOwner.agent.get(`/api/v1/customers/${id}`)).status).toBe(403);
    });

    it('allows only provider admins to create customer accounts', async () => {
      for (const who of [manager, contributor, customerOwner]) {
        const res = await create(who, { name: 'Forbidden Co' });
        expect(res.status).toBe(403);
      }
      const count = await db.query(
        "SELECT count(*)::int AS n FROM customer_accounts WHERE name = 'Forbidden Co'",
      );
      expect(count.rows[0].n).toBe(0);
    });

    it('requires authentication', async () => {
      const app = createApp({ env: testEnv(), logger: silentLogger, db, version: 'test' });
      expect((await request(app).get('/api/v1/customers')).status).toBe(401);
    });
  });

  describe('create and get', () => {
    it('creates a customer, returns 201 with Location, and audits in the same transaction', async () => {
      const res = await create(admin, {
        name: '  Polaris Media ',
        industry: 'Media',
        websiteText: 'polaris.example',
        primaryContact: '',
      });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        name: 'Polaris Media',
        industry: 'Media',
        primaryContact: null,
        status: 'ACTIVE',
        version: 1,
      });
      expect(res.headers.location).toBe(`/api/v1/customers/${res.body.data.id}`);

      const audit = await db.query(
        `SELECT a.action, a.actor_user_id, a.organization_id = c.organization_id AS same_org
           FROM audit_events a JOIN customer_accounts c ON c.id::text = a.entity_id
          WHERE a.entity_type = 'customer_account' AND a.entity_id = $1`,
        [res.body.data.id],
      );
      expect(audit.rows).toHaveLength(1);
      expect(audit.rows[0]).toMatchObject({ action: 'customer.created', same_org: true });

      const fetched = await manager.agent.get(`/api/v1/customers/${res.body.data.id}`);
      expect(fetched.status).toBe(200);
      expect(fetched.body.data.name).toBe('Polaris Media');
    });

    it('rejects duplicate names case-insensitively within a tenant (409)', async () => {
      const res = await create(admin, { name: 'atlas retail' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('allows the same name in another tenant', async () => {
      const res = await create(otherTenant, { name: 'Atlas Retail' });
      expect(res.status).toBe(201);
    });

    it('validates input and rejects client-supplied tenant ids (422)', async () => {
      const blank = await create(admin, { name: '   ' });
      expect(blank.status).toBe(422);
      expect(blank.body.error.details[0].path).toBe('name');
      const smuggled = await create(admin, { name: 'Sneaky', organizationId: 'x' });
      expect(smuggled.status).toBe(422);
    });

    it('requires a CSRF token for creation', async () => {
      const res = await admin.agent
        .post('/api/v1/customers')
        .set('Origin', TEST_ORIGIN)
        .send({ name: 'No Token Ltd' });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_FAILED');
    });
  });

  describe('tenant isolation', () => {
    it('returns 404 when another tenant reads a customer by id', async () => {
      const list = await admin.agent.get('/api/v1/customers?search=Vela');
      const velaId = list.body.data[0].id as string;
      const res = await otherTenant.agent.get(`/api/v1/customers/${velaId}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(JSON.stringify(res.body)).not.toContain('Vela');
    });

    it('returns 404 for unknown and malformed ids', async () => {
      const unknown = await admin.agent.get(
        '/api/v1/customers/00000000-0000-4000-8000-000000000000',
      );
      expect(unknown.status).toBe(404);
      expect((await admin.agent.get('/api/v1/customers/not-a-uuid')).status).toBe(404);
    });
  });

  describe('pending endpoints', () => {
    it('return 501 with their ticket for provider users', async () => {
      const contacts = await admin.agent.get(
        '/api/v1/customers/00000000-0000-4000-8000-000000000000/contacts',
      );
      expect(contacts.status).toBe(501);
      expect(contacts.body.error.details.ticket).toBe('LD-013');
      const projects = await manager.agent.get('/api/v1/projects');
      expect(projects.body.error.details.ticket).toBe('LD-024');
    });

    it('stay role-gated: customer users get 403 on provider routes, 501 on portal routes', async () => {
      expect((await customerMember.agent.get('/api/v1/projects')).status).toBe(403);
      const portal = await customerMember.agent.get('/api/v1/customer/projects');
      expect(portal.status).toBe(501);
      expect(portal.body.error.details.ticket).toBe('LD-051');
    });
  });
});
