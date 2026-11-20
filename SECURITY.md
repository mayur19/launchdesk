# Security Policy

## Supported versions

This project is pre-1.0. Only the `main` branch receives security fixes.

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Use GitHub's
[private vulnerability reporting](../../security/advisories/new) for this
repository. Include reproduction steps, affected endpoints or files, and impact.

You can expect an acknowledgement within 5 business days.

## Secrets policy

- No real credentials, API keys or tokens are committed to this repository.
- `.env.example` contains placeholders only; `run.sh` generates a random local
  `SESSION_SECRET` into an untracked `.env`.
- Demo accounts created by the seed script are **development-only**, publicly
  documented, and the seed refuses to run with `NODE_ENV=production`.
- CI runs a gitleaks secret scan on every push and pull request.

See [docs/security/threat-model.md](docs/security/threat-model.md) for the
threat model and controls.
