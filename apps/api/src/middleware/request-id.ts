import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const VALID_INBOUND_ID = /^[a-zA-Z0-9-]{8,64}$/;

export const requestId: RequestHandler = (req, res, next) => {
  const inbound = req.header('x-request-id');
  req.requestId = inbound && VALID_INBOUND_ID.test(inbound) ? inbound : randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};
