# Glossary

| Term                        | Definition                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Provider organization**   | The paying tenant: a software vendor, IT service provider or agency that onboards customers. Stored in `organizations`; tenant key `organization_id` (PRD: `provider_org_id`). |
| **Customer account**        | A client of the provider being onboarded (e.g. Atlas Retail). Belongs to exactly one provider organization.                                                                    |
| **Provider roles**          | Provider Admin, Implementation Manager, Provider Contributor.                                                                                                                  |
| **Customer roles**          | Customer Owner (can accept/reject milestones) and Customer Member (works on customer tasks). Bound to one customer account.                                                    |
| **Dual portal**             | The provider workspace and the customer portal: two experiences over one data model with strict visibility rules (ADR-0013).                                                   |
| **Implementation template** | Reusable plan of phases, tasks, dependencies, milestones and evidence rules.                                                                                                   |
| **Snapshot**                | The copy of a template's content made when a project is created; later template edits do not affect it (ADR-0015).                                                             |
| **Project**                 | One implementation for one customer account, created from a template, with a lifecycle from `DRAFT` to `COMPLETED`.                                                            |
| **Phase**                   | Ordered grouping of tasks within a template or project.                                                                                                                        |
| **Task**                    | Unit of work with owner side, assignee, dates, status and visibility. Subtasks are one level deep.                                                                             |
| **Owner side**              | `PROVIDER` or `CUSTOMER`: which party is responsible for a task.                                                                                                               |
| **Dependency**              | Finish-to-start link: the predecessor must be `DONE` before the successor can be completed.                                                                                    |
| **Cycle**                   | A chain of dependencies that leads back to its start; always rejected, with the path reported.                                                                                 |
| **Ready / Blocked**         | Derived task readiness: ready when all predecessors are done, blocked otherwise.                                                                                               |
| **Override**                | A manager's documented decision to complete a task despite incomplete predecessors.                                                                                            |
| **Evidence**                | A file attached to a task or milestone proving completion; may be required.                                                                                                    |
| **Milestone**               | A checkpoint linked to required tasks; may require customer acceptance.                                                                                                        |
| **Review round**            | One submission of a milestone for acceptance and its decision; rounds are immutable.                                                                                           |
| **Launch-blocking**         | Flag on a task or risk item meaning launch cannot proceed while it is open or incomplete.                                                                                      |
| **Launch gates**            | Conditions for `READY_FOR_LAUNCH` and `LIVE`: launch-blocking tasks done, required milestones accepted, no open blocking risks, manager confirmation.                          |
| **Risk item**               | Entry in the register of type `RISK`, `ISSUE` or `DECISION`.                                                                                                                   |
| **Project health**          | Rule-based status `ON_TRACK`, `WATCH`, `AT_RISK` or `COMPLETED` with listed reasons (ADR-0016).                                                                                |
| **Overdue**                 | A task not `DONE` whose due date is before today in the project time zone.                                                                                                     |
| **Progress**                | Completed required tasks divided by total required tasks, in basis points.                                                                                                     |
| **Basis points (bps)**      | Integer hundredths of a percent (1 % = 100 bps); used instead of floating-point ratios.                                                                                        |
| **Rebaseline**              | Explicit, previewed and audited shift of task due dates after a schedule change.                                                                                               |
| **Go-live**                 | The customer's launch date; target and actual dates are tracked separately.                                                                                                    |
| **Visibility**              | `INTERNAL` (provider only) or shared with the customer (`SHARED` / `SHARED_WITH_CUSTOMER`).                                                                                    |
| **Activity event**          | Project timeline entry; customer-visible or internal.                                                                                                                          |
| **Audit event**             | Append-only record of a state change with actor, tenant and request id (ADR-0008).                                                                                             |
| **Pending**                 | Designed but not built: endpoints return 501 with a ticket id; screens show `PendingPage`.                                                                                     |
