import type { PendingRoute } from '../../lib/not-implemented.js';
import { guards } from '../guards.js';

/** Implementation templates (PRD FR-02). Paths are relative to /api/v1. */
export const templatePendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/templates', ticket: 'LD-015', guards: guards.provider },
  { method: 'post', path: '/templates', ticket: 'LD-015', guards: guards.managers },
  { method: 'get', path: '/templates/:id', ticket: 'LD-015', guards: guards.provider },
  { method: 'patch', path: '/templates/:id', ticket: 'LD-015', guards: guards.managers },
  { method: 'post', path: '/templates/:id/archive', ticket: 'LD-015', guards: guards.managers },
  { method: 'post', path: '/templates/:id/duplicate', ticket: 'LD-015', guards: guards.managers },
  { method: 'post', path: '/templates/:id/validate', ticket: 'LD-016', guards: guards.managers },
];
