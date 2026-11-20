import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';

const base = {
  APP_ORIGIN: 'http://localhost:5173',
  DATABASE_URL: 'postgres://localhost/db',
  SESSION_SECRET: 'x'.repeat(32),
};

describe('loadEnv', () => {
  it('applies defaults and freezes the result', () => {
    const env = loadEnv(base);
    expect(env.API_PORT).toBe(4103);
    expect(Object.isFrozen(env)).toBe(true);
  });

  it('rejects short session secrets with a readable message', () => {
    expect(() => loadEnv({ ...base, SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/);
  });

  it('rejects the placeholder secret in production', () => {
    expect(() =>
      loadEnv({
        ...base,
        NODE_ENV: 'production',
        SESSION_SECRET: 'replace-me-with-a-long-random-local-only-value',
      }),
    ).toThrow(/Placeholder/);
  });

  it('requires APP_ORIGIN to be a URL', () => {
    expect(() => loadEnv({ ...base, APP_ORIGIN: 'not a url' })).toThrow(/APP_ORIGIN/);
  });
});
