import {
  createCustomerRequestSchema,
  listCustomersQuerySchema,
  uuidSchema,
} from '@launchdesk/shared';
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { errors } from '../../lib/errors.js';
import { sendOk } from '../../lib/http.js';
import { notImplemented } from '../../lib/not-implemented.js';
import { parseOrThrow } from '../../lib/validate.js';
import { requireRole } from '../../middleware/authorize.js';
import { CUSTOMER_CREATE_ROLES, CUSTOMER_READ_ROLES } from './customers.policy.js';
import type { CustomerService } from './customers.service.js';

/** Path ids that are not UUIDs cannot exist; answer 404 like any unknown id. */
function parseId(raw: string | undefined): string {
  const result = uuidSchema.safeParse(raw);
  if (!result.success) throw errors.notFound('Customer account');
  return result.data;
}

/** /api/v1/customers (PRD FR-01, §7). */
export function createCustomersRouter(service: CustomerService): Router {
  const router = Router();
  const readers = requireRole(...CUSTOMER_READ_ROLES);
  const creators = requireRole(...CUSTOMER_CREATE_ROLES);

  router.get(
    '/',
    readers,
    asyncHandler(async (req, res) => {
      const query = parseOrThrow(listCustomersQuerySchema, req.query);
      const page = await service.list(req.auth!.user, query);
      sendOk(res, page.items, 200, { total: page.total, page: query.page, limit: query.limit });
    }),
  );

  router.post(
    '/',
    creators,
    asyncHandler(async (req, res) => {
      const input = parseOrThrow(createCustomerRequestSchema, req.body);
      const created = await service.create(req.auth!.user, input, req.requestId);
      res.location(`/api/v1/customers/${created.id}`);
      sendOk(res, created, 201);
    }),
  );

  router.get(
    '/:id',
    readers,
    asyncHandler(async (req, res) => {
      sendOk(res, await service.get(req.auth!.user, parseId(req.params.id)));
    }),
  );

  // Pending endpoints of the same resource (501 + ticket until built).
  router.patch('/:id', creators, notImplemented('LD-011'));
  router.post('/:id/archive', creators, notImplemented('LD-011'));
  router.get('/:id/contacts', readers, notImplemented('LD-013'));
  router.post(
    '/:id/contacts',
    requireRole('PROVIDER_ADMIN', 'IMPLEMENTATION_MANAGER'),
    notImplemented('LD-013'),
  );

  return router;
}
