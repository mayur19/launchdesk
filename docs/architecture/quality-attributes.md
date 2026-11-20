# Quality attributes

Measurable non-functional targets for the MVP. "Now" describes what the current code base already
guarantees; "Planned" items are tracked by the ticket shown. Reference load: one provider tenant
with 100 active projects, 5,000 tasks, 50 concurrent users, on a 2 vCPU / 4 GB host.

## Security

| Target                | Measure                                                                   | Now                                       | Planned                                              |
| --------------------- | ------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| No cross-tenant reads | 0 endpoints return another tenant's data; unknown/foreign ids return 404  | Integration tests for customers           | Isolation regression suite over every route (LD-063) |
| No customer leakage   | Customer roles never receive provider-only tasks, comments, files, events | Customer roles get 403 on provider routes | Query-layer filtering (LD-051), L-06, L-15           |
| Passwords             | scrypt, per-user salt, constant-time compare                              | Implemented                               | -                                                    |
| Sessions              | httpOnly, SameSite=Lax, Secure in production, TTL 480 min default         | Implemented                               | Idle timeout (LD-012)                                |
| CSRF                  | Origin check + HMAC token on unsafe methods                               | Implemented                               | -                                                    |
| Brute force           | Login limited to 10 req/min/IP; API 300 req/min/IP                        | Implemented                               | -                                                    |
| Uploads               | Allow-list, size cap 10 MB, never executed, download as attachment        | -                                         | LD-041, LD-042                                       |
| Secrets               | None in git; gitleaks in CI                                               | Implemented                               | -                                                    |
| Standard              | OWASP ASVS L2 for authentication, session, access control                 | Partially                                 | See [threat model](../security/threat-model.md)      |

## Performance

| Operation                          | p95 target (reference load)                 | Notes                                                                              |
| ---------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `GET /customers` (25 rows)         | < 100 ms                                    | Index `(organization_id, created_at, id)`, unique `(organization_id, lower(name))` |
| `POST /customers`                  | < 150 ms                                    | One transaction, two inserts                                                       |
| `GET /projects` with filters       | < 200 ms                                    | Indexes on `(organization_id, status)`, `(customer_id, status)` (LD-022)           |
| Project health for one project     | < 50 ms                                     | Computed on read; pure function is O(tasks + milestones + risks)                   |
| Portfolio dashboard (100 projects) | < 500 ms                                    | Batched aggregate queries (LD-049)                                                 |
| Add dependency (500-task project)  | < 150 ms                                    | Load graph + DFS, O(V + E)                                                         |
| File download start                | < 200 ms                                    | Streamed from disk                                                                 |
| Web initial load                   | < 2 s on broadband, JS bundle < 200 kB gzip | Currently 129 kB gzip                                                              |

## Availability and resilience

- Target availability (production plan): 99.5 % monthly, excluding announced maintenance.
- Liveness `/api/health/live` never touches the database; readiness `/api/health/ready` returns 503
  when PostgreSQL is unreachable so load balancers drain the instance.
- Graceful shutdown on SIGTERM: stop accepting connections, finish in-flight requests, close the pool.
- Reminder worker is idempotent and lock-protected so restarts and multiple instances are safe (ADR-0012).

## Scalability

- Stateless API instances (sessions in PostgreSQL), so horizontal scaling behind a load balancer works
  without sticky sessions.
- Expected tenant size: < 500 projects and < 50,000 tasks per provider. Beyond that, see the scaling
  path in [system design](../design/system-design.md#future-scaling-path).
- File storage moves from local disk to object storage behind the same service interface when more
  than one host is required (ADR-0011).

## Observability

| Signal                                                               | Now                       | Planned                                     |
| -------------------------------------------------------------------- | ------------------------- | ------------------------------------------- |
| Structured JSON logs with request id, redacted cookies and passwords | Implemented               | Ship to central log store (deployment plan) |
| Request id echoed in `X-Request-Id` and error bodies                 | Implemented               | -                                           |
| Health probes                                                        | Implemented               | -                                           |
| Metrics (request rate, latency histogram, error rate, pool usage)    | -                         | Prometheus endpoint (LD-065)                |
| Audit trail of state changes                                         | Implemented for customers | All modules                                 |

## Accessibility

- WCAG 2.1 AA for every screen: semantic landmarks, labelled form controls, visible focus,
  keyboard-operable dialogs and boards, colour contrast >= 4.5:1, status messages via `role="status"`
  and errors via `role="alert"`.
- Now: login, shell and customers screen follow these rules (labelled inputs, table caption, scoped headers).
- Planned: automated axe checks in Playwright and a full review (LD-064).

## Data retention

| Data                                        | Retention                                                        |
| ------------------------------------------- | ---------------------------------------------------------------- |
| Projects, tasks, milestones, reviews, risks | Retained indefinitely; archive instead of delete (FR-10)         |
| Customer accounts                           | Soft-archived (`archived_at`), never hard-deleted through the UI |
| Audit events                                | Minimum 7 years; append-only                                     |
| Sessions                                    | Deleted when expired (housekeeping job)                          |
| Notifications                               | 12 months, then purged                                           |
| Uploaded files                              | Retained with their project; older versions kept                 |

## Backup and restore

| Objective             | Target                                                                          |
| --------------------- | ------------------------------------------------------------------------------- |
| RPO (production plan) | 15 minutes (managed PostgreSQL point-in-time recovery + file storage snapshots) |
| RTO (production plan) | 2 hours                                                                         |
| Local development     | `pg_dump` / `pg_restore` procedure in the [runbook](../operations/runbook.md)   |

Backups must include both the database and `UPLOAD_DIR`; a restore test is performed quarterly.
