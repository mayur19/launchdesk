# ADR-0003: Multi-tenancy with row-level organization scoping

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

A provider organization is the paying tenant (PRD §3). Every project, task, file and customer account belongs to exactly one provider. Leaking data between providers, or between customers of the same provider, is the most severe failure the product can have (acceptance tests L-15, L-16).

## Decision Drivers

- Strong isolation with a single shared database
- Simple operational model for a small team
- Isolation must be testable

## Considered Options

1. Shared schema with `organization_id` on every tenant-owned row
2. Schema per tenant
3. Database per tenant
4. PostgreSQL row-level security policies

## Decision Outcome

Chosen option: **shared schema with `organization_id` on every tenant-owned row** (the PRD calls it `provider_org_id`; the `organizations` table is the provider organization table). The tenant id always comes from the server-side session, never from the request. Repositories take `organizationId` as their first argument and include it in every `WHERE`. Child tables reference parents through composite foreign keys `(organization_id, id)` so a row cannot point at another tenant's parent even if application code is wrong. Lookups by id for another tenant's row return 404, never 403, to avoid confirming existence. PostgreSQL RLS is kept as a future hardening option.

## Consequences

### Positive

- One migration path and one backup
- Composite FKs make cross-tenant references impossible at the database level
- Integration tests prove isolation per endpoint (see `customers.db.test.ts`)

### Negative

- Every new query must remember the tenant predicate; reviews and the isolation regression suite (LD-063) guard this
- Noisy-neighbour effects are possible at higher scale

## Links

- [Threat model](../security/threat-model.md)
- [Data model](../design/data-model.md)
- ADR-0013
