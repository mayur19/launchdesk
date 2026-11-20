import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { sendOk } from '../../lib/http.js';
import { AppError } from '../../lib/errors.js';

export interface HealthDeps {
  readonly checkDatabase: () => Promise<void>;
  readonly version: string;
}

/** Liveness never touches dependencies; readiness verifies the database. */
export function createHealthRouter(deps: HealthDeps): Router {
  const router = Router();

  router.get('/live', (_req, res) => {
    sendOk(res, { status: 'ok', version: deps.version });
  });

  router.get(
    '/ready',
    asyncHandler(async (_req, res) => {
      try {
        await deps.checkDatabase();
      } catch {
        throw new AppError('SERVICE_UNAVAILABLE', 'Database unavailable');
      }
      sendOk(res, { status: 'ready', version: deps.version });
    }),
  );

  return router;
}
