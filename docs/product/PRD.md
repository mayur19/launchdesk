# LaunchDesk — B2B Customer Onboarding & Implementation SaaS

**Document type:** Implementation-ready product requirements document (PRD)  
**Version:** 1.0 · 20 November 2026  
**Delivery target:** Working MVP (see docs/planning/roadmap.md for phased estimates).  
**Primary delivery:** A polished, multi-tenant implementation-management web app with provider and customer portals, milestone workflows and automated tests.

## 1. Product brief

LaunchDesk is a shared workspace for B2B software vendors, IT service providers and agencies that onboard customers through multi-step implementation projects. The provider manages a reusable onboarding template, project tasks, dependencies, milestone approvals, customer-owned actions, documentation, risks and launch readiness. Customers see a focused portal showing exactly what they must do and when.

**One-sentence promise:** Get every customer from signed contract to successful launch with fewer status meetings and fewer stalled handoffs.

**Initial buyer:** A B2B software company or implementation agency onboarding 5–100 customers per year with at least 2–3 internal contributors per project.  
**Commercial category reference:** Rocketlane and similar customer-onboarding platforms are paid products. Their existence demonstrates a commercial category, not guaranteed product-market fit for LaunchDesk.  
**Initial pricing hypothesis:** $79–199/month per provider organization, with a project or active-client limit.

### Core problems to solve

- An onboarding spreadsheet is hard to maintain across vendors, customer stakeholders, tasks and documents.
- Customer tasks stall because responsibility and next action are unclear.
- Teams cannot distinguish genuine completion from optimistic manual status updates.
- Approvals and project decisions are scattered across chat and email.
- Leaders need a reliable portfolio-level view of risks and late go-lives.

### Success measures (in-app, not claimed business results)

1. Percentage of projects with an explicit go-live date and accountable manager.
2. Number of overdue tasks by responsible side (provider vs customer).
3. Average days from kickoff to completed onboarding (for completed projects only).
4. Percentage of milestones accepted by customer and with supporting evidence.
5. Number of customer blockers and days open.

### Not included in MVP

No CRM integration, external calendar sync, email or Slack notifications, e-signing, public client self-signup, payment handling, Zoom/video calls, true real-time coediting, automatically generated plans, workload/resource optimization or third-party API use.

## 2. Sandbox constraints and technical contract

The application must run on a Linux desktop with Node.js 22, npm from a limited mirror, local PostgreSQL/SQLite, Chrome and Playwright. It cannot depend on the public internet, Docker, GPU, apt-get, remote package CDNs, hosted identity services or paid APIs.

Suggested stack:

- **UI:** React + Vite, local CSS and locally bundled icons if available.
- **API:** Node.js + Express, REST JSON, server-side validation.
- **DB:** PostgreSQL using `pg`, with scripts to start the existing local server. A validated SQLite alternative is permitted if needed by the runtime.
- **Authentication:** Local username/email and hashed password, secure cookie sessions, per-organization memberships, CSRF defense and session expiration.
- **Files:** Restricted local filesystem uploads; SQL metadata. No cloud buckets.
- **Reminders:** Durable in-app notifications and a local idempotent periodic checker; no claims of actual sent email.
- **Testing:** Playwright browser tests against real SQL data, plus unit tests for dates, dependencies and project health.
- **Build:** Node/npm commands and an `.env.example`, migrations, seed script, test and reset commands. No Docker or remote services.

Every screen must work offline once packages have been installed from the mirror. Assets must not load from external URLs.

## 3. Actor model and authorization

A **provider organization** is the paying tenant. A **customer account** can participate in several provider-created projects but never acquires provider-global visibility. One project belongs to exactly one provider organization and one customer account.

| Role                   | Capabilities                                                                              | Restrictions                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Provider Admin         | Team, templates, organization settings, project oversight, reports                        | No access outside own provider org                             |
| Implementation Manager | Create/manage projects, assign tasks, configure milestones, resolve blockers              | Cannot change provider admin settings                          |
| Provider Contributor   | Work on assigned project tasks, update estimates, attach evidence, comment                | Cannot change customer acceptance or global permissions        |
| Customer Owner         | See own customer's projects, perform customer tasks, approve/reject milestone submissions | Cannot see provider internal notes or other clients            |
| Customer Member        | Work on tasks assigned to their customer account; upload artifacts; comment               | Cannot approve milestones unless explicitly granted owner role |

Access control MUST be object-level: project membership is checked for task, file, comment, milestone and event access. An internal-only object must never be returned to customer users even if they guess its ID.

## 4. Required application screens

1. Login and role-specific home.
2. Provider portfolio dashboard with health and upcoming go-lives.
3. New-project wizard: select customer, template, dates, owner.
4. Project list with search, owner/customer/health/status filters.
5. Project overview: progress, phase, key dates and next actions.
6. Project task list with hierarchy, owner, due date and status.
7. Project Kanban board by task status.
8. Milestones timeline and approval state.
9. Task detail drawer/page: checklist, dependencies, comments, evidence.
10. Project shared files with access classification.
11. Risks/blockers/issues register with severity, owner and next action.
12. Customer portal home across customer-accessible projects.
13. Customer project portal: deliverables, pending tasks, milestones and comments.
14. Customer milestone acceptance/rejection page.
15. Template library and editable template builder.
16. Customer accounts and contacts.
17. Project activity timeline and decision register.
18. Portfolio reporting and CSV exports.
19. In-app notifications and personal work queue.
20. Provider team/settings and audit history.

UI should feel like a real B2B SaaS: clear provider/customer visual separation, thoughtful empty states, responsive tables, keyboard-accessible dialogs, working deep links and useful sample data.

## 5. Functional requirements

### FR-01 — Provider tenancy and customer accounts (P0)

- Provider admin can create customer accounts with name, industry, website text, primary contact and active/archived status.
- Provider and customer users have separately scoped memberships; a user may belong to multiple provider/customer entities.
- Managers add customer contacts to particular projects and assign their project roles.
- No email invitation is sent. Development/demo credentials are provisioned within the application and marked as local-only.
- Soft archive prevents creation of new projects for archived customers but retains historical work.

### FR-02 — Reusable implementation templates (P0)

- Template contains project name, phases, milestones, tasks, recommended duration offsets, dependencies, owner-side (`PROVIDER` or `CUSTOMER`) and required evidence rules.
- CRUD templates and duplicate an existing template.
- Validate tasks form a directed acyclic dependency graph; reject cycles before saving.
- Instantiate a **snapshot** of the template on new-project creation. Later edits to a template do not modify existing projects.
- Seed templates such as 'SaaS Account Setup', 'Data Migration', and 'Security Review + Go-Live'.

### FR-03 — Project creation and life cycle (P0)

- Create project using a customer, template, provider manager, kickoff date, target go-live and customer stakeholders.
- Lifecycle: `DRAFT → ACTIVE → READY_FOR_LAUNCH → LIVE → COMPLETED`; `ON_HOLD` and `CANCELLED` transitions require reasons.
- Project wizard previews generated tasks, milestones, responsible side and calculated due dates.
- Restrict `READY_FOR_LAUNCH` until all mandatory launch-blocking tasks are complete and required milestones accepted.
- Restrict `LIVE` until an authorized manager confirms readiness; record launch date and a decision log.
- Changing target go-live does not silently move due dates; offer an explicit 'rebaseline schedule' action with preview and audit entry.

### FR-04 — Tasks, subtasks and dependencies (P0)

- Task attributes: title, description, phase, provider/customer ownership, individual assignee, start date, due date, priority, estimated hours, status, blocker reason, visibility and required evidence flag.
- Statuses: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `IN_REVIEW`, `DONE`.
- A task cannot become `DONE` while mandatory predecessor tasks remain incomplete, unless manager overrides with a documented reason.
- Overdue is computed from due date + task not done/cancelled; compute using project timezone, store timestamps in UTC.
- Support subtasks (one level), comments, checklists and evidence attachments.
- Provider-only tasks/comments are never visible in the customer portal.
- When a task assigned to customer is finished, update provider-side progress without giving the customer access to provider-only material.

### FR-05 — Milestones and customer acceptance (P0)

- Milestone has title, target date, linked required tasks, owner and approval-required flag.
- Statuses: `NOT_READY`, `READY_FOR_REVIEW`, `ACCEPTED`, `REJECTED`.
- Only a manager can submit a ready milestone for acceptance. Submission requires linked tasks to be completed and required evidence present.
- A customer owner can accept or reject with comments; rejection reopens the milestone for revisions and preserves prior review records.
- For milestones without customer acceptance required, manager acceptance is still recorded separately.
- Acceptance history is immutable; resubmission after rejection creates a new review round.

### FR-06 — Risk and blocker register (P0)

- Risk/issue fields: title, type (`RISK`, `ISSUE`, `DECISION`), severity, impact, owner, mitigation/next action, due date, status and optional linked task.
- Issues are separate from ordinary task comments so they appear in a project-level dashboard.
- Blocking issues prevent a milestone or launch only if `launch_blocking=true`; no hardcoded automatic blocker from all risk entries.
- Track open age, mitigation progress and last update.

### FR-07 — Customer workspace and communications (P0)

- Customer sees only their projects, assigned tasks, shared documents, milestones requiring action and public comments.
- Customer can create comments and upload permitted evidence to designated tasks.
- Shared activity timeline includes only customer-visible entries; internal provider notes are excluded at the query layer.
- Notifications in-app for new assignments, requests for approval, rejected milestone and changed deadlines.
- No email, SMS, Slack, or web push integrations in MVP.

### FR-08 — File and deliverable management (P0)

- Upload permitted document/image types with max size and virus-safety caveat; server never executes uploaded files.
- Every file has scope: `INTERNAL` or `SHARED_WITH_CUSTOMER` and a parent project/task/milestone.
- Preserve version history for deliverables as separate file records; display current and older revisions.
- File access enforces tenant, project and visibility permissions on download endpoint.
- Mark required deliverable types on template tasks; completion blocked if mandatory evidence missing.

### FR-09 — Project health and reporting (P0)

- Progress = weighted completion based on required project tasks. Simplest MVP: `completed_required_tasks / total_required_tasks`, with a documented rule for zero required tasks.
- Health indicator is deterministic and transparent, **rule-based**:
  - `AT_RISK` if any launch-blocking issue is open, or a required milestone is overdue, or >20% of active required tasks are overdue.
  - `WATCH` if 1–20% of active required tasks are overdue or go-live is within 7 days and mandatory tasks are outstanding.
  - `ON_TRACK` otherwise.
  - `COMPLETED` for completed projects.
- Show the reasons behind health classification in the UI and allow filters by owner, customer, health and month.
- Reports: planned vs actual go-live, average project cycle duration, overdue tasks by side, most common blockers and acceptance turnaround.
- Charts and KPIs derive from SQL, not fabricated static numbers. Export filtered project/task reports as CSV.

### FR-10 — Activity, audit, and data retention (P0)

- Every important action produces an activity event: task changed, milestone submitted/accepted/rejected, deadline changed, comment added, launch approved.
- Audit event records actor, provider organization, project, event, timestamp and safe context.
- Expose a read-only project history; internal details are visible only to provider members.
- In-app notifications persist and can be marked read.
- Archived projects remain searchable and retained; no hard-delete through the MVP UI.

## 6. Data model (minimum)

- `provider_organizations(id, name, timezone, created_at)`
- `users(id, email_normalized UNIQUE, password_hash, display_name, created_at)`
- `provider_memberships(id, provider_org_id, user_id, role, active)`
- `customer_accounts(id, provider_org_id, name, industry, website_text, primary_contact, archived_at)`
- `customer_memberships(id, provider_org_id, customer_id, user_id, role, active)`
- `implementation_templates(id, provider_org_id, name, description, version, archived_at)`
- `template_phases(id, provider_org_id, template_id, name, sort_order)`
- `template_tasks(id, provider_org_id, template_id, phase_id, key, title, owner_side, due_offset_days, required, evidence_required, customer_visible, sort_order)`
- `template_task_dependencies(id, provider_org_id, template_id, predecessor_task_id, successor_task_id)`
- `template_milestones(id, provider_org_id, template_id, title, target_offset_days, approval_required, required_task_keys_json)`
- `projects(id, provider_org_id, customer_id, template_id, manager_id, name, status, kickoff_on, target_go_live_on, actual_go_live_on, timezone, version)`
- `project_memberships(id, provider_org_id, project_id, user_id, project_role, visibility)`
- `project_phases(id, provider_org_id, project_id, name, sort_order)`
- `project_tasks(id, provider_org_id, project_id, phase_id, parent_task_id NULL, assignee_id NULL, owner_side, title, description, priority, status, start_on, due_on, required, evidence_required, customer_visible, estimated_hours, version)`
- `task_dependencies(id, provider_org_id, project_id, predecessor_task_id, successor_task_id)`
- `task_checklist_items(id, provider_org_id, task_id, text, done_by NULL, done_at NULL)`
- `milestones(id, provider_org_id, project_id, title, target_on, status, approval_required, current_review_round)`
- `milestone_required_tasks(id, provider_org_id, milestone_id, task_id)`
- `milestone_reviews(id, provider_org_id, milestone_id, round, submitted_by, submitted_at, decided_by NULL, decided_at NULL, decision, feedback)`
- `risk_items(id, provider_org_id, project_id, task_id NULL, type, title, severity, owner_id, impact, mitigation, launch_blocking, status, opened_at, resolved_at)`
- `comments(id, provider_org_id, project_id, task_id NULL, milestone_id NULL, author_id, visibility, body, created_at)`
- `files(id, provider_org_id, project_id, task_id NULL, milestone_id NULL, visibility, original_name, stored_name, mime_type, size_bytes, version_number, uploaded_by)`
- `project_events(id, provider_org_id, project_id, actor_id, event_type, visibility, data_json, created_at)`
- `notifications(id, provider_org_id, recipient_id, project_id, type, read_at NULL, created_at)`
- `audit_logs(id, provider_org_id, actor_id, entity_type, entity_id, action, metadata_json, created_at)`

Use FK constraints and indexes on `(provider_org_id, project_id)`, `(provider_org_id, status)`, `(customer_id, status)`, task due dates, and member lookup. Prevent a task from referencing a milestone/project from another organization. Use optimistic locking for project and task updates.

## 7. API contract (illustrative)

- `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
- `/api/customers`, `/api/customers/:id/contacts`
- `/api/templates`, `/api/templates/:id`, `/api/templates/:id/duplicate`, `/api/templates/:id/validate`
- `/api/projects`, `/api/projects/:id`, `/api/projects/:id/rebaseline`, `/api/projects/:id/transition`
- `/api/projects/:id/tasks`, `/api/tasks/:id`, `/api/tasks/:id/transition`, `/api/tasks/:id/comments`, `/api/tasks/:id/files`
- `/api/projects/:id/milestones`, `/api/milestones/:id/submit`, `/api/milestones/:id/decide`
- `/api/projects/:id/risks`, `/api/projects/:id/activity`, `/api/projects/:id/files`
- `/api/customer/projects`, `/api/customer/projects/:id`, `/api/customer/tasks/:id`
- `/api/reports/portfolio`, `/api/reports/export.csv`, `/api/notifications`, `/api/audit-logs`

Require server-side validation and explicit errors for stale writes (`409`), unsatisfied dependencies (`422`), missing required evidence and forbidden access (`403`/`404`). Responses should never include internal notes or hidden files for a customer user.

## 8. Demonstration data and story

Create provider **Northstar Cloud**, implementing a fictional B2B analytics platform, with three customer accounts: **Atlas Retail**, **Blue Harbor Logistics** and **Vela Health**. Seed 8–12 projects across health states and stages, 3 templates, 100+ tasks with dependencies, 20+ milestones, 10 risks and several approval rounds.

Golden demo scenario:

1. Manager creates **Atlas Retail — Production Onboarding** from 'Data Migration + Launch' template.
2. Customer owner sees a 'Provide sample dataset' action in their portal and uploads a CSV.
3. Provider completes migration validation and other required tasks.
4. A blocker is raised when customer sign-off is missing; project health becomes `AT_RISK`.
5. Manager submits a 'Data Validation' milestone; customer rejects with specific feedback.
6. Provider fixes the issue and resubmits a new milestone review round; customer accepts.
7. All launch-blocking tasks and milestones are completed; manager marks `READY_FOR_LAUNCH` and then `LIVE`.
8. Portfolio charts reflect actual project status and timeline.

Provide local demo accounts for provider admin, manager, contributor, customer owner and customer member. Seed a second provider organization to test tenant separation.

## 9. Acceptance criteria and Playwright suite

| Test ID | User journey                                           | Required result                                             |
| ------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| L-01    | Admin signs in and views project portfolio             | Correct persisted data and role-based controls              |
| L-02    | Manager creates project from template                  | Phases, tasks, dependencies and milestones snapshotted      |
| L-03    | Template is changed after project creation             | Existing project's tasks remain unchanged                   |
| L-04    | Create cyclic task dependencies                        | Server rejects cycle                                        |
| L-05    | Complete task while required predecessor incomplete    | Blocked without approved override                           |
| L-06    | Customer member views provider-only task by direct URL | 403/404; no leaked content                                  |
| L-07    | Customer uploads required evidence                     | File persists with correct access policy                    |
| L-08    | Manager submits incomplete milestone                   | Rejected with missing-task/evidence details                 |
| L-09    | Customer rejects milestone                             | New review iteration required; history retained             |
| L-10    | Customer accepts resubmitted milestone                 | Status updates with approver and timestamp                  |
| L-11    | Set blocking risk                                      | Project health becomes AT_RISK with visible reason          |
| L-12    | Resolve risk and overdue task                          | Health recalculates deterministically                       |
| L-13    | Attempt go-live before launch gates                    | API denies change                                           |
| L-14    | Authorized manager completes go-live after gates       | Status and actual date persisted                            |
| L-15    | Customer user queries another customer's project       | Denied without metadata leakage                             |
| L-16    | Provider Org B queries provider Org A project          | Denied                                                      |
| L-17    | Rebaseline schedule                                    | Preview, explicit confirmation, and audit history           |
| L-18    | Restart application and download evidence              | State and files remain accessible under correct permissions |
| L-19    | Export filtered project data                           | CSV matches current authorized filter                       |

Unit tests: dependency graph cycle detection, progress denominator, health rules, local date offsets, milestone completion gates, project status transition matrix. Use real DB-based Playwright E2E tests with deterministic reset/seed.

## 10. Proposed build sequence

| Phase                                | Estimated effort | Deliverable                                         |
| ------------------------------------ | ---------------: | --------------------------------------------------- |
| Authentication + tenancy + SQL       |            4–6 h | Working login, roles, database, base UI             |
| Templates and project creation       |            5–7 h | Snapshot-based templates, wizard, dependencies      |
| Tasks, evidence and comments         |            6–9 h | Provider and customer interactions, access controls |
| Milestones, reviews and launch gates |            5–7 h | Immutable approvals, launch lifecycle               |
| Risks, analytics and polished portal |            4–6 h | Health, reporting, responsive UX                    |
| Playwright + hardening               |            3–7 h | Critical flows tested and documented                |

If implementation runs long, remove Kanban drag-and-drop or advanced reporting first. Preserve customer isolation, evidence access and approval integrity.

## 11. Definition of done

- Both provider and customer views function against the same persisted project model.
- Template → project generation works and preserves an immutable snapshot.
- Dependencies, evidence requirements and milestone approvals actually gate progression.
- Projects cannot be launched via forbidden API calls; a server-authorized flow is required.
- Provider-only information never appears in customer responses, including direct URL access.
- Dashboard values and project health are calculated from SQL records.
- Refresh/restart does not lose tasks, milestones, documents or decisions.
- All critical Playwright journeys pass; README documents setup and limitations.
- No pretend integrations, nonfunctional buttons, or remote runtime dependencies.

## 12. Roadmap beyond the sandbox MVP

CRM import/sync, email and calendar scheduling, external notifications, granular customer branding, repeatable change-request workflows, billing and contract linkage, resource planning, importable template marketplace, customer self-registration and rule-based onboarding suggestions.

---

**Engineering brief:** Build LaunchDesk as two carefully isolated experiences—provider workspace and customer portal—using a single well-defined data model. Prioritize the golden project workflow and prove every authorization boundary with tests before UI polish.
