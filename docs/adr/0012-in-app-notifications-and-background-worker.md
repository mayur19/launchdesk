# ADR-0012: In-app notifications and background worker

- **Status:** Proposed
- **Date:** 2026-11-20

## Context

FR-07 requires in-app notifications for assignments, approval requests, rejections and deadline changes, plus a local idempotent periodic checker. No email, SMS, Slack or push is allowed.

## Decision Drivers

- Durability across restarts
- Idempotency (no duplicate reminders)
- No extra infrastructure

## Considered Options

1. `notifications` table plus an in-process interval worker with idempotency keys
2. External queue
3. Cron job invoking a script

## Decision Outcome

Chosen option: **durable `notifications` rows written in the same transaction as the triggering change**, plus an in-process scheduler that runs a reminder pass every few minutes (LD-054). Each reminder has a unique key `(recipient, type, subject, local_date)` enforced by a unique index, so reruns and multiple instances never duplicate. Instances coordinate with a PostgreSQL advisory lock.

## Consequences

### Positive

- No new infrastructure
- Safe to run on several instances

### Negative

- Reminder latency equals the interval

## Links

- [System design](../design/system-design.md)
