# ADR-0004: PostgreSQL and forward-only SQL migrations

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

The PRD permits local PostgreSQL or SQLite. The model needs FK constraints, partial and expression indexes, transactional DDL and row locking for dependency changes.

## Decision Drivers

- Referential integrity and CHECK constraints
- Row locks for concurrent dependency edits
- Reviewable, reproducible schema changes

## Considered Options

1. PostgreSQL 17 with plain SQL migrations
2. SQLite
3. ORM-generated migrations

## Decision Outcome

Chosen option: **PostgreSQL with forward-only, checksummed SQL migrations** in `apps/api/migrations/NNNN_description.sql`, each applied in its own transaction by `src/db/migrate.ts`. Applied migrations are never edited; a changed checksum aborts startup. `0001_foundation.sql` creates tenancy, users, sessions and audit; `0002_roles_and_customer_accounts.sql` adds the role constraint and customer accounts.

## Consequences

### Positive

- Full SQL feature set (expression unique index on `lower(name)`, partial indexes, composite FKs)
- Schema history is plain text and reviewable

### Negative

- No automatic down migrations; rollbacks are new forward migrations
- Requires a running PostgreSQL server for integration tests

## Links

- [Data model](../design/data-model.md)
- [Runbook](../operations/runbook.md)
