# ADR-0013: Dual-portal access model for provider and customer users

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

Provider staff and customer stakeholders work on the same projects but must see different data. Customers must never see other customers, provider-internal tasks, comments, files or activity, even by guessing ids (PRD §3, FR-07, L-06, L-15). Provider staff must never see other providers (L-16).

## Decision Drivers

- Leak-proof customer views
- One data model for both experiences (PRD §11)
- Simple mental model for reviewers

## Considered Options

1. Customer users as users of the provider tenant bound to one customer account, with a separate `/customer/*` API tree
2. Separate customer tenant with cross-tenant sharing
3. Same endpoints for both sides with response filtering

## Decision Outcome

Chosen option: **customer users live inside the provider tenant and are bound to exactly one customer account**, enforced by `users_customer_binding_check` (customer roles require `customer_account_id`, provider roles forbid it) and a composite FK to `customer_accounts (organization_id, id)`. Customer users get a **separate API tree** (`/api/v1/customer/...`, LD-051) whose queries filter by `customer_account_id` and `customer_visible`/`SHARED` visibility in SQL, rather than reusing provider endpoints and stripping fields. Provider endpoints reject customer roles with 403 at the route guard. In the web client the two sides have disjoint navigation and distinct visual treatment. Multi-membership (one identity in several providers or customers, PRD §6 `provider_memberships`/`customer_memberships`) is planned in LD-012 and will replace the single binding without changing the API split.

Visibility rules:

| Data                         | Provider roles | Customer roles                         |
| ---------------------------- | -------------- | -------------------------------------- |
| Customer accounts list       | own tenant     | never                                  |
| Projects                     | own tenant     | own customer account only              |
| Tasks                        | all in project | `customer_visible = true` only         |
| Comments, files              | all            | `SHARED` / `SHARED_WITH_CUSTOMER` only |
| Activity                     | all            | customer-visible events only           |
| Risks, internal notes, audit | per role       | never                                  |

## Consequences

### Positive

- Leaks require a bug in a dedicated, small query layer rather than a forgotten field filter
- Isolation is checked by the database and by tests (`customers.db.test.ts`)

### Negative

- Some duplication between provider and customer read models
- A user cannot yet act for two customers (LD-012)

## Links

- ADR-0003
- ADR-0007
- [Threat model](../security/threat-model.md)
