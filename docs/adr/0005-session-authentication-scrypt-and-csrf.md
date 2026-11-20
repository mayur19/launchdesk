# ADR-0005: Session authentication with scrypt and CSRF protection

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

PRD §2 requires local email/password authentication, hashed passwords, secure cookie sessions, CSRF defence and session expiry, with no hosted identity provider.

## Decision Drivers

- No external identity service
- Revocable sessions
- Resistance to CSRF and credential stuffing

## Considered Options

1. Opaque server-side sessions in httpOnly cookies
2. Stateless JWT in local storage
3. JWT in cookies

## Decision Outcome

Chosen option: **opaque random session tokens** stored as SHA-256 hashes in `sessions`, sent as `httpOnly; SameSite=Lax` cookies (`Secure` in production) with a configurable TTL. Passwords use Node scrypt with per-user salt. CSRF defence: SameSite cookie, Origin/Referer check against `APP_ORIGIN`, and an `X-CSRF-Token` header derived as HMAC(session token). Login is rate-limited and always runs a hash comparison to avoid user enumeration by timing.

## Consequences

### Positive

- Logout and admin revocation take effect immediately
- No token material readable by scripts

### Negative

- One session lookup per request (indexed primary key)
- Multi-membership context switching (LD-012) must re-issue sessions

## Links

- [Threat model](../security/threat-model.md)
