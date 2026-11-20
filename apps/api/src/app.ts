import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import type { Env } from './config/env.js';
import type { Db } from './db/pool.js';
import { sendOk } from './lib/http.js';
import { requireAuth } from './middleware/authorize.js';
import { csrfProtection } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createRateLimiter } from './middleware/rate-limit.js';
import { requestId } from './middleware/request-id.js';
import { loadSession } from './middleware/session.js';
import { recordAudit } from './modules/audit/audit.service.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createSessionRepository } from './modules/auth/session.repository.js';
import { createUserRepository } from './modules/auth/user.repository.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { productModules } from './modules/index.js';

export interface AppDeps {
  readonly env: Env;
  readonly logger: Logger;
  readonly db: Db;
  readonly version: string;
}

export function createApp({ env, logger, db, version }: AppDeps): Express {
  const app = express();
  const sessions = createSessionRepository(db);
  const auth = createAuthService({
    users: createUserRepository(db),
    sessions,
    sessionTtlMinutes: env.SESSION_TTL_MINUTES,
  });

  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => (req as express.Request).requestId }));
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/api', createRateLimiter(env.RATE_LIMIT_WINDOW_MS, env.RATE_LIMIT_MAX));

  app.use(
    '/api/health',
    createHealthRouter({ version, checkDatabase: async () => void (await db.query('SELECT 1')) }),
  );

  const api = express.Router();
  api.use(loadSession(sessions, env.SESSION_COOKIE_NAME));
  api.use(csrfProtection(env.APP_ORIGIN, env.SESSION_SECRET));
  api.use(
    '/auth',
    createAuthRouter({
      auth,
      cookieName: env.SESSION_COOKIE_NAME,
      sessionSecret: env.SESSION_SECRET,
      secureCookies: env.NODE_ENV === 'production',
      loginRateLimiter: createRateLimiter(env.RATE_LIMIT_WINDOW_MS, env.AUTH_RATE_LIMIT_MAX),
      onLogin: (userId, organizationId, reqId) =>
        recordAudit(db, {
          organizationId,
          actorUserId: userId,
          action: 'auth.login',
          entityType: 'user',
          entityId: userId,
          requestId: reqId,
        }),
    }),
  );
  api.get('/me', requireAuth, (req, res) => {
    sendOk(res, req.auth!.user);
  });
  for (const module of productModules({ db })) {
    api.use(module.path, module.router);
  }

  app.use('/api/v1', api);
  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return app;
}
