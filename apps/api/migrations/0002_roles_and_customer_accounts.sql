-- 0002 LaunchDesk actor model and customer accounts (LD-006, LD-008).
-- organizations = provider organizations (the paying tenant, ADR-0003).
-- organization_id is the tenant key that PRD §6 calls provider_org_id.

CREATE TABLE customer_accounts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name             text NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  industry         text CHECK (industry IS NULL OR length(industry) BETWEEN 1 AND 100),
  website_text     text CHECK (website_text IS NULL OR length(website_text) BETWEEN 1 AND 300),
  primary_contact  text CHECK (primary_contact IS NULL OR length(primary_contact) BETWEEN 1 AND 200),
  archived_at      timestamptz,
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  version          integer NOT NULL DEFAULT 1 CHECK (version > 0),
  -- Target for composite FKs so child rows cannot point at another tenant's customer.
  UNIQUE (organization_id, id)
);

-- Customer names are unique per provider organization, case-insensitively.
CREATE UNIQUE INDEX customer_accounts_org_name_uniq
  ON customer_accounts (organization_id, lower(name));
CREATE INDEX customer_accounts_org_created_idx
  ON customer_accounts (organization_id, created_at DESC, id);
CREATE INDEX customer_accounts_org_active_idx
  ON customer_accounts (organization_id) WHERE archived_at IS NULL;

-- Customer-portal users are bound to exactly one customer account of their
-- provider organization (ADR-0013). Multi-membership is planned in LD-012.
ALTER TABLE users ADD COLUMN customer_account_id uuid;

ALTER TABLE users
  ADD CONSTRAINT users_customer_account_fk
  FOREIGN KEY (organization_id, customer_account_id)
  REFERENCES customer_accounts (organization_id, id) ON DELETE RESTRICT;

ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (
    role IN (
      'PROVIDER_ADMIN',
      'IMPLEMENTATION_MANAGER',
      'PROVIDER_CONTRIBUTOR',
      'CUSTOMER_OWNER',
      'CUSTOMER_MEMBER'
    )
  );

ALTER TABLE users
  ADD CONSTRAINT users_customer_binding_check CHECK (
    (role IN ('CUSTOMER_OWNER', 'CUSTOMER_MEMBER')) = (customer_account_id IS NOT NULL)
  );

CREATE INDEX users_customer_account_idx ON users (customer_account_id)
  WHERE customer_account_id IS NOT NULL;
