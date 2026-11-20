import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createPool } from './db/pool.js';
import { createLogger } from './lib/logger.js';
import { createSessionRepository } from './modules/auth/session.repository.js';

const VERSION = process.env.npm_package_version ?? '0.1.0';
const SESSION_SWEEP_MS = 15 * 60_000;

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);
  const db = createPool(env);
  const app = createApp({ env, logger, db, version: VERSION });

  const server = app.listen(env.API_PORT, env.API_HOST, () => {
    logger.info({ host: env.API_HOST, port: env.API_PORT }, 'api listening');
  });

  const sessions = createSessionRepository(db);
  const sweep = setInterval(() => {
    sessions
      .deleteExpired()
      .then((count) => count > 0 && logger.debug({ count }, 'expired sessions removed'))
      .catch((err: unknown) => logger.warn({ err }, 'session sweep failed'));
  }, SESSION_SWEEP_MS);
  sweep.unref();

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutting down');
    clearInterval(sweep);
    server.close(() => {
      db.end()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
