# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Monorepo foundation: API (Express + PostgreSQL), web (React + Vite), shared zod schemas (LD-001).
- Single launcher script `run.sh` (setup, migrate, seed, start, test, e2e, check, build) (LD-005).
- Session authentication with scrypt password hashing, CSRF protection and rate limiting (LD-003).
- Forward-only SQL migration runner, append-only audit trail, health endpoints (LD-002, LD-004).
- LaunchDesk actor model: Provider Admin, Implementation Manager, Provider Contributor, Customer
  Owner and Customer Member, enforced by a database CHECK constraint; customer users bound to one
  customer account of their provider (migration `0002`, LD-006).
- Customer accounts API: tenant-scoped, role-gated, validated, paginated and audited list, create
  and get endpoints with real-PostgreSQL integration tests for tenant isolation and role
  enforcement (LD-008).
- Customer accounts screen with search, status filter, pagination and an admin-only create form (LD-009).
- Development seed for Northstar Cloud (Atlas Retail, Blue Harbor Logistics, Vela Health), a second
  provider organization and one demo login per role (LD-010).
- Task dependency graph domain module: cycle rejection with the cycle path, cross-project and
  duplicate rejection, topological ordering, derived ready/blocked state and the completion gate
  with manager override (LD-021).
- Rule-based project health calculator with transparent reasons, evaluated in the project time zone
  at an explicit clock (LD-020).
- Every remaining PRD endpoint registered as a role-guarded pending route returning 501 with its
  ticket; every PRD screen registered in navigation with role visibility.
- Engineering documentation: architecture, quality attributes, ADR-0001 to ADR-0017, system design,
  data model, OpenAPI 3.1 contract, threat model, test strategy, runbook, deployment plan, roadmap,
  backlog (65 tickets), risk register and glossary (LD-007).
