import type { PendingRoute } from '../../lib/not-implemented.js';
import { guards } from '../guards.js';

/** Tasks, dependencies and comments (PRD FR-04). Paths are relative to /api/v1. */
export const taskPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/projects/:projectId/tasks', ticket: 'LD-029', guards: guards.provider },
  { method: 'post', path: '/projects/:projectId/tasks', ticket: 'LD-029', guards: guards.managers },
  { method: 'get', path: '/tasks/:id', ticket: 'LD-029', guards: guards.provider },
  { method: 'patch', path: '/tasks/:id', ticket: 'LD-029', guards: guards.provider },
  { method: 'post', path: '/tasks/:id/transition', ticket: 'LD-031', guards: guards.provider },
  { method: 'post', path: '/tasks/:id/dependencies', ticket: 'LD-030', guards: guards.managers },
  {
    method: 'delete',
    path: '/tasks/:id/dependencies/:predecessorId',
    ticket: 'LD-030',
    guards: guards.managers,
  },
  { method: 'get', path: '/tasks/:id/comments', ticket: 'LD-035', guards: guards.provider },
  { method: 'post', path: '/tasks/:id/comments', ticket: 'LD-035', guards: guards.provider },
];
