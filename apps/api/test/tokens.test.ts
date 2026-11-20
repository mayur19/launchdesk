import { describe, expect, it } from 'vitest';
import {
  deriveCsrfToken,
  generateSessionToken,
  hashToken,
  safeEqual,
} from '../src/security/tokens.js';

describe('tokens', () => {
  it('generates high-entropy, unique session tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, generateSessionToken));
    expect(tokens.size).toBe(100);
    expect([...tokens][0]).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('hashes deterministically without exposing the token', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toContain('abc');
  });

  it('derives CSRF tokens bound to session and secret', () => {
    const csrf = deriveCsrfToken('session-a', 'secret');
    expect(deriveCsrfToken('session-a', 'secret')).toBe(csrf);
    expect(deriveCsrfToken('session-b', 'secret')).not.toBe(csrf);
    expect(deriveCsrfToken('session-a', 'other')).not.toBe(csrf);
  });

  it('compares in constant time and handles length mismatch', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
