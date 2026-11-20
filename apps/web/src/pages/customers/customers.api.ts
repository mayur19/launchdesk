import type { CreateCustomerInput, CustomerAccount, CustomerStatus } from '@launchdesk/shared';
import { api, type Page } from '../../api/client';

export interface CustomerListParams {
  readonly page: number;
  readonly limit: number;
  readonly search?: string;
  readonly status?: CustomerStatus;
}

export function customerListPath(params: CustomerListParams): string {
  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.status) query.set('status', params.status);
  return `/customers?${query.toString()}`;
}

export function listCustomers(
  params: CustomerListParams,
): Promise<Page<readonly CustomerAccount[]>> {
  return api.getPage<readonly CustomerAccount[]>(customerListPath(params));
}

export function createCustomer(input: CreateCustomerInput): Promise<CustomerAccount> {
  return api.post<CustomerAccount>('/customers', input);
}
