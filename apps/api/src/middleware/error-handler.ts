import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Logger } from 'pino';
import { AppError, errors } from '../lib/errors.js';
import { sendError } from '../lib/http.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(errors.notFound(`Route ${req.method} ${req.path}`));
};

/** Last middleware. Maps known errors to the envelope; hides internals for the rest. */
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err: unknown, req, res, _next) => {
    if (err instanceof AppError) {
      if (err.status >= 500 && err.code !== 'NOT_IMPLEMENTED') {
        logger.error({ err, requestId: req.requestId }, 'application error');
      }
      sendError(res, err, req.requestId);
      return;
    }

    if (isBodyParserError(err)) {
      sendError(res, new AppError('VALIDATION_FAILED', 'Malformed request body'), req.requestId);
      return;
    }

    logger.error({ err, requestId: req.requestId }, 'unhandled error');
    sendError(res, new AppError('INTERNAL_ERROR', 'An unexpected error occurred'), req.requestId);
  };
}

function isBodyParserError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type: unknown }).type === 'entity.parse.failed'
  );
}
