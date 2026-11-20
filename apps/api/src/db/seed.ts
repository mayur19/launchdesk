import type { Role } from '@launchdesk/shared';
import type { Logger } from 'pino';
import type pg from 'pg';
import { hashPassword } from '../security/password.js';
import { withTransaction, type Db } from './pool.js';

/**
 * DEVELOPMENT-ONLY seed data. Credentials below are public, documented in
 * README, and must never exist in a production database. The seed refuses
 * to run when NODE_ENV=production.
 *
 * Seeds the PRD §8 provider "Northstar Cloud" with its three customer
 * accounts, a second provider organization for tenant-isolation checks and
 * one demo login per role.
 *
 * TODO(LD-060): full demonstration dataset (projects, tasks, milestones,
 * risks, review rounds and the Atlas Retail golden scenario).
 */
export const DEMO_PASSWORD = 'DemoPassword!2026';

interface DemoOrg {
  readonly slug: string;
  readonly name: string;
  readonly customers: readonly DemoCustomer[];
}

interface DemoCustomer {
  readonly name: string;
  readonly industry: string;
  readonly websiteText: string;
  readonly primaryContact: string;
}

interface DemoUser {
  readonly org: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: Role;
  readonly customer?: string;
}

export const DEMO_ORGS: readonly DemoOrg[] = [
  {
    slug: 'northstar-cloud',
    name: 'Northstar Cloud',
    customers: [
      {
        name: 'Atlas Retail',
        industry: 'Retail',
        websiteText: 'atlas-retail.example',
        primaryContact: 'Casey Patel (Head of Data)',
      },
      {
        name: 'Blue Harbor Logistics',
        industry: 'Logistics',
        websiteText: 'blueharbor.example',
        primaryContact: 'Morgan Diaz (IT Director)',
      },
      {
        name: 'Vela Health',
        industry: 'Healthcare',
        websiteText: 'velahealth.example',
        primaryContact: 'Dr. Lena Okafor (Operations)',
      },
    ],
  },
  {
    slug: 'meridian-implementations',
    name: 'Meridian Implementations',
    customers: [
      {
        name: 'Orion Foods',
        industry: 'Food & Beverage',
        websiteText: 'orionfoods.example',
        primaryContact: 'Tariq Haddad (CIO)',
      },
      {
        name: 'Kestrel Bank',
        industry: 'Financial Services',
        websiteText: 'kestrelbank.example',
        primaryContact: 'Ana Ruiz (Programme Lead)',
      },
    ],
  },
];

export const DEMO_USERS: readonly DemoUser[] = [
  {
    org: 'northstar-cloud',
    email: 'admin@northstar.example',
    displayName: 'Alex Morgan',
    role: 'PROVIDER_ADMIN',
  },
  {
    org: 'northstar-cloud',
    email: 'manager@northstar.example',
    displayName: 'Jordan Lee',
    role: 'IMPLEMENTATION_MANAGER',
  },
  {
    org: 'northstar-cloud',
    email: 'contributor@northstar.example',
    displayName: 'Sam Rivera',
    role: 'PROVIDER_CONTRIBUTOR',
  },
  {
    org: 'northstar-cloud',
    email: 'owner@atlas-retail.example',
    displayName: 'Casey Patel',
    role: 'CUSTOMER_OWNER',
    customer: 'Atlas Retail',
  },
  {
    org: 'northstar-cloud',
    email: 'member@atlas-retail.example',
    displayName: 'Robin Chen',
    role: 'CUSTOMER_MEMBER',
    customer: 'Atlas Retail',
  },
  {
    org: 'meridian-implementations',
    email: 'admin@meridian.example',
    displayName: 'Riley Brooks',
    role: 'PROVIDER_ADMIN',
  },
];

async function upsertOrg(tx: pg.PoolClient, org: DemoOrg): Promise<string> {
  const { rows } = await tx.query<{ id: string }>(
    `INSERT INTO organizations (slug, name) VALUES ($1, $2)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [org.slug, org.name],
  );
  return rows[0]!.id;
}

async function upsertCustomer(
  tx: pg.PoolClient,
  organizationId: string,
  customer: DemoCustomer,
): Promise<string> {
  const { rows } = await tx.query<{ id: string }>(
    `INSERT INTO customer_accounts (organization_id, name, industry, website_text, primary_contact)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (organization_id, lower(name)) DO UPDATE
       SET industry = EXCLUDED.industry, website_text = EXCLUDED.website_text,
           primary_contact = EXCLUDED.primary_contact
     RETURNING id`,
    [
      organizationId,
      customer.name,
      customer.industry,
      customer.websiteText,
      customer.primaryContact,
    ],
  );
  return rows[0]!.id;
}

async function upsertUser(
  tx: pg.PoolClient,
  user: DemoUser,
  organizationId: string,
  customerAccountId: string | null,
  passwordHash: string,
): Promise<void> {
  await tx.query(
    `INSERT INTO users (organization_id, email, display_name, role, customer_account_id, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE
       SET organization_id = EXCLUDED.organization_id, display_name = EXCLUDED.display_name,
           role = EXCLUDED.role, customer_account_id = EXCLUDED.customer_account_id,
           password_hash = EXCLUDED.password_hash`,
    [organizationId, user.email, user.displayName, user.role, customerAccountId, passwordHash],
  );
}

export async function seed(db: Db, logger: Logger): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo data when NODE_ENV=production');
  }
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  await withTransaction(db, async (tx) => {
    const orgIds = new Map<string, string>();
    const customerIds = new Map<string, string>();
    for (const org of DEMO_ORGS) {
      const orgId = await upsertOrg(tx, org);
      orgIds.set(org.slug, orgId);
      for (const customer of org.customers) {
        customerIds.set(`${org.slug}/${customer.name}`, await upsertCustomer(tx, orgId, customer));
      }
    }
    for (const user of DEMO_USERS) {
      const customerId = user.customer ? customerIds.get(`${user.org}/${user.customer}`) : null;
      await upsertUser(tx, user, orgIds.get(user.org)!, customerId ?? null, passwordHash);
    }
  });
  logger.info({ users: DEMO_USERS.length }, 'demo seed applied');
}
