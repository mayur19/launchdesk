import type { Router } from 'express';
import type { Db } from '../db/pool.js';
import { pendingRouter, type PendingRoute } from '../lib/not-implemented.js';
import { activityPendingRoutes } from './activity/activity.routes.js';
import { auditPendingRoutes } from './audit/audit.routes.js';
import { customerPortalPendingRoutes } from './customer-portal/customer-portal.routes.js';
import { createCustomersRouter } from './customers/customers.routes.js';
import { createCustomerService } from './customers/customers.service.js';
import { filePendingRoutes } from './files/files.routes.js';
import { milestonePendingRoutes } from './milestones/milestones.routes.js';
import { notificationPendingRoutes } from './notifications/notifications.routes.js';
import { projectPendingRoutes } from './projects/projects.routes.js';
import { reportPendingRoutes } from './reports/reports.routes.js';
import { riskPendingRoutes } from './risks/risks.routes.js';
import { taskPendingRoutes } from './tasks/tasks.routes.js';
import { templatePendingRoutes } from './templates/templates.routes.js';

export interface ModuleDeps {
  readonly db: Db;
}

export interface MountedModule {
  readonly path: string;
  readonly router: Router;
}

/** Every API endpoint from PRD §7 that is not built yet (501 + ticket id). */
export const PENDING_ROUTES: readonly PendingRoute[] = [
  ...templatePendingRoutes,
  ...projectPendingRoutes,
  ...taskPendingRoutes,
  ...milestonePendingRoutes,
  ...riskPendingRoutes,
  ...filePendingRoutes,
  ...activityPendingRoutes,
  ...customerPortalPendingRoutes,
  ...reportPendingRoutes,
  ...notificationPendingRoutes,
  ...auditPendingRoutes,
];

/**
 * Product modules mounted under /api/v1. Each module owns its routes,
 * service, repository and schemas (ADR-0002). Endpoints not yet built are
 * registered with `pendingRouter` so the API surface matches the contract
 * and returns 501 + ticket id until implemented.
 */
export function productModules({ db }: ModuleDeps): readonly MountedModule[] {
  return [
    { path: '/customers', router: createCustomersRouter(createCustomerService({ db })) },
    { path: '/', router: pendingRouter(PENDING_ROUTES) },
  ];
}
