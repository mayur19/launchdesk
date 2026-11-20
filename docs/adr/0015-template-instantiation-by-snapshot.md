# ADR-0015: Template instantiation by snapshot

- **Status:** Proposed
- **Date:** 2026-11-20

## Context

Projects are created from reusable templates (FR-02, FR-03). Later edits to a template must not modify existing projects (L-03), and projects must remain auditable against what was agreed with the customer.

## Decision Drivers

- Existing projects never change silently
- Templates stay freely editable
- Traceability back to the source template

## Considered Options

1. Deep-copy snapshot into project-owned rows at creation
2. Reference template rows and copy-on-write
3. Versioned immutable templates referenced by projects

## Decision Outcome

Chosen option: **deep-copy snapshot** (LD-023). Inside one transaction, project creation copies phases, tasks (with owner side, evidence and visibility flags), dependencies (re-keyed to new task ids and validated by the dependency graph module) and milestones into project tables, computing due dates from `kickoff_on + due_offset_days` in the project time zone. The project keeps `template_id` and the template `version` for traceability only; no query joins project data back to template rows. Templates carry an incrementing `version` bumped on every edit.

## Consequences

### Positive

- L-03 holds by construction
- Projects can be customised freely after creation

### Negative

- Improvements to a template do not reach running projects (by design); a future "apply template changes" flow would need explicit diff and confirmation

## Links

- ADR-0014
- LD-014, LD-015, LD-023
