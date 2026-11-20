import { loginRequestSchema, type SessionResponse } from '@launchdesk/shared';
import { Router, type CookieOptions, type RequestHandler } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { sendOk } from '../../lib/http.js';
import { parseOrThrow } from '../../lib/validate.js';
import { requireAuth } from '../../middleware/authorize.js';
import { deriveCsrfToken } from '../../security/tokens.js';
import type { AuthService } from './auth.service.js';

export interface AuthRouterOptions {
  readonly auth: AuthService;
  readonly cookieName: string;
  readonly sessionSecret: string;
  readonly secureCookies: boolean;
  readonly loginRateLimiter: RequestHandler;
  readonly onLogin?: (userId: string, organizationId: string, requestId: string) => Promise<void>;
}

export function createAuthRouter(options: AuthRouterOptions): Router {
  const router = Router();
  const cookieBase: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: options.secureCookies,
    path: '/',
  };

  router.post(
    '/login',
    options.loginRateLimiter,
    asyncHandler(async (req, res) => {
      const credentials = parseOrThrow(loginRequestSchema, req.body);
      const result = await options.auth.login(credentials, {
        ipAddress: req.ip ?? null,
        userAgent: req.header('user-agent')?.slice(0, 512) ?? null,
      });
      await options.onLogin?.(result.user.id, result.user.organizationId, req.requestId);
      res.cookie(options.cookieName, result.sessionToken, {
        ...cookieBase,
        expires: result.expiresAt,
      });
      const body: SessionResponse = {
        user: result.user,
        csrfToken: deriveCsrfToken(result.sessionToken, options.sessionSecret),
      };
      sendOk(res, body);
    }),
  );

  router.get('/session', requireAuth, (req, res) => {
    const auth = req.auth!;
    const body: SessionResponse = {
      user: auth.user,
      csrfToken: deriveCsrfToken(auth.sessionToken, options.sessionSecret),
    };
    sendOk(res, body);
  });

  router.post(
    '/logout',
    requireAuth,
    asyncHandler(async (req, res) => {
      await options.auth.logout(req.auth!.sessionToken);
      res.clearCookie(options.cookieName, cookieBase);
      sendOk(res, { loggedOut: true });
    }),
  );

  return router;
}
