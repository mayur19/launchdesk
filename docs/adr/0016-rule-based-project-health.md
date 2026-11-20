# ADR-0016: Rule-based project health

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

FR-09 requires a deterministic, transparent health indicator with visible reasons, and filters by health. Leaders must trust it, so it must be explainable and reproducible.

## Decision Drivers

- Same inputs give the same answer
- Every non-green status explains itself
- No floating-point threshold drift
- Time-zone-correct overdue calculation

## Considered Options

1. Pure rule function evaluated at an explicit clock, returning status plus reasons
2. Stored health column updated by triggers
3. Weighted score

## Decision Outcome

Chosen option: **pure rule function** `evaluateProjectHealth(input, { now, timezone })` in `apps/api/src/modules/projects/domain/project-health.ts` (implemented, 100 % branch coverage). "Today" is the calendar date of `now` in the project time zone.

| Status    | Rule (reason code)                                                                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COMPLETED | project status is `COMPLETED` (`PROJECT_COMPLETED`); short-circuits                                                                                            |
| AT_RISK   | an open (`OPEN`/`IN_PROGRESS`) launch-blocking risk item (`LAUNCH_BLOCKING_ISSUE_OPEN`)                                                                        |
| AT_RISK   | a required milestone not `ACCEPTED` whose target date is before today (`REQUIRED_MILESTONE_OVERDUE`)                                                           |
| AT_RISK   | overdue required tasks > 20 % of required tasks (`OVERDUE_TASKS_ABOVE_THRESHOLD`)                                                                              |
| WATCH     | 1-20 % of required tasks overdue (`OVERDUE_TASKS_PRESENT`)                                                                                                     |
| WATCH     | go-live within 7 days with required tasks outstanding (`GO_LIVE_WITHIN_7_DAYS`) or go-live date passed with required tasks outstanding (`GO_LIVE_DATE_PASSED`) |
| ON_TRACK  | none of the above                                                                                                                                              |

A task is overdue when it is required, not `DONE`, and its due date is before today. Percentages are compared by integer cross-multiplication (`overdue * 100 > 20 * total`) and reported in basis points. Zero rule: with no required tasks the overdue share is 0 and task rules do not fire. All triggered reasons are returned, AT_RISK first, each with the ids of the triggering records. Health is computed on read from SQL records (LD-046), not stored, so it can never be stale.

## Consequences

### Positive

- Fully explainable in the UI
- Unit tests pin every rule and the 20 % boundary

### Negative

- Computing on read costs a few aggregate queries per project; portfolio views batch them

## Links

- [System design](../design/system-design.md)
- LD-020, LD-046
