import type { PendingRoute } from '../../lib/not-implemented.js';
import { guards } from '../guards.js';

/** Risk, issue and decision register (PRD FR-06). Paths are relative to /api/v1. */
export const riskPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/projects/:projectId/risks', ticket: 'LD-045', guards: guards.provider },
  { method: 'post', path: '/projects/:projectId/risks', ticket: 'LD-045', guards: guards.provider },
  { method: 'patch', path: '/risks/:id', ticket: 'LD-045', guards: guards.provider },
];
