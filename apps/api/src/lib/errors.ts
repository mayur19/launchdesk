import type { ErrorCode } from '@launchdesk/shared';

const STATUS_BY_CODE: Readonly<Record<ErrorCode, number>> = {
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INVALID_STATE_TRANSITION: 409,
  RATE_LIMITED: 429,
  CSRF_FAILED: 403,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

/** Domain/application error with a stable, client-safe code. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export const errors = {
  validation: (details: unknown) =>
    new AppError('VALIDATION_FAILED', 'Request validation failed', details),
  unauthenticated: () => new AppError('UNAUTHENTICATED', 'Authentication required'),
  forbidden: (message = 'You do not have permission to perform this action') =>
    new AppError('FORBIDDEN', message),
  notFound: (resource = 'Resource') => new AppError('NOT_FOUND', `${resource} not found`),
  conflict: (message: string) => new AppError('CONFLICT', message),
  invalidTransition: (from: string, to: string) =>
    new AppError('INVALID_STATE_TRANSITION', `Transition from ${from} to ${to} is not allowed`, {
      from,
      to,
    }),
  notImplemented: (ticket: string) =>
    new AppError('NOT_IMPLEMENTED', `Not implemented yet (tracked as ${ticket})`, { ticket }),
} as const;
