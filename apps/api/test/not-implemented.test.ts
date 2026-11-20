import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { pendingRouter } from '../src/lib/not-implemented.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { silentLogger } from './helpers.js';

describe('pendingRouter', () => {
  it('answers 501 with the tracking ticket', async () => {
    const app = express();
    app.use('/x', pendingRouter([{ method: 'post', path: '/', ticket: 'ABC-123' }]));
    app.use(errorHandler(silentLogger));
    const res = await request(app).post('/x');
    expect(res.status).toBe(501);
    expect(res.body.error).toMatchObject({
      code: 'NOT_IMPLEMENTED',
      details: { ticket: 'ABC-123' },
    });
  });
});
