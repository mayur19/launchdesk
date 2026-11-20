import type { Role, SessionUser } from '@launchdesk/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../src/auth/AuthProvider';
import { CustomersPage } from '../src/pages/customers/CustomersPage';

const atlas = {
  id: '00000000-0000-4000-8000-0000000000c1',
  name: 'Atlas Retail',
  industry: 'Retail',
  websiteText: 'atlas-retail.example',
  primaryContact: 'Casey Patel',
  status: 'ACTIVE',
  archivedAt: null,
  createdAt: '2026-11-20T00:00:00.000Z',
  updatedAt: '2026-11-20T00:00:00.000Z',
  version: 1,
};

function user(role: Role): SessionUser {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    organizationId: '00000000-0000-4000-8000-0000000000aa',
    organizationName: 'Northstar Cloud',
    email: 'x@example.test',
    displayName: 'X',
    role,
    customerAccountId: null,
  };
}

function renderAs(role: Role) {
  const value: AuthContextValue = {
    state: { status: 'authenticated', user: user(role) },
    login: async () => undefined,
    logout: async () => undefined,
  };
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CustomersPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

const listResponse = () =>
  json(200, { success: true, data: [atlas], error: null, meta: { total: 1, page: 1, limit: 25 } });

afterEach(() => vi.unstubAllGlobals());

describe('CustomersPage', () => {
  it('lists customer accounts from the API', async () => {
    const fetchMock = vi.fn(async () => listResponse());
    vi.stubGlobal('fetch', fetchMock);
    renderAs('PROVIDER_CONTRIBUTOR');
    expect(await screen.findByText('Atlas Retail')).toBeInTheDocument();
    expect(screen.getByText('1 customer · page 1 of 1')).toBeInTheDocument();
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe(
      '/api/v1/customers?page=1&limit=25',
    );
  });

  it('hides the create form from non-admin provider roles', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => listResponse()),
    );
    renderAs('IMPLEMENTATION_MANAGER');
    await screen.findByText('Atlas Retail');
    expect(screen.queryByRole('heading', { name: 'New customer account' })).toBeNull();
  });

  it('shows an empty state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        json(200, { success: true, data: [], error: null, meta: { total: 0, page: 1, limit: 25 } }),
      ),
    );
    renderAs('PROVIDER_ADMIN');
    expect(await screen.findByText(/No customer accounts match/)).toBeInTheDocument();
  });

  it('shows an error when the list cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        json(500, { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: 'x' } }),
      ),
    );
    renderAs('PROVIDER_ADMIN');
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load customer accounts.');
  });

  it('validates the form client-side before calling the API', async () => {
    const fetchMock = vi.fn(async () => listResponse());
    vi.stubGlobal('fetch', fetchMock);
    renderAs('PROVIDER_ADMIN');
    await screen.findByText('Atlas Retail');
    fireEvent.click(screen.getByRole('button', { name: 'Create customer' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('creates a customer and reloads the list', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? json(201, {
            success: true,
            data: { ...atlas, id: 'new', name: 'Polaris Media' },
            error: null,
          })
        : listResponse(),
    );
    vi.stubGlobal('fetch', fetchMock);
    renderAs('PROVIDER_ADMIN');
    await screen.findByText('Atlas Retail');
    fireEvent.change(screen.getByLabelText('Customer name'), {
      target: { value: 'Polaris Media' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create customer' }));
    expect(await screen.findByText('Created Polaris Media.')).toBeInTheDocument();
    const post = fetchMock.mock.calls.find((call) => call[1]?.method === 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      name: 'Polaris Media',
      industry: null,
      websiteText: null,
      primaryContact: null,
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  });

  it('surfaces a duplicate-name conflict from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) =>
        init?.method === 'POST'
          ? json(409, {
              success: false,
              data: null,
              error: {
                code: 'CONFLICT',
                message: 'A customer account with this name already exists',
              },
            })
          : listResponse(),
      ),
    );
    renderAs('PROVIDER_ADMIN');
    await screen.findByText('Atlas Retail');
    fireEvent.change(screen.getByLabelText('Customer name'), { target: { value: 'Atlas Retail' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create customer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
  });
});
