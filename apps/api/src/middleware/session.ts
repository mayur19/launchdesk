import type { RequestHandler } from 'express';
import type { SessionRepository } from '../modules/auth/session.repository.js';
import { hashToken } from '../security/tokens.js';

/** Attach `req.auth` when a valid session cookie is present. Never rejects. */
export function loadSession(sessions: SessionRepository, cookieName: string): RequestHandler {
  return (req, _res, next) => {
    const token: unknown = req.cookies?.[cookieName];
    if (typeof token !== 'string' || token.length === 0 || token.length > 128) {
      next();
      return;
    }
    sessions
      .findActiveUser(hashToken(token))
      .then((user) => {
        if (user) {
          req.auth = { user, sessionToken: token };
        }
        next();
      })
      .catch(next);
  };
}
