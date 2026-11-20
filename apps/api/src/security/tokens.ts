import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** 256-bit opaque session token, URL-safe. Only its SHA-256 is persisted. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * CSRF token is an HMAC of the session token (synchronizer pattern without
 * extra storage). Rotates automatically whenever the session rotates.
 */
export function deriveCsrfToken(sessionToken: string, secret: string): string {
  return createHmac('sha256', secret).update(`csrf:${sessionToken}`).digest('base64url');
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
