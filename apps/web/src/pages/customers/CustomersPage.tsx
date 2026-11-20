import type { CustomerAccount, CustomerStatus, PageMeta } from '@launchdesk/shared';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/useAuth';
import { CustomerCreateForm } from './CustomerCreateForm';
import { CustomerTable } from './CustomerTable';
import { listCustomers, type CustomerListParams } from './customers.api';

const PAGE_SIZE = 25;

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | {
      readonly status: 'ready';
      readonly items: readonly CustomerAccount[];
      readonly meta: PageMeta;
    };

/** Customer accounts (PRD §4.16, FR-01). Contacts and archive are LD-013 / LD-011. */
export function CustomersPage() {
  const { state: auth } = useAuth();
  const canCreate = auth.status === 'authenticated' && auth.user.role === 'PROVIDER_ADMIN';
  const [params, setParams] = useState<CustomerListParams>({ page: 1, limit: PAGE_SIZE });
  const [searchText, setSearchText] = useState('');
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (query: CustomerListParams) => {
    setState({ status: 'loading' });
    try {
      const page = await listCustomers(query);
      setState({ status: 'ready', items: page.items, meta: page.meta });
    } catch {
      setState({ status: 'error', message: 'Could not load customer accounts.' });
    }
  }, []);

  useEffect(() => {
    void load(params);
  }, [load, params]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setParams({ ...params, page: 1, search: searchText });
  };

  const onCreated = (customer: CustomerAccount) => {
    setNotice(`Created ${customer.name}.`);
    setParams({ ...params });
  };

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <h1>Customers</h1>
          <p className="muted">Accounts you onboard. Customer users never see this list.</p>
        </div>
        <form className="toolbar" role="search" onSubmit={onSearch}>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="visually-hidden">Search customers</span>
            <input
              type="search"
              placeholder="Search by name"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="visually-hidden">Status</span>
            <select
              value={params.status ?? ''}
              onChange={(e) =>
                setParams({
                  ...params,
                  page: 1,
                  status: (e.target.value || undefined) as CustomerStatus | undefined,
                })
              }
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <button type="submit" className="btn btn--ghost">
            Search
          </button>
        </form>
      </header>

      {notice ? (
        <p className="alert alert--success" role="status">
          {notice}
        </p>
      ) : null}

      <div className="card">
        <CustomerListBody state={state} onPage={(page) => setParams({ ...params, page })} />
      </div>

      {canCreate ? <CustomerCreateForm onCreated={onCreated} /> : null}
    </section>
  );
}

function CustomerListBody({
  state,
  onPage,
}: {
  readonly state: LoadState;
  readonly onPage: (page: number) => void;
}) {
  if (state.status === 'loading') return <p role="status">Loading customers…</p>;
  if (state.status === 'error') {
    return (
      <p className="alert alert--error" role="alert">
        {state.message}
      </p>
    );
  }
  if (state.items.length === 0) {
    return (
      <p className="empty muted">No customer accounts match. Adjust the filters or add one.</p>
    );
  }
  const { page, limit, total } = state.meta;
  const lastPage = Math.max(1, Math.ceil(total / limit));
  return (
    <>
      <CustomerTable customers={state.items} />
      <nav className="pager" aria-label="Pagination">
        <span className="muted">
          {total} customer{total === 1 ? '' : 's'} · page {page} of {lastPage}
        </span>
        <span className="toolbar">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={page >= lastPage}
            onClick={() => onPage(page + 1)}
          >
            Next
          </button>
        </span>
      </nav>
    </>
  );
}
