import type { PendingRoute } from '../../lib/not-implemented.js';
import { guards } from '../guards.js';

/** Portfolio reporting and CSV export (PRD FR-09). */
export const reportPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/reports/portfolio', ticket: 'LD-056', guards: guards.managers },
  { method: 'get', path: '/reports/export.csv', ticket: 'LD-057', guards: guards.managers },
];
