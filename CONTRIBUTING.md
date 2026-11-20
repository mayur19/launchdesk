# Contributing

## Workflow

1. Pick a ticket from [docs/planning/backlog.md](docs/planning/backlog.md) (or the matching GitHub issue).
2. Branch from `main`: `feat/<ticket-id>-short-name` or `fix/<ticket-id>-short-name`.
3. Write tests first (red → green → refactor). Target ≥ 80% coverage for new code.
4. Run `./run.sh check` locally — it mirrors CI (lint, format, typecheck, tests).
5. Open a pull request using the template; link the ticket and any ADR it touches.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

## Engineering rules

- **Architecture decisions** are recorded as ADRs in `docs/adr/`. A change that
  contradicts an accepted ADR needs a new ADR that supersedes it.
- **Tenant isolation**: every query on tenant-owned data filters by
  `organization_id` taken from the session, never from the request body.
- **Authorization** is enforced in the API, never only in the UI.
- **Validation** happens at the boundary with zod schemas from `packages/shared`.
- **Immutability**: prefer returning new objects over mutating inputs.
- **Small modules**: aim for files under 400 lines and functions under 50 lines.
- **Errors** use `AppError` codes; never leak stack traces or SQL to clients.
- **Migrations** are forward-only; never edit a migration that has been merged.
- **Audit**: state-changing domain actions write an audit event in the same transaction.
- **Pending work**: endpoints not yet built use `pendingRouter`/`notImplemented(ticket)`
  and code placeholders are marked `TODO(<ticket-id>)`.

## Definition of done

A ticket is done when its acceptance criteria pass in automated tests, docs and
the OpenAPI spec are updated, `./run.sh check` is green, and the backlog status
is updated.
