/**
 * Consistent response envelope used by every API endpoint.
 * See docs/adr/0006-api-conventions.md.
 */
export interface PageMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface ApiErrorBody {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly requestId?: string;
}

export type ApiSuccess<T> = {
  readonly success: true;
  readonly data: T;
  readonly error: null;
  readonly meta?: PageMeta;
};

export type ApiFailure = {
  readonly success: false;
  readonly data: null;
  readonly error: ApiErrorBody;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INVALID_STATE_TRANSITION',
  'RATE_LIMITED',
  'CSRF_FAILED',
  'NOT_IMPLEMENTED',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];
