# ADR-0002: Modular monolith with npm workspaces

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

The product needs an API, a web client and shared validation schemas. Expected scale (5-100 customers per provider per year, single-digit thousands of tasks per tenant) does not justify distributed services, and the runtime constraints (PRD §2) forbid Docker and remote services.

## Decision Drivers

- One deployable unit and one database
- Shared types between API and web without publishing packages
- Clear module boundaries that could be extracted later

## Considered Options

1. Modular monolith in npm workspaces (`apps/api`, `apps/web`, `packages/shared`)
2. Separate repositories per service
3. Microservices per domain

## Decision Outcome

Chosen option: **modular monolith**. The API is organised by domain module (`customers`, `templates`, `projects`, `tasks`, `milestones`, `risks`, `files`, `customer-portal`, `reports`, `notifications`, `audit`), each owning routes, service, repository and pure domain code. Modules talk through service interfaces, never through each other's tables. `packages/shared` holds zod schemas, roles and the API envelope.

## Consequences

### Positive

- Single `./run.sh` brings everything up
- Refactors across API and web are atomic
- Domain logic (dependency graph, health rules) stays pure and unit-testable

### Negative

- Module boundaries are enforced by convention and review, not by process isolation
- One slow module can affect the whole process (mitigated by background worker, ADR-0012)

## Links

- [Architecture overview](../architecture/overview.md)
