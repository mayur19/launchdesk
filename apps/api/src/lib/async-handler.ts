import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Forward rejected promises from async route handlers to the error middleware. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
