import { z } from 'zod';

/**
 * Environment is validated once at startup. The process refuses to boot
 * with missing or unsafe configuration (ADR-0009).
 */
const PLACEHOLDER_SECRET = 'replace-me-with-a-long-random-local-only-value';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    API_HOST: z.string().default('127.0.0.1'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4103),
    APP_ORIGIN: z.string().url(),
    DATABASE_URL: z.string().min(1),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
    SESSION_TTL_MINUTES: z.coerce
      .number()
      .int()
      .min(5)
      .max(7 * 24 * 60)
      .default(480),
    SESSION_COOKIE_NAME: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/)
      .default('sid'),
    UPLOAD_DIR: z.string().default('./uploads'),
    UPLOAD_MAX_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(10 * 1024 * 1024),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.SESSION_SECRET === PLACEHOLDER_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SESSION_SECRET'],
        message: 'Placeholder SESSION_SECRET is not allowed in production',
      });
    }
  });

export type Env = Readonly<z.infer<typeof envSchema>>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return Object.freeze(result.data);
}
