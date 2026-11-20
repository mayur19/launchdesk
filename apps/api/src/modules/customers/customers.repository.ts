import type {
  CreateCustomerRequest,
  CustomerAccount,
  ListCustomersQuery,
} from '@launchdesk/shared';
import type { Queryable } from '../../db/pool.js';

interface CustomerRow {
  id: string;
  name: string;
  industry: string | null;
  website_text: string | null;
  primary_contact: string | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
  version: number;
}

const COLUMNS = `id, name, industry, website_text, primary_contact, archived_at,
  created_at, updated_at, version`;

function toCustomer(row: CustomerRow): CustomerAccount {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    websiteText: row.website_text,
    primaryContact: row.primary_contact,
    status: row.archived_at ? 'ARCHIVED' : 'ACTIVE',
    archivedAt: row.archived_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    version: row.version,
  };
}

/** Escape LIKE metacharacters so user search text is matched literally. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Builds the tenant-scoped WHERE clause; organization_id is always $1. */
function listFilter(organizationId: string, query: ListCustomersQuery) {
  const clauses = ['organization_id = $1'];
  const values: unknown[] = [organizationId];
  if (query.status === 'ACTIVE') clauses.push('archived_at IS NULL');
  if (query.status === 'ARCHIVED') clauses.push('archived_at IS NOT NULL');
  if (query.search) {
    values.push(`%${escapeLike(query.search)}%`);
    clauses.push(`name ILIKE $${values.length}`);
  }
  return { where: clauses.join(' AND '), values };
}

export interface CustomerPage {
  readonly items: readonly CustomerAccount[];
  readonly total: number;
}

/**
 * Data access for customer accounts. Every method takes the tenant id from
 * the caller's session; there is no unscoped query (ADR-0003).
 */
export function createCustomerRepository(db: Queryable) {
  return {
    async list(organizationId: string, query: ListCustomersQuery): Promise<CustomerPage> {
      const { where, values } = listFilter(organizationId, query);
      const offset = (query.page - 1) * query.limit;
      const [rows, count] = await Promise.all([
        db.query<CustomerRow>(
          `SELECT ${COLUMNS} FROM customer_accounts WHERE ${where}
           ORDER BY lower(name), id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
          [...values, query.limit, offset],
        ),
        db.query<{ total: number }>(
          `SELECT count(*)::int AS total FROM customer_accounts WHERE ${where}`,
          values,
        ),
      ]);
      return { items: rows.rows.map(toCustomer), total: count.rows[0]?.total ?? 0 };
    },

    async findById(organizationId: string, id: string): Promise<CustomerAccount | null> {
      const { rows } = await db.query<CustomerRow>(
        `SELECT ${COLUMNS} FROM customer_accounts WHERE organization_id = $1 AND id = $2`,
        [organizationId, id],
      );
      return rows[0] ? toCustomer(rows[0]) : null;
    },

    async insert(
      organizationId: string,
      input: CreateCustomerRequest,
      createdBy: string,
    ): Promise<CustomerAccount> {
      const { rows } = await db.query<CustomerRow>(
        `INSERT INTO customer_accounts
           (organization_id, name, industry, website_text, primary_contact, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${COLUMNS}`,
        [
          organizationId,
          input.name,
          input.industry,
          input.websiteText,
          input.primaryContact,
          createdBy,
        ],
      );
      return toCustomer(rows[0]!);
    },
  };
}

export type CustomerRepository = ReturnType<typeof createCustomerRepository>;
