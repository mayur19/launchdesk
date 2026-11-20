import type { PendingRoute } from '../../lib/not-implemented.js';
import { guards } from '../guards.js';

/** Evidence and deliverable files (PRD FR-08; ADR-0011). Paths are relative to /api/v1. */
export const filePendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/projects/:projectId/files', ticket: 'LD-042', guards: guards.provider },
  { method: 'post', path: '/projects/:projectId/files', ticket: 'LD-042', guards: guards.provider },
  { method: 'get', path: '/tasks/:id/files', ticket: 'LD-042', guards: guards.provider },
  { method: 'post', path: '/tasks/:id/files', ticket: 'LD-042', guards: guards.provider },
  // Customers download shared files too; visibility is enforced per file.
  { method: 'get', path: '/files/:id/download', ticket: 'LD-042', guards: guards.authenticated },
];
