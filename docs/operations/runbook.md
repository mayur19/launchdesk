# Runbook

Operating LaunchDesk locally (and the basis for production procedures). Everything goes through
`./run.sh`.

## Local setup

Prerequisites: Node.js >= 22, npm, a running local PostgreSQL (17 recommended) reachable without a
password for the current OS user, or adjust `DATABASE_URL`.

```bash
git clone <repo-url> launchdesk && cd launchdesk
./run.sh            # deps, .env, database, migrations, seed, then API + web
```

Open http://localhost:5173 and sign in with a demo account from the README (development only).

## run.sh command reference

| Command                       | Effect                                                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `./run.sh` / `./run.sh start` | Check prerequisites, create `.env` (random `SESSION_SECRET`), `npm ci` if needed, create DB, migrate, seed if empty, start API (4103) + web (5173) |
| `./run.sh setup`              | Everything `start` does, without launching                                                                                                         |
| `./run.sh migrate`            | Apply pending migrations                                                                                                                           |
| `./run.sh seed`               | Apply the development seed (idempotent upserts)                                                                                                    |
| `./run.sh reset [--yes]`      | Drop and recreate the schema, migrate and seed (asks unless `--yes`; refuses in production)                                                        |
| `./run.sh test`               | Unit + integration tests against `<db>_test`                                                                                                       |
| `./run.sh e2e`                | Playwright smoke and acceptance tests                                                                                                              |
| `./run.sh check`              | Lint, format check, typecheck, tests (CI parity)                                                                                                   |
| `./run.sh build`              | Production build of API (`apps/api/dist`) and web (`apps/web/dist`)                                                                                |
| `./run.sh help`               | List commands                                                                                                                                      |

## Configuration

All variables are validated at startup by `apps/api/src/config/env.ts`; the process exits with a
list of problems if any are invalid.

| Variable               | Default                                    | Description                                                                                      |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `NODE_ENV`             | `development`                              | `development`, `test` or `production`; production forbids the placeholder secret, seed and reset |
| `LOG_LEVEL`            | `info`                                     | pino level (`fatal` ... `trace`, `silent`)                                                       |
| `API_HOST`             | `127.0.0.1`                                | API bind address                                                                                 |
| `API_PORT`             | `4103`                                     | API port                                                                                         |
| `WEB_PORT`             | `5173`                                     | Vite dev server port (web only)                                                                  |
| `APP_ORIGIN`           | `http://localhost:5173`                    | Browser origin; used for CSRF origin checks                                                      |
| `DATABASE_URL`         | `postgres://localhost:5432/launchdesk_dev` | PostgreSQL connection string                                                                     |
| `DATABASE_POOL_MAX`    | `10`                                       | Pool size (1-100)                                                                                |
| `SESSION_SECRET`       | placeholder, replaced by `run.sh`          | >= 32 chars; HMAC key for CSRF tokens                                                            |
| `SESSION_TTL_MINUTES`  | `480`                                      | Session lifetime (5 min - 7 days)                                                                |
| `SESSION_COOKIE_NAME`  | `sid`                                      | Session cookie name                                                                              |
| `UPLOAD_DIR`           | `./uploads`                                | Evidence storage directory (used from LD-041)                                                    |
| `UPLOAD_MAX_BYTES`     | `10485760`                                 | Max upload size (LD-041)                                                                         |
| `RATE_LIMIT_WINDOW_MS` | `60000`                                    | Rate limit window                                                                                |
| `RATE_LIMIT_MAX`       | `300`                                      | Requests per window per IP for `/api`                                                            |
| `AUTH_RATE_LIMIT_MAX`  | `10`                                       | Login attempts per window per IP                                                                 |
| `TEST_DATABASE_URL`    | derived `<db>_test`                        | Integration test database (dropped and recreated by tests)                                       |
| `MIGRATIONS_DIR`       | `apps/api/migrations`                      | Override migration directory                                                                     |

## Health checks

| Endpoint                | Meaning                                        |
| ----------------------- | ---------------------------------------------- |
| `GET /api/health/live`  | Process is up (no DB access); 200              |
| `GET /api/health/ready` | DB reachable; 200 or 503 `SERVICE_UNAVAILABLE` |

```bash
curl -s localhost:4103/api/health/ready
```

## Logs

- Structured JSON (pino) on stdout from the API; the dev runner prefixes lines with `[api]` / `[web]`.
- Every request logs method, URL, status, response time and `req.id`; the same id is returned in the
  `X-Request-Id` header and in error bodies (`error.requestId`).
- Cookies, `X-CSRF-Token` and password fields are redacted.
- Pretty-print locally: `npm run dev 2>&1 | npx pino-pretty` (optional tool).

## Common failures

| Symptom                                           | Cause                                                                           | Fix                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Cannot reach PostgreSQL via postgres://...`      | Server not running                                                              | `brew services start postgresql@17` or `sudo service postgresql start`   |
| `Invalid environment configuration`               | Bad or missing `.env` value                                                     | Fix the listed variable; delete `.env` to regenerate from `.env.example` |
| `Migration 000X was modified after being applied` | An applied migration file changed                                               | Revert the edit and add a new migration; locally `./run.sh reset --yes`  |
| `Port 5173 is in use` / `EADDRINUSE 4103`         | Previous run still alive                                                        | `lsof -ti tcp:4103 -ti tcp:5173 \| xargs kill`                           |
| Login returns 403 `CSRF_FAILED`                   | Browsing via a different origin than `APP_ORIGIN` (e.g. 127.0.0.1 vs localhost) | Use http://localhost:5173 or update `APP_ORIGIN`                         |
| Login returns 429                                 | Login rate limit                                                                | Wait one minute or raise `AUTH_RATE_LIMIT_MAX` locally                   |
| Integration tests skipped                         | `TEST_DATABASE_URL` unset                                                       | Run through `./run.sh test`                                              |
| Playwright cannot launch a browser                | Chromium not installed                                                          | `npx playwright install chromium`                                        |
| 501 `NOT_IMPLEMENTED`                             | Endpoint pending                                                                | See `error.details.ticket` in the backlog                                |

## Backup and restore (local)

```bash
# Backup database and files
pg_dump --format=custom --no-owner "$DATABASE_URL" > launchdesk-$(date +%Y%m%d%H%M).dump
tar czf launchdesk-uploads-$(date +%Y%m%d%H%M).tgz -C apps/api uploads

# Restore into an empty database
createdb launchdesk_restore
pg_restore --no-owner --dbname=postgres://localhost:5432/launchdesk_restore launchdesk-YYYYMMDDHHMM.dump
tar xzf launchdesk-uploads-YYYYMMDDHHMM.tgz -C apps/api
```

Point `DATABASE_URL` at the restored database and start the app; migrations are already recorded in
`schema_migrations` and will be skipped.

## Resetting demo data

```bash
./run.sh reset          # asks for confirmation
./run.sh reset --yes    # non-interactive
```

This drops the `public` schema of `DATABASE_URL`, reapplies migrations and the development seed. It
refuses to run when `NODE_ENV=production`.
