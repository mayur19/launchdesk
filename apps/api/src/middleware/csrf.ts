import type { RequestHandler } from 'express';
import { AppError } from '../lib/errors.js';
import { deriveCsrfToken, safeEqual } from '../security/tokens.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence in depth (ADR-0005):
 *  1. SameSite=Lax session cookie.
 *  2. Origin/Referer must match APP_ORIGIN for unsafe methods.
 *  3. Authenticated unsafe requests must carry X-CSRF-Token = HMAC(session).
 */
export function csrfProtection(appOrigin: string, secret: string): RequestHandler {
  const expectedOrigin = new URL(appOrigin).origin;

  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const origin = req.header('origin') ?? originFromReferer(req.header('referer'));
    if (origin !== undefined && origin !== expectedOrigin) {
      next(new AppError('CSRF_FAILED', 'Cross-origin request rejected'));
      return;
    }

    if (req.auth) {
      const provided = req.header('x-csrf-token') ?? '';
      const expected = deriveCsrfToken(req.auth.sessionToken, secret);
      if (!safeEqual(provided, expected)) {
        next(new AppError('CSRF_FAILED', 'Missing or invalid CSRF token'));
        return;
      }
    }
    next();
  };
}

function originFromReferer(referer: string | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return 'invalid';
  }
}
