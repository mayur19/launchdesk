import rateLimit from 'express-rate-limit';
import { AppError } from '../lib/errors.js';
import { sendError } from '../lib/http.js';

export function createRateLimiter(windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      sendError(res, new AppError('RATE_LIMITED', 'Too many requests, slow down'), req.requestId);
    },
  });
}
