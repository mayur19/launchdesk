import { CUSTOMER_ROLES, PROVIDER_ROLES } from '@launchdesk/shared';
import type { RequestHandler } from 'express';
import { requireAuth, requireRole } from '../middleware/authorize.js';

/**
 * Reusable route-level role gates (ADR-0007). Record-level checks such as
 * project membership and visibility belong in services.
 */
export const guards = {
  authenticated: [requireAuth],
  provider: [requireRole(...PROVIDER_ROLES)],
  managers: [requireRole('PROVIDER_ADMIN', 'IMPLEMENTATION_MANAGER')],
  admin: [requireRole('PROVIDER_ADMIN')],
  customer: [requireRole(...CUSTOMER_ROLES)],
  milestoneDeciders: [requireRole('CUSTOMER_OWNER', 'PROVIDER_ADMIN', 'IMPLEMENTATION_MANAGER')],
} as const satisfies Record<string, readonly RequestHandler[]>;
