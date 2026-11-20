import { ROLE_LABELS } from '@launchdesk/shared';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

/**
 * Role-specific landing page. TODO(LD-050): route provider roles to the
 * portfolio dashboard (LD-049) and customer roles to the portal (LD-052).
 */
export function DashboardPage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;
  const { user } = state;
  const isCustomer = user.customerAccountId !== null;
  return (
    <section>
      <h1>Welcome, {user.displayName}</h1>
      <p className="muted">
        Signed in as {ROLE_LABELS[user.role]} at {user.organizationName}.
      </p>
      {isCustomer ? (
        <p>
          Your project portal is planned (LD-052). See <Link to="/portal">My projects</Link>.
        </p>
      ) : (
        <p>
          Customer accounts are available now: <Link to="/customers">manage customers</Link>. The
          portfolio dashboard is planned (LD-049).
        </p>
      )}
    </section>
  );
}
