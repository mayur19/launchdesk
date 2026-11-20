import type { PendingRoute } from '../../lib/not-implemented.js';
import { guards } from '../guards.js';

/** Milestones and customer acceptance (PRD FR-05). Paths are relative to /api/v1. */
export const milestonePendingRoutes: readonly PendingRoute[] = [
  {
    method: 'get',
    path: '/projects/:projectId/milestones',
    ticket: 'LD-037',
    guards: guards.provider,
  },
  {
    method: 'post',
    path: '/projects/:projectId/milestones',
    ticket: 'LD-037',
    guards: guards.managers,
  },
  { method: 'post', path: '/milestones/:id/submit', ticket: 'LD-038', guards: guards.managers },
  {
    method: 'post',
    path: '/milestones/:id/decide',
    ticket: 'LD-039',
    guards: guards.milestoneDeciders,
  },
];
