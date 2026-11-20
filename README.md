# LaunchDesk

**Get every customer from signed contract to successful launch with fewer status meetings and fewer
stalled handoffs.**

LaunchDesk is a multi-tenant workspace for B2B software vendors, IT service providers and agencies
that onboard customers through multi-step implementation projects. Providers manage reusable
templates, tasks with dependencies, milestone approvals, evidence, risks and launch readiness.
Customers get a focused portal showing exactly what they must do and when, and never see provider
internals or other clients.

> **Project status: early build.** The foundation, customer accounts and the core domain rules
> (task dependency graph, rule-based project health) are implemented and tested. Everything else is
> designed, documented and tracked in the [backlog](docs/planning/backlog.md): about 16 % of the
> estimated MVP effort is complete. Pending API endpoints answer `501 Not Implemented` with their
> ticket id, and pending screens say which ticket delivers them.

## Project status

| Area                                                                               | Status         | Tickets                  |
| ---------------------------------------------------------------------------------- | -------------- | ------------------------ |
| Monorepo, CI, `run.sh` launcher                                                    | ✅ Implemented | LD-001, LD-005           |
| Authentication (scrypt, sessions, CSRF, rate limiting), audit trail, health checks | ✅ Implemented | LD-002 to LD-004         |
| Actor model (5 PRD roles) with database constraints and customer binding           | ✅ Implemented | LD-006                   |
| Engineering documentation, ADRs, OpenAPI, backlog                                  | ✅ Implemented | LD-007                   |
| Customer accounts: list, create, get (API + screen + seed)                         | ✅ Implemented | LD-008 to LD-010         |
| Task dependency graph domain (cycle detection, topological order, readiness)       | ✅ Implemented | LD-021                   |
| Rule-based project health calculator                                               | ✅ Implemented | LD-020                   |
| Customer archive, contacts, multi-membership, permission matrix                    | ⏳ Pending     | LD-011 to LD-013, LD-019 |
| Templates (schema, CRUD, validation, builder, seed)                                | ⏳ Pending     | LD-014 to LD-018         |
| Projects, lifecycle, snapshot creation, rebaseline                                 | ⏳ Pending     | LD-022 to LD-028, LD-036 |
| Tasks, dependencies API, comments, task screens                                    | ⏳ Pending     | LD-029 to LD-035         |
| Milestones, acceptance rounds, evidence files                                      | ⏳ Pending     | LD-037 to LD-044         |
| Risks, health from SQL, launch gates, portfolio dashboard                          | ⏳ Pending     | LD-045 to LD-050         |
| Customer portal, activity timeline, notifications                                  | ⏳ Pending     | LD-051 to LD-055         |
| Reports, CSV export, audit screen, demo dataset, acceptance suite, deployment      | ⏳ Pending     | LD-056 to LD-065         |

## Quick start

Requirements: Node.js 22+, npm, and a local PostgreSQL server (17 recommended) that accepts
connections from your OS user.

```bash
./run.sh
```

This checks prerequisites, creates `.env` from `.env.example` with a random session secret,
installs dependencies, creates the `launchdesk_dev` database, applies migrations, seeds demo data
and starts:

- Web: http://localhost:5173
- API: http://127.0.0.1:4103 (proxied by the web dev server under `/api`)

## Demo logins (development only)

These accounts are created by the development seed, are public, and must never exist in a
production database (the seed refuses to run with `NODE_ENV=production`). Password for all:
`DemoPassword!2026`.

| Email                           | Role                           | Organization                                                  |
| ------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| `admin@northstar.example`       | Provider Admin                 | Northstar Cloud                                               |
| `manager@northstar.example`     | Implementation Manager         | Northstar Cloud                                               |
| `contributor@northstar.example` | Provider Contributor           | Northstar Cloud                                               |
| `owner@atlas-retail.example`    | Customer Owner (Atlas Retail)  | Northstar Cloud                                               |
| `member@atlas-retail.example`   | Customer Member (Atlas Retail) | Northstar Cloud                                               |
| `admin@meridian.example`        | Provider Admin                 | Meridian Implementations (second tenant for isolation checks) |

Seeded customer accounts: Atlas Retail, Blue Harbor Logistics and Vela Health (Northstar Cloud);
Orion Foods and Kestrel Bank (Meridian Implementations). The full demo dataset with projects, tasks,
milestones and the golden scenario is LD-060.

## run.sh commands

| Command                       | Description                                                              |
| ----------------------------- | ------------------------------------------------------------------------ |
| `./run.sh` / `./run.sh start` | Install deps, prepare `.env` + database, migrate, seed, launch API + web |
| `./run.sh setup`              | Everything `start` does, without launching                               |
| `./run.sh migrate`            | Apply pending database migrations                                        |
| `./run.sh seed`               | Load development demo data (idempotent)                                  |
| `./run.sh reset [--yes]`      | Drop and recreate the schema, then migrate + seed                        |
| `./run.sh test`               | Unit + integration tests against a disposable `<db>_test` database       |
| `./run.sh e2e`                | Playwright end-to-end tests                                              |
| `./run.sh check`              | Lint, format check, typecheck and tests (what CI runs)                   |
| `./run.sh build`              | Production build of API and web                                          |
| `./run.sh help`               | Show all commands                                                        |

## Tech stack

| Layer    | Technology                                                             |
| -------- | ---------------------------------------------------------------------- |
| API      | Node.js 22, Express 4, TypeScript (strict), zod, pg, pino, helmet      |
| Web      | React 18, React Router 6, Vite 6, plain CSS                            |
| Database | PostgreSQL 17, forward-only SQL migrations                             |
| Shared   | `@launchdesk/shared`: roles, zod schemas, API envelope types           |
| Tests    | Vitest, Testing Library, supertest against real PostgreSQL, Playwright |
| Tooling  | npm workspaces, ESLint, Prettier, GitHub Actions, gitleaks             |

## Repository layout

```
launchdesk/
├── apps/
│   ├── api/                      Express API
│   │   ├── migrations/           0001_foundation.sql, 0002_roles_and_customer_accounts.sql
│   │   ├── src/
│   │   │   ├── config/ db/ lib/ middleware/ security/
│   │   │   └── modules/
│   │   │       ├── auth/ health/ audit/
│   │   │       ├── customers/            implemented vertical slice
│   │   │       ├── tasks/domain/         dependency graph (pure)
│   │   │       ├── projects/domain/      project health rules, local dates (pure)
│   │   │       ├── templates/ projects/ tasks/ milestones/ risks/ files/
│   │   │       ├── activity/ customer-portal/ reports/ notifications/   pending routes (501)
│   │   │       ├── guards.ts
│   │   │       └── index.ts              module registry
│   │   └── test/                 unit, HTTP and PostgreSQL integration tests
│   └── web/                      React SPA (pages/customers implemented, PendingPage elsewhere)
├── packages/shared/              roles, zod schemas, envelope types
├── e2e/                          Playwright config and smoke tests
├── docs/                         product, architecture, ADRs, design, API, security, testing, ops, planning
├── run.sh                        single entry point
└── .env.example                  placeholder configuration
```

## Documentation

Start with the [documentation index](docs/README.md). Key documents:
[PRD](docs/product/PRD.md) ·
[architecture](docs/architecture/overview.md) ·
[ADRs](docs/adr/README.md) ·
[data model](docs/design/data-model.md) ·
[API](docs/api/README.md) ·
[threat model](docs/security/threat-model.md) ·
[test strategy](docs/testing/test-strategy.md) ·
[runbook](docs/operations/runbook.md) ·
[roadmap](docs/planning/roadmap.md) ·
[backlog](docs/planning/backlog.md)

## Known limitations

- Only customer accounts are usable end to end; projects, tasks, milestones and the customer portal
  are pending (see status table).
- One role per user; users who act for several customers or providers need LD-012.
- No email, calendar, CRM or other integrations by design (PRD §1); notifications will be in-app only.

## Contributing, security and license

- [Contributing guide](CONTRIBUTING.md): workflow, commit conventions, engineering rules.
- [Security policy](SECURITY.md): how to report vulnerabilities; secrets policy.
- [Changelog](CHANGELOG.md).
- Licensed under the [MIT License](LICENSE).
