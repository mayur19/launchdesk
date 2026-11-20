# ADR-0011: Local file attachment storage

- **Status:** Proposed
- **Date:** 2026-11-20

## Context

FR-08 requires evidence and deliverable uploads with `INTERNAL` or `SHARED_WITH_CUSTOMER` scope, version history and permission-checked downloads. PRD §2 forbids cloud buckets.

## Decision Drivers

- No remote storage
- Never execute or inline-render uploaded content
- Files survive restarts (L-18)

## Considered Options

1. Local filesystem under `UPLOAD_DIR` with SQL metadata
2. Blobs in PostgreSQL
3. Object storage

## Decision Outcome

Chosen option: **local filesystem with SQL metadata** (LD-041, LD-042). Files are stored under random names outside the web root; metadata (`files` table) records tenant, project, parent task/milestone, visibility, original name, MIME type, size, checksum and version number. Downloads stream through an authorized endpoint with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`. A MIME/extension allow-list and `UPLOAD_MAX_BYTES` are enforced; there is no virus scanning in the MVP and the UI says so.

## Consequences

### Positive

- Works offline and survives restarts
- Swap to object storage later behind the same service interface

### Negative

- Single-host storage; backups must include `UPLOAD_DIR`

## Links

- [System design](../design/system-design.md)
- [Threat model](../security/threat-model.md)
