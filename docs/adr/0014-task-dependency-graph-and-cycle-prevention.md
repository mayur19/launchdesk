# ADR-0014: Task dependency graph and cycle prevention

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

Templates and projects carry finish-to-start task dependencies (FR-02, FR-04). Cycles must be rejected before saving (L-04) and a task cannot be completed while predecessors are incomplete unless a manager overrides with a reason (L-05). Dependencies must never span projects.

## Decision Drivers

- Deterministic, explainable rejections (return the cycle path)
- Pure logic testable without a database
- Safe under concurrent edits

## Considered Options

1. Pure immutable graph module in the API plus row lock on persistence
2. Recursive CTE cycle check in SQL
3. Database trigger

## Decision Outcome

Chosen option: **pure, immutable graph module** `apps/api/src/modules/tasks/domain/dependency-graph.ts` (implemented, 100 % branch coverage):

- `createDependencyGraph(projectId, tasks, edges)` validates persisted data (duplicate or cross-project tasks, cycles).
- `addDependency(graph, edge, external?)` returns a new graph or a typed error: `SELF_DEPENDENCY`, `UNKNOWN_TASK`, `CROSS_PROJECT_TASK`, `DUPLICATE_DEPENDENCY`, or `CYCLE` with the full path (e.g. `c -> a -> b -> c`) found by depth-first search from the successor back to the predecessor.
- `topologicalOrder` (Kahn, ties in insertion order) and `deriveReadiness` produce `READY` / `BLOCKED` / `DONE` from predecessor completion.
- `checkCompletion(graph, taskId, override?)` implements the completion gate; an override requires a non-blank reason.

Every graph value is acyclic by construction. Persistence (LD-030) loads the project's tasks and edges under `SELECT ... FOR UPDATE` on the project row, applies the operation and inserts the edge in the same transaction, so concurrent requests cannot jointly create a cycle. `task_dependencies` carries composite FKs on `(organization_id, project_id, task_id)` so the database also rejects cross-project edges. Template validation (LD-016) reuses the same module.

## Consequences

### Positive

- Error responses tell users exactly which tasks form the cycle
- One implementation for templates and projects

### Negative

- Whole-project graph is loaded per dependency change (fine for hundreds of tasks; revisit above ~10k)

## Links

- [System design](../design/system-design.md)
- LD-021, LD-030, LD-031
