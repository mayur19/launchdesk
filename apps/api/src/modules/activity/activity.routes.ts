import type { PendingRoute } from '../../lib/not-implemented.js';
import { guards } from '../guards.js';

/** Project activity timeline and decision register (PRD FR-10). */
export const activityPendingRoutes: readonly PendingRoute[] = [
  {
    method: 'get',
    path: '/projects/:projectId/activity',
    ticket: 'LD-053',
    guards: guards.provider,
  },
];
