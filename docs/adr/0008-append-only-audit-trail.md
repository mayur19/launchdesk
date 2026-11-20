# ADR-0008: Append-only audit trail

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

FR-10 requires every important action to produce an activity event with actor, provider organization, project, event, timestamp and safe context. Approval integrity (FR-05) depends on records that cannot be rewritten.

## Decision Drivers

- Atomicity between change and audit record
- Tamper resistance
- Separation of internal audit from customer-visible activity

## Considered Options

1. Audit insert in the same transaction as the change
2. Asynchronous event bus
3. Database triggers

## Decision Outcome

Chosen option: **`recordAudit(tx, event)` inside the business transaction**. `audit_events` is append-only (no UPDATE/DELETE from the application role in production). Customer-visible project activity (`project_events`, LD-053) is a separate table with a visibility column so internal entries are excluded at the query layer. The implemented `customer.created` event demonstrates the pattern; a failing audit insert rolls the change back (unit-tested).

## Consequences

### Positive

- No change without its audit row
- Simple to query for the audit history screen (LD-059)

### Negative

- Audit volume grows with activity; retention policy in quality attributes

## Links

- [System design](../design/system-design.md)
