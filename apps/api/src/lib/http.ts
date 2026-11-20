import type { Response } from 'express';
import type { ApiFailure, ApiSuccess, PageMeta } from '@launchdesk/shared';
import type { AppError } from './errors.js';

export function sendOk<T>(res: Response, data: T, status = 200, meta?: PageMeta): void {
  const body: ApiSuccess<T> = meta
    ? { success: true, data, error: null, meta }
    : { success: true, data, error: null };
  res.status(status).json(body);
}

export function sendError(res: Response, error: AppError, requestId?: string): void {
  const body: ApiFailure = {
    success: false,
    data: null,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
      ...(requestId ? { requestId } : {}),
    },
  };
  res.status(error.status).json(body);
}
