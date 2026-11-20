import type {
  CreateCustomerRequest,
  CustomerAccount,
  ListCustomersQuery,
  SessionUser,
} from '@launchdesk/shared';
import { withTransaction, type Db, type Queryable } from '../../db/pool.js';
import { errors } from '../../lib/errors.js';
import { recordAudit } from '../audit/audit.service.js';
import { canCreateCustomers, canReadCustomers } from './customers.policy.js';
import { createCustomerRepository, type CustomerPage } from './customers.repository.js';

const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === UNIQUE_VIOLATION
  );
}

export interface CustomerServiceDeps {
  readonly db: Db;
  /** Repository factory; injectable so tests can bind it to a transaction client. */
  readonly repository?: (db: Queryable) => ReturnType<typeof createCustomerRepository>;
}

export function createCustomerService({
  db,
  repository = createCustomerRepository,
}: CustomerServiceDeps) {
  const reader = repository(db);

  const assertReader = (actor: SessionUser) => {
    if (!canReadCustomers(actor.role)) throw errors.forbidden();
  };

  return {
    async list(actor: SessionUser, query: ListCustomersQuery): Promise<CustomerPage> {
      assertReader(actor);
      return reader.list(actor.organizationId, query);
    },

    /** Unknown ids and ids from other tenants are indistinguishable: both 404. */
    async get(actor: SessionUser, id: string): Promise<CustomerAccount> {
      assertReader(actor);
      const customer = await reader.findById(actor.organizationId, id);
      if (!customer) throw errors.notFound('Customer account');
      return customer;
    },

    /** Insert and audit in one transaction (ADR-0008). */
    async create(
      actor: SessionUser,
      input: CreateCustomerRequest,
      requestId: string,
    ): Promise<CustomerAccount> {
      if (!canCreateCustomers(actor.role)) throw errors.forbidden();
      try {
        return await withTransaction(db, async (tx) => {
          const created = await repository(tx).insert(actor.organizationId, input, actor.id);
          await recordAudit(tx, {
            organizationId: actor.organizationId,
            actorUserId: actor.id,
            action: 'customer.created',
            entityType: 'customer_account',
            entityId: created.id,
            metadata: { name: created.name },
            requestId,
          });
          return created;
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw errors.conflict('A customer account with this name already exists');
        }
        throw error;
      }
    },
  };
}

export type CustomerService = ReturnType<typeof createCustomerService>;
