import { z } from 'zod';
import { ROLES } from '../roles.js';

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(256),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const sessionUserSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(ROLES),
  /** Set for customer-portal users only (ADR-0013); null for provider staff. */
  customerAccountId: z.string().uuid().nullable(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

export const sessionResponseSchema = z.object({
  user: sessionUserSchema,
  csrfToken: z.string().min(32),
});

export type SessionResponse = z.infer<typeof sessionResponseSchema>;
