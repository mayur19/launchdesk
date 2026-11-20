import { PROVIDER_ROLES, type Role } from '@launchdesk/shared';

/**
 * Who may do what with customer accounts (PRD §3, FR-01; ADR-0007).
 * Customer-portal roles never list or read customer accounts: they would
 * learn about the provider's other clients.
 */
export const CUSTOMER_READ_ROLES: readonly Role[] = PROVIDER_ROLES;
export const CUSTOMER_CREATE_ROLES: readonly Role[] = ['PROVIDER_ADMIN'];

export function canReadCustomers(role: Role): boolean {
  return CUSTOMER_READ_ROLES.includes(role);
}

export function canCreateCustomers(role: Role): boolean {
  return CUSTOMER_CREATE_ROLES.includes(role);
}
