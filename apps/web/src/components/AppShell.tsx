import { ROLE_LABELS } from '@launchdesk/shared';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { PRODUCT_NAME } from '../config';
import { sidebarItems } from '../routes/navigation';

export function AppShell() {
  const { state, logout } = useAuth();
  if (state.status !== 'authenticated') return null;
  const { user } = state;
  const items = sidebarItems(user.role);
  const portal = user.customerAccountId ? 'customer' : 'provider';

  return (
    <div className={`shell shell--${portal}`}>
      <aside className="shell__sidebar" aria-label="Primary">
        <div className="shell__brand">
          {PRODUCT_NAME}
          <span className="shell__portal">
            {portal === 'customer' ? 'Customer portal' : 'Provider workspace'}
          </span>
        </div>
        <nav>
          <ul className="nav">
            {items.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} end={item.path === '/'} className="nav__link">
                  {item.label}
                  {item.ticket ? <span className="badge badge--pending">Pending</span> : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="shell__main">
        <header className="topbar">
          <span className="topbar__org">{user.organizationName}</span>
          <span className="topbar__user">
            {user.displayName} · <span className="muted">{ROLE_LABELS[user.role]}</span>
          </span>
          <button type="button" className="btn btn--ghost" onClick={() => void logout()}>
            Sign out
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
