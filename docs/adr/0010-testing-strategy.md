# ADR-0010: Testing strategy

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

The PRD demands unit tests for dates, dependencies and health, and Playwright tests against real SQL data for 19 acceptance journeys. Authorization boundaries must be proven by tests (PRD closing brief).

## Decision Drivers

- Fast feedback for pure domain rules
- Real-database confidence for tenancy and constraints
- Browser coverage of golden flows

## Considered Options

1. Pyramid: Vitest unit, Vitest + supertest against real PostgreSQL, Playwright E2E
2. Mostly E2E
3. Mocked database only

## Decision Outcome

Chosen option: **test pyramid**. Pure domain modules target 100 % branch coverage (dependency graph and health are at 100 %). Integration tests run against a disposable `<db>_test` database created by `./run.sh test` and assert tenant isolation (404) and role enforcement (403) per endpoint. Playwright covers the smoke path now and L-01 to L-19 in LD-061/LD-062. Global coverage gate: 80 %.

## Consequences

### Positive

- Isolation bugs are caught before E2E
- Domain rules are documented by tests

### Negative

- Integration suite requires local PostgreSQL

## Links

- [Test strategy](../testing/test-strategy.md)
