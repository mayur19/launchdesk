# Architecture Decision Records

Decisions are recorded in [MADR](https://adr.github.io/madr/) format (see ADR-0001).
`Accepted` decisions are implemented or in force; `Proposed` decisions describe the agreed design for pending tickets.

| ADR                                                          | Title                                                    | Status   |
| ------------------------------------------------------------ | -------------------------------------------------------- | -------- |
| [0001](0001-record-architecture-decisions.md)                | Record architecture decisions                            | Accepted |
| [0002](0002-modular-monolith-with-npm-workspaces.md)         | Modular monolith with npm workspaces                     | Accepted |
| [0003](0003-multi-tenancy-row-level-organization-scoping.md) | Multi-tenancy with row-level organization scoping        | Accepted |
| [0004](0004-postgresql-and-forward-only-sql-migrations.md)   | PostgreSQL and forward-only SQL migrations               | Accepted |
| [0005](0005-session-authentication-scrypt-and-csrf.md)       | Session authentication with scrypt and CSRF protection   | Accepted |
| [0006](0006-api-conventions.md)                              | API conventions                                          | Accepted |
| [0007](0007-role-based-access-control.md)                    | Role-based access control and permission matrix          | Accepted |
| [0008](0008-append-only-audit-trail.md)                      | Append-only audit trail                                  | Accepted |
| [0009](0009-configuration-and-secrets-management.md)         | Configuration and secrets management                     | Accepted |
| [0010](0010-testing-strategy.md)                             | Testing strategy                                         | Accepted |
| [0011](0011-local-file-attachment-storage.md)                | Local file attachment storage                            | Proposed |
| [0012](0012-in-app-notifications-and-background-worker.md)   | In-app notifications and background worker               | Proposed |
| [0013](0013-dual-portal-access-model.md)                     | Dual-portal access model for provider and customer users | Accepted |
| [0014](0014-task-dependency-graph-and-cycle-prevention.md)   | Task dependency graph and cycle prevention               | Accepted |
| [0015](0015-template-instantiation-by-snapshot.md)           | Template instantiation by snapshot                       | Proposed |
| [0016](0016-rule-based-project-health.md)                    | Rule-based project health                                | Accepted |
| [0017](0017-milestone-acceptance-workflow-with-evidence.md)  | Milestone acceptance workflow with evidence              | Proposed |

To add a decision, copy the structure of an existing ADR, take the next number and open a pull request.
