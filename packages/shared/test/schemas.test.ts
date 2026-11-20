import { describe, expect, it } from 'vitest';
import { isRole, loginRequestSchema, paginationQuerySchema } from '../src/index.js';

describe('loginRequestSchema', () => {
  it('normalises email casing and whitespace', () => {
    const parsed = loginRequestSchema.parse({ email: '  Admin@Example.COM ', password: 'x' });
    expect(parsed.email).toBe('admin@example.com');
  });

  it('rejects malformed email', () => {
    expect(loginRequestSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false);
  });

  it('rejects empty password', () => {
    expect(loginRequestSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });
});

describe('paginationQuerySchema', () => {
  it('applies defaults', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
  });

  it('caps limit at 100', () => {
    expect(paginationQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });
});

describe('isRole', () => {
  it('accepts known roles only', () => {
    expect(isRole('PROVIDER_ADMIN')).toBe(true);
    expect(isRole('CUSTOMER_MEMBER')).toBe(true);
    expect(isRole('ORG_ADMIN')).toBe(false);
    expect(isRole(42)).toBe(false);
  });
});
