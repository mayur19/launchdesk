# Backlog

Source of truth for planned work. `backlog.json` holds the same tickets in machine-readable form
(used to create GitHub issues) and must stay identical to this table. Estimates are focused
engineering hours. Ticket ids are referenced from code (`TODO(LD-xxx)`, `pendingRouter`),
the OpenAPI contract (`x-ticket`) and the web navigation.

## Milestones

| ID  | Title                                  | Description                                                                                                                       |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| M0  | M0: Foundation                         | Monorepo, tooling, authentication, tenancy, audit, health checks, launcher and engineering documentation.                         |
| M1  | M1: Customers and templates            | Customer accounts and contacts, provider/customer memberships, reusable implementation templates and the dependency graph domain. |
| M2  | M2: Projects and tasks                 | Template snapshot instantiation, project lifecycle, tasks, subtasks, dependencies, comments and schedule rebaseline.              |
| M3  | M3: Milestones and evidence            | Milestone submission gates, immutable customer review rounds, local file storage and deliverable versioning.                      |
| M4  | M4: Risks, health and launch           | Risk and blocker register, rule-based project health from SQL, progress, portfolio dashboard and launch gates.                    |
| M5  | M5: Customer portal and communications | Customer portal with query-layer visibility filtering, activity timeline, in-app notifications and work queue.                    |
| M6  | M6: Reporting and hardening            | Portfolio reporting, CSV export, audit history, demo dataset, acceptance suite, accessibility and deployment.                     |

## Tickets

| ID     | Title                                                                 | Milestone | PRD refs                 | Estimate (h) | Status     | Depends on                     |
| ------ | --------------------------------------------------------------------- | --------- | ------------------------ | -----------: | ---------- | ------------------------------ |
| LD-001 | Set up monorepo, tooling and CI pipeline                              | M0        | §2                       |            4 | ✅ Done    | -                              |
| LD-002 | Implement forward-only migration runner and foundation schema         | M0        | §6, FR-10                |            3 | ✅ Done    | LD-001                         |
| LD-003 | Implement session authentication with scrypt, CSRF and rate limiting  | M0        | §2, §3                   |            5 | ✅ Done    | LD-002                         |
| LD-004 | Add error envelope, request ids, health checks and structured logging | M0        | §7                       |            3 | ✅ Done    | LD-001                         |
| LD-005 | Provide run.sh launcher and development environment bootstrap         | M0        | §2                       |            2 | ✅ Done    | LD-002                         |
| LD-006 | Define LaunchDesk actor model and role constraint migration           | M0        | §3, FR-01                |            2 | ✅ Done    | LD-002                         |
| LD-007 | Write architecture documentation, ADRs and engineering backlog        | M0        | §10, §11                 |            4 | ✅ Done    | -                              |
| LD-008 | Customer accounts API: list, create and get (tenant-scoped)           | M1        | FR-01                    |            4 | ✅ Done    | LD-006                         |
| LD-009 | Customer accounts screen with list and create form                    | M1        | FR-01, §4.16             |            3 | ✅ Done    | LD-008                         |
| LD-010 | Seed development tenants, demo users and customer accounts            | M1        | §8, FR-01                |            2 | ✅ Done    | LD-006                         |
| LD-011 | Customer account update and soft archive                              | M1        | FR-01                    |            3 | ⏳ Pending | LD-008                         |
| LD-012 | Provider and customer membership model for multi-entity users         | M1        | FR-01, §3, §6            |            5 | ⏳ Pending | LD-006                         |
| LD-013 | Customer contacts API and screen                                      | M1        | FR-01                    |            4 | ⏳ Pending | LD-008, LD-012                 |
| LD-014 | Template schema migration                                             | M1        | FR-02, §6                |            3 | ⏳ Pending | LD-002                         |
| LD-015 | Template CRUD and duplicate API                                       | M1        | FR-02                    |            5 | ⏳ Pending | LD-014                         |
| LD-016 | Template validation endpoint with acyclic dependency check            | M1        | FR-02                    |            2 | ⏳ Pending | LD-015, LD-021                 |
| LD-017 | Template library and builder screens                                  | M1        | FR-02, §4.15             |            6 | ⏳ Pending | LD-015                         |
| LD-018 | Seed implementation templates                                         | M1        | FR-02, §8                |            2 | ⏳ Pending | LD-015                         |
| LD-019 | Shared permission matrix for object-level checks                      | M1        | §3                       |            3 | ⏳ Pending | LD-006                         |
| LD-020 | Rule-based project health calculator (pure domain)                    | M1        | FR-09, L-11, L-12        |            3 | ✅ Done    | LD-006                         |
| LD-021 | Task dependency graph domain: cycle detection and topological order   | M1        | FR-04, FR-02, L-04, L-05 |            4 | ✅ Done    | LD-006                         |
| LD-022 | Project, phase, task and dependency schema migration                  | M2        | FR-03, FR-04, §6         |            3 | ⏳ Pending | LD-014                         |
| LD-023 | Template snapshot instantiation on project creation                   | M2        | FR-02, FR-03, L-02, L-03 |            5 | ⏳ Pending | LD-015, LD-022                 |
| LD-024 | Projects API: list and get with filters and optimistic locking        | M2        | FR-03, FR-09, L-16       |            4 | ⏳ Pending | LD-022                         |
| LD-025 | New-project wizard with schedule preview                              | M2        | FR-03, §4.3              |            5 | ⏳ Pending | LD-023                         |
| LD-026 | Project list screen with search and filters                           | M2        | FR-09, §4.4              |            3 | ⏳ Pending | LD-024                         |
| LD-027 | Project overview screen                                               | M2        | FR-09, §4.5              |            3 | ⏳ Pending | LD-024, LD-046                 |
| LD-028 | Project lifecycle state machine and transition endpoint               | M2        | FR-03                    |            4 | ⏳ Pending | LD-024                         |
| LD-029 | Tasks API with subtasks and optimistic locking                        | M2        | FR-04                    |            5 | ⏳ Pending | LD-022                         |
| LD-030 | Task dependency endpoints backed by the graph domain                  | M2        | FR-04, L-04              |            3 | ⏳ Pending | LD-021, LD-029                 |
| LD-031 | Task transitions with dependency gate and manager override            | M2        | FR-04, L-05              |            4 | ⏳ Pending | LD-030                         |
| LD-032 | Task list screen with hierarchy                                       | M2        | FR-04, §4.6              |            4 | ⏳ Pending | LD-029                         |
| LD-033 | Kanban board by task status                                           | M2        | FR-04, §4.7              |            4 | ⏳ Pending | LD-031                         |
| LD-034 | Task detail page with checklist, dependencies and comments            | M2        | FR-04, §4.9              |            5 | ⏳ Pending | LD-029, LD-035                 |
| LD-035 | Task comments API with visibility                                     | M2        | FR-04, FR-07             |            3 | ⏳ Pending | LD-029                         |
| LD-036 | Schedule rebaseline with preview and confirmation                     | M2        | FR-03, L-17              |            4 | ⏳ Pending | LD-029                         |
| LD-037 | Milestone schema and API                                              | M3        | FR-05, §6                |            3 | ⏳ Pending | LD-022                         |
| LD-038 | Milestone submission gate                                             | M3        | FR-05, L-08              |            4 | ⏳ Pending | LD-037, LD-041                 |
| LD-039 | Milestone decision with immutable review rounds                       | M3        | FR-05, L-09, L-10        |            4 | ⏳ Pending | LD-038                         |
| LD-040 | Milestones timeline screen                                            | M3        | FR-05, §4.8              |            3 | ⏳ Pending | LD-037                         |
| LD-041 | Local file storage service with type and size validation              | M3        | FR-08                    |            4 | ⏳ Pending | LD-002                         |
| LD-042 | Task and project file endpoints with visibility-enforced download     | M3        | FR-08, L-07, L-18        |            5 | ⏳ Pending | LD-041, LD-029                 |
| LD-043 | Deliverable version history and shared files screen                   | M3        | FR-08, §4.10             |            4 | ⏳ Pending | LD-042                         |
| LD-044 | Customer milestone acceptance page                                    | M3        | FR-05, §4.14             |            3 | ⏳ Pending | LD-039                         |
| LD-045 | Risk and blocker register API                                         | M4        | FR-06                    |            4 | ⏳ Pending | LD-022                         |
| LD-046 | Project health and progress from SQL records                          | M4        | FR-09, L-11, L-12        |            3 | ⏳ Pending | LD-020, LD-045, LD-037         |
| LD-047 | Risk register screen                                                  | M4        | FR-06, §4.11             |            3 | ⏳ Pending | LD-045                         |
| LD-048 | Launch gates for READY_FOR_LAUNCH and LIVE                            | M4        | FR-03, L-13, L-14        |            4 | ⏳ Pending | LD-028, LD-039, LD-045         |
| LD-049 | Portfolio dashboard with health and upcoming go-lives                 | M4        | FR-09, §4.2, L-01        |            5 | ⏳ Pending | LD-046                         |
| LD-050 | Role-specific home routing for provider and customer users            | M4        | §4.1, §3                 |            2 | ⏳ Pending | LD-006                         |
| LD-051 | Customer portal API with query-layer visibility filtering             | M5        | FR-07, L-06, L-15        |            5 | ⏳ Pending | LD-029, LD-037                 |
| LD-052 | Customer portal home and project portal screens                       | M5        | FR-07, §4.12, §4.13      |            5 | ⏳ Pending | LD-051                         |
| LD-053 | Project activity timeline and decision register                       | M5        | FR-10, §4.17             |            4 | ⏳ Pending | LD-022                         |
| LD-054 | In-app notifications and idempotent reminder worker                   | M5        | FR-07, FR-10             |            5 | ⏳ Pending | LD-029, LD-037                 |
| LD-055 | Notifications and personal work queue screen                          | M5        | FR-07, §4.19             |            3 | ⏳ Pending | LD-054                         |
| LD-056 | Portfolio reports API                                                 | M6        | FR-09                    |            5 | ⏳ Pending | LD-046                         |
| LD-057 | CSV export of filtered project data                                   | M6        | FR-09, L-19              |            3 | ⏳ Pending | LD-056                         |
| LD-058 | Reporting screen with charts                                          | M6        | FR-09, §4.18             |            4 | ⏳ Pending | LD-056                         |
| LD-059 | Audit log API and team and settings screen                            | M6        | FR-10, §4.20             |            4 | ⏳ Pending | LD-012                         |
| LD-060 | Full demonstration dataset and golden scenario seed                   | M6        | §8                       |            5 | ⏳ Pending | LD-018, LD-023, LD-039, LD-045 |
| LD-061 | Playwright acceptance suite L-01 to L-10                              | M6        | §9                       |            6 | ⏳ Pending | LD-060                         |
| LD-062 | Playwright acceptance suite L-11 to L-19                              | M6        | §9                       |            6 | ⏳ Pending | LD-060                         |
| LD-063 | Tenant and customer isolation regression suite                        | M6        | §3, L-06, L-15, L-16     |            4 | ⏳ Pending | LD-051                         |
| LD-064 | Accessibility and responsive UX pass                                  | M6        | §4                       |            4 | ⏳ Pending | LD-052                         |
| LD-065 | Production container image and deployment pipeline                    | M6        | §2                       |            5 | ⏳ Pending | LD-001                         |

## Totals

| Metric                |  Value |
| --------------------- | -----: |
| Tickets               |     65 |
| Done tickets          |     12 |
| Pending tickets       |     53 |
| Done hours            |     39 |
| Pending hours         |    211 |
| Total hours           |    250 |
| % complete (by hours) | 15.6 % |

Ticket descriptions and acceptance criteria are in [`backlog.json`](backlog.json).
