import type { PendingRoute } from '../../lib/not-implemented.js';
import { guards } from '../guards.js';

/** In-app notifications (PRD FR-07, FR-10; ADR-0012). */
export const notificationPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/notifications', ticket: 'LD-054', guards: guards.authenticated },
  {
    method: 'post',
    path: '/notifications/:id/read',
    ticket: 'LD-054',
    guards: guards.authenticated,
  },
];
