import pino from 'pino';
import type { Env } from '../src/config/env.js';
import { loadEnv } from '../src/config/env.js';

export const silentLogger = pino({ level: 'silent' });

export const TEST_ORIGIN = 'http://localhost:5173';

export function testEnv(overrides: Partial<Record<keyof Env, string>> = {}): Env {
  return loadEnv({
    NODE_ENV: 'test',
    APP_ORIGIN: TEST_ORIGIN,
    DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgres://localhost:5432/unused',
    SESSION_SECRET: 'test-secret-test-secret-test-secret-0123',
    LOG_LEVEL: 'silent',
    RATE_LIMIT_MAX: '10000',
    AUTH_RATE_LIMIT_MAX: '10000',
    ...overrides,
  });
}
