# User stories

Stories per PRD §3 role, with acceptance criteria, PRD references and delivering tickets.
Status: ✅ implemented, ⏳ pending.

## Provider Admin

**US-01: Manage customer accounts** ✅ (FR-01; LD-008, LD-009)
As a Provider Admin, I want to create customer accounts with name, industry, website and primary
contact so that projects can be set up for them.

- Given I am a Provider Admin, when I submit a valid name, then the account is created, listed and audited.
- Duplicate names (case-insensitive) in my organization are rejected with a clear message.
- Other provider organizations never see my customers; requesting one by id returns 404.

**US-02: Archive a customer** ⏳ (FR-01; LD-011)
As a Provider Admin, I want to archive a customer so that no new projects are created for them while
history is retained.

- Archived customers are hidden from the new-project wizard and rejected by the API (422).
- Existing projects and history remain readable.

**US-03: Maintain templates** ⏳ (FR-02; LD-015 to LD-017)
As a Provider Admin, I want to build and duplicate implementation templates so that every project
starts from our best practice.

- Saving a template with a dependency cycle is rejected and shows the cycle path.
- Duplicating creates an independent copy.

**US-04: Review audit history and team** ⏳ (FR-10, §4.20; LD-059)
As a Provider Admin, I want a read-only audit history so that I can answer who changed what and when.

- Entries show actor, action, entity, time; they cannot be edited.

## Implementation Manager

**US-05: Create a project from a template** ⏳ (FR-02, FR-03, L-02, L-03; LD-023, LD-025)
As an Implementation Manager, I want to create a project by choosing customer, template, dates and
owner so that the plan is generated with calculated due dates.

- The wizard previews tasks, milestones, owner side and due dates before creation.
- Later template edits do not change the project.

**US-06: Gate task completion on dependencies** ⏳ (FR-04, L-04, L-05; LD-021 ✅ domain, LD-030, LD-031)
As an Implementation Manager, I want task completion blocked while predecessors are open, unless I
override with a reason, so that status reflects genuine completion.

- Adding a dependency that creates a cycle returns 422 with the cycle path.
- Completing a blocked task returns 422 listing incomplete predecessors; a manager override with a
  reason succeeds and is audited.

**US-07: Submit milestones for acceptance** ⏳ (FR-05, L-08; LD-038)
As an Implementation Manager, I want to submit a milestone only when its tasks and evidence are
complete so that customers review finished work.

- Incomplete submissions are rejected listing missing tasks and evidence.

**US-08: See transparent project health** ⏳ (FR-09, L-11, L-12; LD-020 ✅ rules, LD-046, LD-027)
As an Implementation Manager, I want project health with the reasons behind it so that I can act on
the right problem.

- An open launch-blocking risk makes the project AT_RISK and names the risk.
- Resolving it recalculates health deterministically.

**US-09: Control go-live** ⏳ (FR-03, L-13, L-14; LD-048)
As an Implementation Manager, I want go-live to require all launch gates and my confirmation so that
launches are never premature.

- Early transition is denied with unmet gates listed; a valid go-live records the actual date and a decision.

**US-10: Rebaseline the schedule** ⏳ (FR-03, L-17; LD-036)
As an Implementation Manager, I want to preview and confirm a schedule shift so that dates never move silently.

## Provider Contributor

**US-11: Work on assigned tasks** ⏳ (FR-04; LD-029, LD-032, LD-034)
As a Provider Contributor, I want to update my tasks, checklists and estimates and attach evidence so
that progress is visible.

- I cannot accept milestones on behalf of the customer or change permissions.

**US-12: Look up customer details** ✅ (FR-01; LD-008, LD-009)
As a Provider Contributor, I want to see the customer list so that I know who I am working with.

- I can list and search customers but cannot create them (no form shown; API returns 403).

## Customer Owner

**US-13: See my projects and actions** ⏳ (FR-07, §4.12, §4.13; LD-051, LD-052)
As a Customer Owner, I want a portal with my projects, pending tasks and milestones so that I know
exactly what my team must do.

- Only my customer account's projects and customer-visible items appear.

**US-14: Accept or reject milestones** ⏳ (FR-05, L-09, L-10; LD-039, LD-044)
As a Customer Owner, I want to accept or reject a submitted milestone with feedback so that sign-off
is explicit and recorded.

- Rejection requires feedback and keeps the history; acceptance records me and the time.

**US-15: Never see other clients** ✅ partially (§3, L-15; LD-008 ✅, LD-051, LD-063)
As a Customer Owner, I must never see other customers of the provider.

- Customer accounts endpoints return 403 for customer users ✅; another customer's project returns 404 without metadata ⏳.

## Customer Member

**US-16: Complete customer tasks with evidence** ⏳ (FR-07, FR-08, L-07; LD-042, LD-051)
As a Customer Member, I want to upload requested files to my tasks and comment so that the provider
can proceed.

- Uploaded files are visible to my organization and the provider, not to other customers.

**US-17: No access to internal material** ⏳ (§3, L-06; LD-051)
As a Customer Member, opening a provider-only task by URL shows "not found" and leaks nothing.

## All users

**US-18: Sign in securely** ✅ (§2; LD-003)
As any user, I want to sign in with email and password and land on a home page for my role.

- Wrong credentials show a generic error; sessions expire; sign-out ends the session.

**US-19: In-app notifications** ⏳ (FR-07, FR-10; LD-054, LD-055)
As any user, I want notifications for assignments, approval requests, rejections and changed
deadlines so that nothing stalls.
