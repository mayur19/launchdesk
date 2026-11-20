import { loadEnv } from '../config/env.js';
import { createLogger } from '../lib/logger.js';
import { runMigrations } from './migrate.js';
import { createPool } from './pool.js';
import { seed } from './seed.js';

const COMMANDS = ['migrate', 'seed', 'reset'] as const;
type Command = (typeof COMMANDS)[number];

function isCommand(value: string | undefined): value is Command {
  return value !== undefined && (COMMANDS as readonly string[]).includes(value);
}

async function main(): Promise<void> {
  const command = process.argv[2];
  if (!isCommand(command)) {
    throw new Error(`Usage: db <${COMMANDS.join('|')}>`);
  }
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);
  const db = createPool(env);
  try {
    if (command === 'reset') {
      if (env.NODE_ENV === 'production') {
        throw new Error('Refusing to reset the database when NODE_ENV=production');
      }
      await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      logger.warn('database schema dropped');
    }
    if (command === 'migrate' || command === 'reset') {
      const applied = await runMigrations(db, logger);
      logger.info({ count: applied.length }, 'migrations complete');
    }
    if (command === 'seed' || command === 'reset') {
      await seed(db, logger);
    }
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
