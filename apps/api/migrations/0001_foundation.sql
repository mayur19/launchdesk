-- 0001 foundation: tenancy, identity, sessions, audit.
-- Every tenant-owned table carries organization_id (ADR-0003).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  slug        text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,64}$'),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  email            text NOT NULL CHECK (email = lower(email)),
  display_name     text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 200),
  role             text NOT NULL,
  password_hash    text NOT NULL,
  is_active        boolean NOT NULL DEFAULT true,
  last_login_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);
CREATE INDEX users_org_idx ON users (organization_id);

CREATE TABLE sessions (
  token_hash       text PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  ip_address       inet,
  user_agent       text
);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

-- Append-only audit trail. Application role must not UPDATE/DELETE this table.
CREATE TABLE audit_events (
  id               bigserial PRIMARY KEY,
  organization_id  uuid REFERENCES organizations(id) ON DELETE RESTRICT,
  actor_user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  action           text NOT NULL,
  entity_type      text NOT NULL,
  entity_id        text,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_id       text,
  occurred_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_org_time_idx ON audit_events (organization_id, occurred_at DESC);
CREATE INDEX audit_events_entity_idx ON audit_events (entity_type, entity_id);
