# Requirements traceability

Maps PRD functional requirements, screens and acceptance tests to tickets, ADRs, tests and status.
Test paths are relative to the repository root; planned spec names follow the
[test strategy](../testing/test-strategy.md).

## Functional requirements

| Req   | Summary                                                  | Tickets                                                            | ADRs             | Tests                                                                                                                                                                         | Status                                                          |
| ----- | -------------------------------------------------------- | ------------------------------------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| FR-01 | Provider tenancy and customer accounts                   | LD-006 ✅, LD-008 ✅, LD-009 ✅, LD-010 ✅, LD-011, LD-012, LD-013 | 0003, 0007, 0013 | `apps/api/test/customers.db.test.ts`, `customers.service.test.ts`, `integration.db.test.ts`, `packages/shared/test/customers.test.ts`, `apps/web/test/CustomersPage.test.tsx` | Partial (list/create/get ✅; archive, contacts, memberships ⏳) |
| FR-02 | Reusable templates, DAG validation, snapshot             | LD-014, LD-015, LD-016, LD-017, LD-018, LD-021 ✅, LD-023          | 0014, 0015       | `apps/api/test/dependency-graph.test.ts` (DAG rules)                                                                                                                          | Domain ✅; rest ⏳                                              |
| FR-03 | Project creation and lifecycle, launch gates, rebaseline | LD-022, LD-023, LD-024, LD-025, LD-028, LD-036, LD-048             | 0015, 0017       | planned `projects.db.test.ts`, `project-lifecycle.test.ts`                                                                                                                    | ⏳                                                              |
| FR-04 | Tasks, subtasks, dependencies, overdue                   | LD-021 ✅, LD-029, LD-030, LD-031, LD-032, LD-033, LD-034, LD-035  | 0014             | `dependency-graph.test.ts`, `local-date.test.ts`                                                                                                                              | Domain ✅; API/UI ⏳                                            |
| FR-05 | Milestones and customer acceptance                       | LD-037, LD-038, LD-039, LD-040, LD-044                             | 0017             | planned `milestones.db.test.ts`                                                                                                                                               | ⏳                                                              |
| FR-06 | Risk and blocker register                                | LD-045, LD-047                                                     | 0016             | planned `risks.db.test.ts`                                                                                                                                                    | ⏳                                                              |
| FR-07 | Customer workspace and communications                    | LD-035, LD-050, LD-051, LD-052, LD-054                             | 0013, 0012       | `pending-routes.http.test.ts` (customer guards)                                                                                                                               | Guards ✅; portal ⏳                                            |
| FR-08 | Files and deliverables                                   | LD-041, LD-042, LD-043                                             | 0011             | planned `files.db.test.ts`                                                                                                                                                    | ⏳                                                              |
| FR-09 | Project health and reporting                             | LD-020 ✅, LD-046, LD-049, LD-056, LD-057, LD-058                  | 0016             | `apps/api/test/project-health.test.ts`                                                                                                                                        | Health rules ✅; SQL wiring and reports ⏳                      |
| FR-10 | Activity, audit and retention                            | LD-002 ✅, LD-008 ✅ (audit on create), LD-053, LD-054, LD-059     | 0008             | `customers.db.test.ts` (audit row), `customers.service.test.ts` (rollback)                                                                                                    | Audit writer ✅; activity, notifications, audit UI ⏳           |
| §3    | Actor model and object-level access                      | LD-006 ✅, LD-019, LD-063                                          | 0007, 0013       | `packages/shared/test/roles.test.ts`, `integration.db.test.ts`                                                                                                                | Roles ✅; matrix and full suite ⏳                              |

## Screens (PRD §4)

| #   | Screen                          | Route                             | Ticket            | Status                    |
| --- | ------------------------------- | --------------------------------- | ----------------- | ------------------------- |
| 1   | Login and role-specific home    | `/login`, `/`                     | LD-003 ✅, LD-050 | Login ✅, role routing ⏳ |
| 2   | Portfolio dashboard             | `/portfolio`                      | LD-049            | ⏳                        |
| 3   | New-project wizard              | `/projects/new`                   | LD-025            | ⏳                        |
| 4   | Project list                    | `/projects`                       | LD-026            | ⏳                        |
| 5   | Project overview                | `/projects/:projectId`            | LD-027            | ⏳                        |
| 6   | Task list                       | `/projects/:projectId/tasks`      | LD-032            | ⏳                        |
| 7   | Kanban board                    | `/projects/:projectId/board`      | LD-033            | ⏳                        |
| 8   | Milestones timeline             | `/projects/:projectId/milestones` | LD-040            | ⏳                        |
| 9   | Task detail                     | `/tasks/:taskId`                  | LD-034            | ⏳                        |
| 10  | Shared files                    | `/projects/:projectId/files`      | LD-043            | ⏳                        |
| 11  | Risks/blockers register         | `/projects/:projectId/risks`      | LD-047            | ⏳                        |
| 12  | Customer portal home            | `/portal`                         | LD-052            | ⏳                        |
| 13  | Customer project portal         | `/portal/projects/:projectId`     | LD-052            | ⏳                        |
| 14  | Customer milestone acceptance   | `/portal/milestones/:milestoneId` | LD-044            | ⏳                        |
| 15  | Template library and builder    | `/templates`                      | LD-017            | ⏳                        |
| 16  | Customer accounts and contacts  | `/customers`                      | LD-009 ✅, LD-013 | Accounts ✅, contacts ⏳  |
| 17  | Activity timeline and decisions | `/projects/:projectId/activity`   | LD-053            | ⏳                        |
| 18  | Reporting and CSV               | `/reports`                        | LD-058, LD-057    | ⏳                        |
| 19  | Notifications and work queue    | `/notifications`                  | LD-055            | ⏳                        |
| 20  | Team/settings and audit         | `/settings`                       | LD-059            | ⏳                        |

## Acceptance tests (PRD §9)

| Test | Tickets                           | ADRs | Test files                                                                                             | Status    |
| ---- | --------------------------------- | ---- | ------------------------------------------------------------------------------------------------------ | --------- |
| L-01 | LD-049, LD-061                    | 0016 | planned `e2e/tests/l01-portfolio.spec.ts`                                                              | ⏳        |
| L-02 | LD-023, LD-025, LD-061            | 0015 | planned `e2e/tests/l02-create-project.spec.ts`                                                         | ⏳        |
| L-03 | LD-023, LD-061                    | 0015 | planned `e2e/tests/l03-template-snapshot.spec.ts`                                                      | ⏳        |
| L-04 | LD-021 ✅, LD-030, LD-061         | 0014 | `apps/api/test/dependency-graph.test.ts` ✅; planned `e2e/tests/l04-cycle.spec.ts`                     | Domain ✅ |
| L-05 | LD-021 ✅, LD-031, LD-061         | 0014 | `dependency-graph.test.ts` (`checkCompletion`) ✅; planned `e2e/tests/l05-dependency-gate.spec.ts`     | Domain ✅ |
| L-06 | LD-051, LD-061                    | 0013 | planned `e2e/tests/l06-customer-direct-url.spec.ts`                                                    | ⏳        |
| L-07 | LD-042, LD-061                    | 0011 | planned `e2e/tests/l07-evidence-upload.spec.ts`                                                        | ⏳        |
| L-08 | LD-038, LD-061                    | 0017 | planned `e2e/tests/l08-milestone-gate.spec.ts`                                                         | ⏳        |
| L-09 | LD-039, LD-061                    | 0017 | planned `e2e/tests/l09-milestone-reject.spec.ts`                                                       | ⏳        |
| L-10 | LD-039, LD-061                    | 0017 | planned `e2e/tests/l10-milestone-accept.spec.ts`                                                       | ⏳        |
| L-11 | LD-020 ✅, LD-045, LD-046, LD-062 | 0016 | `apps/api/test/project-health.test.ts` ✅; planned `e2e/tests/l11-health-risk.spec.ts`                 | Domain ✅ |
| L-12 | LD-020 ✅, LD-046, LD-062         | 0016 | `project-health.test.ts` ✅; planned `e2e/tests/l12-health-recalc.spec.ts`                             | Domain ✅ |
| L-13 | LD-048, LD-062                    | 0017 | planned `e2e/tests/l13-launch-denied.spec.ts`                                                          | ⏳        |
| L-14 | LD-048, LD-062                    | 0017 | planned `e2e/tests/l14-go-live.spec.ts`                                                                | ⏳        |
| L-15 | LD-008 ✅, LD-051, LD-062, LD-063 | 0013 | `customers.db.test.ts` (403 for customer roles) ✅; planned `e2e/tests/l15-customer-isolation.spec.ts` | Partial   |
| L-16 | LD-008 ✅, LD-024, LD-062, LD-063 | 0003 | `customers.db.test.ts` (cross-tenant 404) ✅; planned `e2e/tests/l16-tenant-isolation.spec.ts`         | Partial   |
| L-17 | LD-036, LD-062                    | 0008 | planned `e2e/tests/l17-rebaseline.spec.ts`                                                             | ⏳        |
| L-18 | LD-042, LD-062                    | 0011 | planned `e2e/tests/l18-restart-persistence.spec.ts`                                                    | ⏳        |
| L-19 | LD-057, LD-062                    | -    | planned `e2e/tests/l19-csv-export.spec.ts`                                                             | ⏳        |
