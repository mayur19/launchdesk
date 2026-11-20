import type { CustomerAccount } from '@launchdesk/shared';

export function CustomerTable({ customers }: { readonly customers: readonly CustomerAccount[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="muted" style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>
          Customer accounts of your provider organization
        </caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Industry</th>
            <th scope="col">Primary contact</th>
            <th scope="col">Website</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.industry ?? '—'}</td>
              <td>{customer.primaryContact ?? '—'}</td>
              <td>{customer.websiteText ?? '—'}</td>
              <td>
                <span className={`badge badge--${customer.status.toLowerCase()}`}>
                  {customer.status === 'ACTIVE' ? 'Active' : 'Archived'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
