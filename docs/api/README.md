# API conventions

The machine-readable contract is [`openapi.yaml`](openapi.yaml) (OpenAPI 3.1). Every operation
carries `x-status: implemented | pending` and `x-ticket: LD-xxx`. Decisions behind these
conventions are in ADR-0006.

## Versioning and base URL

- Product endpoints live under `/api/v1`; health probes under `/api/health`.
- Breaking changes require `/api/v2`; additive changes (new optional fields, new endpoints) do not.
- Local: `http://localhost:5173/api/v1` through the Vite proxy, or `http://127.0.0.1:4103/api/v1` directly.

## Envelope

Every response, success or failure, uses one shape:

```json
{ "success": true, "data": { "id": "..." }, "error": null }
{ "success": true, "data": [ ... ], "error": null, "meta": { "total": 3, "page": 1, "limit": 25 } }
{ "success": false, "data": null, "error": { "code": "NOT_FOUND", "message": "Customer account not found", "requestId": "..." } }
```

## Error codes

| HTTP | `error.code`               | When                                                                                                                                                             |
| ---- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 401  | `UNAUTHENTICATED`          | No or expired session; wrong credentials (generic message)                                                                                                       |
| 403  | `FORBIDDEN`                | Role not allowed for the endpoint (e.g. customer user on `/customers`)                                                                                           |
| 403  | `CSRF_FAILED`              | Cross-origin unsafe request or missing/invalid `X-CSRF-Token`                                                                                                    |
| 404  | `NOT_FOUND`                | Unknown id, malformed id, or a record of another tenant or customer (never 403, to avoid confirming existence)                                                   |
| 409  | `CONFLICT`                 | Unique violation (duplicate customer name) or stale `version`                                                                                                    |
| 409  | `INVALID_STATE_TRANSITION` | Lifecycle transition not allowed from the current state                                                                                                          |
| 422  | `VALIDATION_FAILED`        | Schema validation (`details: [{path, message}]`) or a domain rule (`details: {code: "CYCLE", cycle: [...]}`, unmet predecessors, missing evidence, launch gates) |
| 429  | `RATE_LIMITED`             | Rate limit exceeded                                                                                                                                              |
| 501  | `NOT_IMPLEMENTED`          | Endpoint designed but not built; `details.ticket` names the backlog item                                                                                         |
| 503  | `SERVICE_UNAVAILABLE`      | Readiness probe failure                                                                                                                                          |
| 500  | `INTERNAL_ERROR`           | Unexpected error; details only in server logs (look up by `requestId`)                                                                                           |

Domain rule failures planned for pending endpoints:

| Rule                                     | `details.code`                                              | Ticket |
| ---------------------------------------- | ----------------------------------------------------------- | ------ |
| Dependency would create a cycle          | `CYCLE` + `cycle: [taskId, ...]`                            | LD-030 |
| Cross-project dependency                 | `CROSS_PROJECT_TASK`                                        | LD-030 |
| Completing a task with open predecessors | `PREDECESSORS_INCOMPLETE` + `incompletePredecessors`        | LD-031 |
| Submitting an incomplete milestone       | `MILESTONE_GATES_UNMET` + `missingTasks`, `missingEvidence` | LD-038 |
| Launching before gates                   | `LAUNCH_GATES_UNMET` + blocking items                       | LD-048 |
| New project for an archived customer     | `CUSTOMER_ARCHIVED`                                         | LD-011 |

## Pagination

`?page=1&limit=25` (limit 1-100). Responses include `meta.total`, `meta.page`, `meta.limit`.
Ordering is stable (customers: case-insensitive name, then id).

## Filtering

Query parameters are validated with zod; unknown values return 422. Customers support `status`
(`ACTIVE`, `ARCHIVED`) and `search` (case-insensitive substring of name; `%` and `_` are literal).

## Concurrency and idempotency

- Mutable resources expose `version`. Updates send the last seen `version`; a mismatch returns 409.
- Retrying a failed `POST` may create a duplicate where no natural unique key exists; customer names
  are unique per tenant so duplicate customer creation returns 409.
- Rebaseline is two-phase (preview, then confirm with the preview's version).

## Authentication and CSRF

1. `POST /api/v1/auth/login` sets the httpOnly `sid` cookie and returns `csrfToken`.
2. Send the cookie on every request (`credentials: 'same-origin'`).
3. Send `X-CSRF-Token: <csrfToken>` on `POST`, `PUT`, `PATCH`, `DELETE`. The `Origin` header must match `APP_ORIGIN`.
4. `GET /api/v1/auth/session` returns the current user and a fresh token after a page reload.

## Examples (development only)

```bash
BASE=http://localhost:5173/api/v1
ORIGIN=http://localhost:5173

# Sign in (demo credentials from README, development only) and capture the CSRF token
CSRF=$(curl -s -c cookies.txt -H "Origin: $ORIGIN" -H 'Content-Type: application/json' \
  -d '{"email":"admin@northstar.example","password":"DemoPassword!2026"}' \
  $BASE/auth/login | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.csrfToken')

# List customer accounts (paginated)
curl -s -b cookies.txt "$BASE/customers?limit=10&search=atlas"

# Create a customer account (Provider Admin only)
curl -s -b cookies.txt -H "Origin: $ORIGIN" -H "X-CSRF-Token: $CSRF" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Polaris Media","industry":"Media","primaryContact":"Jo Park"}' \
  $BASE/customers

# A pending endpoint answers 501 with its ticket
curl -s -b cookies.txt $BASE/projects
# {"success":false,"data":null,"error":{"code":"NOT_IMPLEMENTED","message":"Not implemented yet (tracked as LD-024)","details":{"ticket":"LD-024"},...}}
```

## Endpoint status summary

| Area                          | Implemented                                                | Pending                                    |
| ----------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| Health, auth, `/me`           | All                                                        | -                                          |
| Customers                     | `GET /customers`, `POST /customers`, `GET /customers/{id}` | update/archive (LD-011), contacts (LD-013) |
| Templates                     | -                                                          | LD-015, LD-016                             |
| Projects                      | -                                                          | LD-023, LD-024, LD-028, LD-036             |
| Tasks                         | -                                                          | LD-029, LD-030, LD-031, LD-035             |
| Milestones                    | -                                                          | LD-037, LD-038, LD-039                     |
| Risks, activity, files        | -                                                          | LD-045, LD-053, LD-042                     |
| Customer portal               | -                                                          | LD-051 (plus LD-035, LD-042 actions)       |
| Reports, notifications, audit | -                                                          | LD-056, LD-057, LD-054, LD-059             |
