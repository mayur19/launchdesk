# ADR-0006: API conventions

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

The web client, tests and future integrations need a predictable contract, especially for errors that drive UI behaviour: stale writes (409), unsatisfied dependencies and launch gates (422), forbidden access (403/404).

## Decision Drivers

- Uniform error handling in the client
- Explicit status codes required by PRD §7
- Visible gaps while the product is incomplete

## Considered Options

1. JSON envelope `{success, data, error, meta}` with stable error codes
2. Bare resources plus RFC 7807 problem details
3. GraphQL

## Decision Outcome

Chosen option: **versioned REST under `/api/v1` with a single envelope**. Errors carry a stable `code` (`VALIDATION_FAILED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INVALID_STATE_TRANSITION`, `NOT_IMPLEMENTED`, ...), a safe message, optional `details` and the request id. Collections are paginated with `page`/`limit` and return `meta {total, page, limit}`. Domain rule failures (cycle, unmet predecessors, missing evidence, launch gates) are `422 VALIDATION_FAILED` with structured details. Endpoints that are designed but not built are registered with `pendingRouter` and return `501 NOT_IMPLEMENTED` with their backlog ticket.

## Consequences

### Positive

- The client has one code path for errors
- OpenAPI (`docs/api/openapi.yaml`) marks every operation `x-status` and `x-ticket`

### Negative

- Envelope adds a small amount of payload

## Links

- [API conventions](../api/README.md)
- [OpenAPI](../api/openapi.yaml)
