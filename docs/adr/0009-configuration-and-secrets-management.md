# ADR-0009: Configuration and secrets management

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

The app runs locally with no secrets service, and the repository is public.

## Decision Drivers

- No secrets in git
- Fail fast on bad configuration
- Zero-friction local setup

## Considered Options

1. Environment variables validated by zod at startup, `.env` for local only
2. Config files per environment
3. Secrets manager SDK in the app

## Decision Outcome

Chosen option: **12-factor environment variables** validated by `src/config/env.ts`. `.env.example` contains placeholders only; `run.sh` copies it to an untracked `.env` and generates a random `SESSION_SECRET`. Production refuses the placeholder secret. In production, variables are injected by the platform secret store (see deployment plan). Demo credentials exist only in the development seed, which refuses to run with `NODE_ENV=production`.

## Consequences

### Positive

- Misconfiguration stops the process with a clear list of issues
- gitleaks in CI catches accidental commits

### Negative

- Secret rotation requires a restart

## Links

- [Runbook](../operations/runbook.md)
- [Deployment](../operations/deployment.md)
