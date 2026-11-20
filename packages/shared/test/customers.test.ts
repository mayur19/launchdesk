import { describe, expect, it } from 'vitest';
import { createCustomerRequestSchema, listCustomersQuerySchema } from '../src/index.js';

describe('createCustomerRequestSchema', () => {
  it('trims fields and maps blank optional text to null', () => {
    const parsed = createCustomerRequestSchema.parse({
      name: '  Atlas Retail ',
      industry: ' Retail ',
      websiteText: '   ',
    });
    expect(parsed).toEqual({
      name: 'Atlas Retail',
      industry: 'Retail',
      websiteText: null,
      primaryContact: null,
    });
  });

  it('requires a non-blank name', () => {
    const result = createCustomerRequestSchema.safeParse({ name: '   ' });
    expect(result.success).toBe(false);
  });

  it('enforces maximum lengths', () => {
    expect(createCustomerRequestSchema.safeParse({ name: 'x'.repeat(201) }).success).toBe(false);
    expect(
      createCustomerRequestSchema.safeParse({ name: 'ok', industry: 'x'.repeat(101) }).success,
    ).toBe(false);
  });

  it('rejects unknown fields such as a client-supplied tenant id', () => {
    const result = createCustomerRequestSchema.safeParse({ name: 'ok', organizationId: 'x' });
    expect(result.success).toBe(false);
  });
});

describe('listCustomersQuerySchema', () => {
  it('applies pagination defaults and accepts status and search filters', () => {
    expect(listCustomersQuerySchema.parse({ status: 'ACTIVE', search: ' atl ' })).toEqual({
      page: 1,
      limit: 25,
      status: 'ACTIVE',
      search: 'atl',
    });
  });

  it('rejects unknown statuses', () => {
    expect(listCustomersQuerySchema.safeParse({ status: 'DELETED' }).success).toBe(false);
  });
});
