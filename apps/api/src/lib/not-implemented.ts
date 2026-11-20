import { Router, type RequestHandler } from 'express';
import { errors } from './errors.js';

/**
 * Placeholder handler for endpoints defined in the API contract but not yet
 * built. Returns 501 with the backlog ticket id so the gap is explicit.
 */
export function notImplemented(ticket: string): RequestHandler {
  return (_req, _res, next) => next(errors.notImplemented(ticket));
}

export interface PendingRoute {
  readonly method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  readonly path: string;
  readonly ticket: string;
  /** Per-route guards; fall back to the router-wide guards when omitted. */
  readonly guards?: readonly RequestHandler[];
}

/** Build a router whose every route responds 501 with its tracking ticket. */
export function pendingRouter(
  routes: readonly PendingRoute[],
  guards: readonly RequestHandler[] = [],
): Router {
  const router = Router();
  for (const route of routes) {
    router[route.method](route.path, ...(route.guards ?? guards), notImplemented(route.ticket));
  }
  return router;
}
