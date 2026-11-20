import { z } from 'zod';
import { paginationQuerySchema } from './common.js';

/** Customer accounts (PRD FR-01). Shared by API validation and the web form. */
export const CUSTOMER_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const CUSTOMER_LIMITS = {
  nameMax: 200,
  industryMax: 100,
  websiteTextMax: 300,
  primaryContactMax: 200,
  searchMax: 100,
} as const;

/** Trim, then map empty strings to null so optional text never stores ''. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

export const createCustomerRequestSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(CUSTOMER_LIMITS.nameMax),
    industry: optionalText(CUSTOMER_LIMITS.industryMax),
    websiteText: optionalText(CUSTOMER_LIMITS.websiteTextMax),
    primaryContact: optionalText(CUSTOMER_LIMITS.primaryContactMax),
  })
  .strict();

export type CreateCustomerRequest = z.infer<typeof createCustomerRequestSchema>;
export type CreateCustomerInput = z.input<typeof createCustomerRequestSchema>;

export const listCustomersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(CUSTOMER_STATUSES).optional(),
  search: z.string().trim().min(1).max(CUSTOMER_LIMITS.searchMax).optional(),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

export const customerAccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  industry: z.string().nullable(),
  websiteText: z.string().nullable(),
  primaryContact: z.string().nullable(),
  status: z.enum(CUSTOMER_STATUSES),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
});

export type CustomerAccount = z.infer<typeof customerAccountSchema>;
