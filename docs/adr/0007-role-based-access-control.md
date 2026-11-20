# ADR-0007: Role-based access control and permission matrix

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

PRD §3 defines five roles across two sides: Provider Admin, Implementation Manager and Provider Contributor work inside the provider tenant; Customer Owner and Customer Member act for one customer account. Access must also be object-level (project membership, visibility).

## Decision Drivers

- Server-side enforcement
- One place to read who may do what
- Defence in depth against UI-only checks

## Considered Options

1. Static roles with a route guard plus service-level policy
2. Fine-grained permission tables editable at runtime
3. External policy engine

## Decision Outcome

Chosen option: **static roles** stored in `users.role` with a database `CHECK` constraint, gated at the route (`requireRole`, `modules/guards.ts`) and re-checked in services (e.g. `customers.policy.ts`). Record-level rules (project membership, `INTERNAL` vs shared visibility) live in services. A shared permission matrix module is planned in LD-019.

| Capability                                               | Provider Admin | Impl. Manager | Contributor |   Customer Owner   |  Customer Member   |
| -------------------------------------------------------- | :------------: | :-----------: | :---------: | :----------------: | :----------------: |
| List/read customer accounts (FR-01)                      |       ✓        |       ✓       |      ✓      |         -          |         -          |
| Create/archive customer accounts                         |       ✓        |       -       |      -      |         -          |         -          |
| Manage templates (FR-02)                                 |       ✓        |       ✓       |    read     |         -          |         -          |
| Create projects, transitions, rebaseline (FR-03)         |       ✓        |       ✓       |      -      |         -          |         -          |
| Work on assigned tasks, comment, attach evidence (FR-04) |       ✓        |       ✓       |      ✓      | own customer tasks | own customer tasks |
| Override dependency gate with reason                     |       ✓        |       ✓       |      -      |         -          |         -          |
| Submit milestone for acceptance (FR-05)                  |       ✓        |       ✓       |      -      |         -          |         -          |
| Accept/reject customer milestone                         |       -        |       -       |      -      |         ✓          |         -          |
| Record internal milestone acceptance                     |       ✓        |       ✓       |      -      |         -          |         -          |
| Risk register (FR-06)                                    |       ✓        |       ✓       |      ✓      |         -          |         -          |
| Customer portal (FR-07)                                  |       -        |       -       |      -      |         ✓          |         ✓          |
| Reports and CSV export (FR-09)                           |       ✓        |       ✓       |      -      |         -          |         -          |
| Audit history, team settings (FR-10)                     |       ✓        |       -       |      -      |         -          |         -          |

Status: rows for FR-01 are implemented and covered by integration tests; the remaining rows are enforced at the route level for pending endpoints and completed by their tickets.

## Consequences

### Positive

- Small, auditable rule set
- The database rejects unknown roles

### Negative

- Per-project roles (e.g. a contributor who manages one project) require LD-012 memberships

## Links

- ADR-0013
- [Threat model](../security/threat-model.md)
