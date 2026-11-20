import type { CustomerAccount, SessionUser } from '@launchdesk/shared';
import { describe, expect, it, vi } from 'vitest';
import type { Db, Queryable } from '../src/db/pool.js';
import type { CustomerRepository } from '../src/modules/customers/customers.repository.js';
import { escapeLike } from '../src/modules/customers/customers.repository.js';
import { createCustomerService } from '../src/modules/customers/customers.service.js';

const ORG = '00000000-0000-4000-8000-0000000000aa';

function actor(role: SessionUser['role']): SessionUser {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    organizationId: ORG,
    organizationName: 'Northstar Cloud',
    email: 'x@example.test',
    displayName: 'X',
    role,
    customerAccountId: role.startsWith('CUSTOMER') ? '00000000-0000-4000-8000-0000000000cc' : null,
  };
}

const customer: CustomerAccount = {
  id: '00000000-0000-4000-8000-0000000000c1',
  name: 'Atlas Retail',
  industry: null,
  websiteText: null,
  primaryContact: null,
  status: 'ACTIVE',
  archivedAt: null,
  createdAt: '2026-11-20T00:00:00.000Z',
  updatedAt: '2026-11-20T00:00:00.000Z',
  version: 1,
};

/** Fake pool whose transaction client records statements; audit insert can be made to fail. */
function fakeDb(options: { failAudit?: boolean } = {}) {
  const statements: string[] = [];
  const client = {
    query: vi.fn(async (sql: string) => {
      statements.push(sql.trim().split(/\s+/).slice(0, 3).join(' '));
      if (options.failAudit && sql.includes('audit_events')) throw new Error('audit down');
      return { rows: [], rowCount: 0 };
    }),
    release: vi.fn(),
  };
  const db = { connect: async () => client, query: client.query } as unknown as Db;
  return { db, statements };
}

function fakeRepository(overrides: Partial<CustomerRepository> = {}) {
  const repo: CustomerRepository = {
    list: vi.fn(async () => ({ items: [customer], total: 1 })),
    findById: vi.fn(async () => customer),
    insert: vi.fn(async () => customer),
    ...overrides,
  };
  return { repo, factory: (_db: Queryable) => repo };
}

const query = { page: 1, limit: 25 };
const input = { name: 'Atlas Retail', industry: null, websiteText: null, primaryContact: null };

describe('customer service', () => {
  it('scopes reads to the actor tenant', async () => {
    const { repo, factory } = fakeRepository();
    const service = createCustomerService({ db: fakeDb().db, repository: factory });
    await service.list(actor('PROVIDER_CONTRIBUTOR'), query);
    await service.get(actor('IMPLEMENTATION_MANAGER'), customer.id);
    expect(repo.list).toHaveBeenCalledWith(ORG, query);
    expect(repo.findById).toHaveBeenCalledWith(ORG, customer.id);
  });

  it('forbids customer-portal roles from reading customer accounts', async () => {
    const { factory } = fakeRepository();
    const service = createCustomerService({ db: fakeDb().db, repository: factory });
    await expect(service.list(actor('CUSTOMER_OWNER'), query)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(service.get(actor('CUSTOMER_MEMBER'), customer.id)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('maps a missing customer to NOT_FOUND', async () => {
    const { factory } = fakeRepository({ findById: vi.fn(async () => null) });
    const service = createCustomerService({ db: fakeDb().db, repository: factory });
    await expect(service.get(actor('PROVIDER_ADMIN'), customer.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('only lets provider admins create', async () => {
    const { factory } = fakeRepository();
    const service = createCustomerService({ db: fakeDb().db, repository: factory });
    await expect(
      service.create(actor('IMPLEMENTATION_MANAGER'), input, 'req-1'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('commits insert and audit together', async () => {
    const { factory } = fakeRepository();
    const { db, statements } = fakeDb();
    const service = createCustomerService({ db, repository: factory });
    await expect(service.create(actor('PROVIDER_ADMIN'), input, 'req-1')).resolves.toEqual(
      customer,
    );
    expect(statements).toEqual(['BEGIN', 'INSERT INTO audit_events', 'COMMIT']);
  });

  it('rolls back the insert when the audit write fails', async () => {
    const { factory } = fakeRepository();
    const { db, statements } = fakeDb({ failAudit: true });
    const service = createCustomerService({ db, repository: factory });
    await expect(service.create(actor('PROVIDER_ADMIN'), input, 'req-1')).rejects.toThrow(
      'audit down',
    );
    expect(statements.at(-1)).toBe('ROLLBACK');
  });

  it('maps unique violations to CONFLICT', async () => {
    const duplicate = Object.assign(new Error('duplicate'), { code: '23505' });
    const { factory } = fakeRepository({ insert: vi.fn(async () => Promise.reject(duplicate)) });
    const service = createCustomerService({ db: fakeDb().db, repository: factory });
    await expect(service.create(actor('PROVIDER_ADMIN'), input, 'req-1')).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });
});

describe('escapeLike', () => {
  it('escapes LIKE metacharacters', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });
});
