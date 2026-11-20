# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

LaunchDesk is built by a small team over several milestones. Decisions about tenancy, the dual provider/customer portal, dependency gating and approval integrity have long-lived consequences and must be discoverable by new contributors and reviewers.

## Decision Drivers

- Decisions must be reviewable in pull requests
- New engineers need the "why", not only the "what"
- Low ceremony

## Considered Options

1. Markdown ADRs in the repository (MADR)
2. Wiki pages
3. No formal record

## Decision Outcome

Chosen option: **MADR files in `docs/adr/`**, numbered sequentially, reviewed like code. Superseded ADRs stay in place with a link to their replacement. Code that depends on a decision references it (for example `ADR-0003` in migration comments).

## Consequences

### Positive

- Decisions version with the code they describe
- Pull requests can propose and review ADRs together with the change

### Negative

- Requires discipline to write an ADR before, not after, the change

## Links

- [MADR](https://adr.github.io/madr/)
- [ADR index](README.md)
