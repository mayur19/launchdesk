import type { PendingRoute } from '../../lib/not-implemented.js';
import { guards } from '../guards.js';

/**
 * Customer portal API (PRD FR-07; ADR-0013). Separate route tree so that
 * customer responses are built by dedicated, visibility-filtered queries and
 * never by reusing provider serializers.
 */
export const customerPortalPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/customer/projects', ticket: 'LD-051', guards: guards.customer },
  { method: 'get', path: '/customer/projects/:id', ticket: 'LD-051', guards: guards.customer },
  { method: 'get', path: '/customer/tasks/:id', ticket: 'LD-051', guards: guards.customer },
  {
    method: 'post',
    path: '/customer/tasks/:id/comments',
    ticket: 'LD-035',
    guards: guards.customer,
  },
  { method: 'post', path: '/customer/tasks/:id/files', ticket: 'LD-042', guards: guards.customer },
];
