import type { ZodType, ZodTypeDef } from 'zod';
import { errors } from './errors.js';

/** Parse untrusted input at the boundary; throw a 422 with field issues on failure. */
export function parseOrThrow<T>(schema: ZodType<T, ZodTypeDef, unknown>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw errors.validation(
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }
  return result.data;
}
