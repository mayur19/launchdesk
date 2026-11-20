/**
 * LaunchDesk actor model (PRD §3, ADR-0007, ADR-0013).
 *
 * Provider roles work inside the paying provider organization (the tenant).
 * Customer roles belong to exactly one customer account of that provider and
 * only ever see customer-visible data for their own account. Authorization is
 * always enforced by the API; the web client uses these lists for display only.
 */
export const PROVIDER_ROLES = [
  'PROVIDER_ADMIN',
  'IMPLEMENTATION_MANAGER',
  'PROVIDER_CONTRIBUTOR',
] as const;

export const CUSTOMER_ROLES = ['CUSTOMER_OWNER', 'CUSTOMER_MEMBER'] as const;

export const ROLES = [...PROVIDER_ROLES, ...CUSTOMER_ROLES] as const;

export type ProviderRole = (typeof PROVIDER_ROLES)[number];
export type CustomerRole = (typeof CUSTOMER_ROLES)[number];
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Readonly<Record<Role, string>> = {
  PROVIDER_ADMIN: 'Provider Admin',
  IMPLEMENTATION_MANAGER: 'Implementation Manager',
  PROVIDER_CONTRIBUTOR: 'Provider Contributor',
  CUSTOMER_OWNER: 'Customer Owner',
  CUSTOMER_MEMBER: 'Customer Member',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function isProviderRole(role: Role): role is ProviderRole {
  return (PROVIDER_ROLES as readonly string[]).includes(role);
}

export function isCustomerRole(role: Role): role is CustomerRole {
  return (CUSTOMER_ROLES as readonly string[]).includes(role);
}
