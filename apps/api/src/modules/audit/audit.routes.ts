import type { PendingRoute } from '../../lib/not-implemented.js';
import { guards } from '../guards.js';

/** Read-only audit history for provider admins (PRD FR-10; ADR-0008). */
export const auditPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/audit-logs', ticket: 'LD-059', guards: guards.admin },
];
