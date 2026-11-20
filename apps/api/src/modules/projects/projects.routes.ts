import type { PendingRoute } from '../../lib/not-implemented.js';
import { guards } from '../guards.js';

/** Projects and lifecycle (PRD FR-03, FR-09). Paths are relative to /api/v1. */
export const projectPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/projects', ticket: 'LD-024', guards: guards.provider },
  { method: 'post', path: '/projects', ticket: 'LD-023', guards: guards.managers },
  { method: 'get', path: '/projects/:id', ticket: 'LD-024', guards: guards.provider },
  { method: 'patch', path: '/projects/:id', ticket: 'LD-024', guards: guards.managers },
  { method: 'post', path: '/projects/:id/rebaseline', ticket: 'LD-036', guards: guards.managers },
  { method: 'post', path: '/projects/:id/transition', ticket: 'LD-028', guards: guards.managers },
];
