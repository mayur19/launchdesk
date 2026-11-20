import { describe, expect, it } from 'vitest';
import {
  CUSTOMER_ROLES,
  isCustomerRole,
  isProviderRole,
  PROVIDER_ROLES,
  ROLE_LABELS,
  ROLES,
} from '../src/index.js';

describe('actor model', () => {
  it('lists the five PRD §3 roles, provider roles first', () => {
    expect(ROLES).toEqual([
      'PROVIDER_ADMIN',
      'IMPLEMENTATION_MANAGER',
      'PROVIDER_CONTRIBUTOR',
      'CUSTOMER_OWNER',
      'CUSTOMER_MEMBER',
    ]);
  });

  it('partitions roles into provider and customer sides', () => {
    for (const role of PROVIDER_ROLES) {
      expect(isProviderRole(role)).toBe(true);
      expect(isCustomerRole(role)).toBe(false);
    }
    for (const role of CUSTOMER_ROLES) {
      expect(isCustomerRole(role)).toBe(true);
      expect(isProviderRole(role)).toBe(false);
    }
  });

  it('has a human label for every role', () => {
    expect(Object.keys(ROLE_LABELS).sort()).toEqual([...ROLES].sort());
  });
});
