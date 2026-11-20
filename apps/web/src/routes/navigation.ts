import { CUSTOMER_ROLES, PROVIDER_ROLES, type Role } from '@launchdesk/shared';

export interface NavItem {
  readonly path: string;
  readonly label: string;
  /** Backlog ticket that delivers this screen; omitted once implemented. */
  readonly ticket?: string;
  /** Roles that may see the screen. Omitted = every signed-in user. Display only: the API enforces access. */
  readonly roles?: readonly Role[];
  /** Detail screens reached by deep link only (route params); hidden from the sidebar. */
  readonly hidden?: boolean;
}

const PROVIDER: readonly Role[] = PROVIDER_ROLES;
const CUSTOMER: readonly Role[] = CUSTOMER_ROLES;
const MANAGERS: readonly Role[] = ['PROVIDER_ADMIN', 'IMPLEMENTATION_MANAGER'];
const ADMIN: readonly Role[] = ['PROVIDER_ADMIN'];

/**
 * Every screen from PRD §4. Screens with a ticket render a PendingPage until
 * delivered. Provider and customer users see disjoint navigation (ADR-0013).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  // §4.1 / §4.2: role-specific home; provider portfolio dashboard is LD-049.
  { path: '/', label: 'Home' },
  { path: '/portfolio', label: 'Portfolio', ticket: 'LD-049', roles: PROVIDER },
  { path: '/projects', label: 'Projects', ticket: 'LD-026', roles: PROVIDER },
  { path: '/projects/new', label: 'New project', ticket: 'LD-025', roles: MANAGERS },
  { path: '/customers', label: 'Customers', roles: PROVIDER },
  { path: '/templates', label: 'Templates', ticket: 'LD-017', roles: PROVIDER },
  { path: '/reports', label: 'Reports', ticket: 'LD-058', roles: MANAGERS },
  { path: '/portal', label: 'My projects', ticket: 'LD-052', roles: CUSTOMER },
  { path: '/notifications', label: 'Notifications', ticket: 'LD-055' },
  { path: '/settings', label: 'Team & audit', ticket: 'LD-059', roles: ADMIN },
  // Deep-link detail screens (project and task context).
  {
    path: '/projects/:projectId',
    label: 'Project overview',
    ticket: 'LD-027',
    roles: PROVIDER,
    hidden: true,
  },
  {
    path: '/projects/:projectId/tasks',
    label: 'Project tasks',
    ticket: 'LD-032',
    roles: PROVIDER,
    hidden: true,
  },
  {
    path: '/projects/:projectId/board',
    label: 'Task board',
    ticket: 'LD-033',
    roles: PROVIDER,
    hidden: true,
  },
  {
    path: '/projects/:projectId/milestones',
    label: 'Milestones',
    ticket: 'LD-040',
    roles: PROVIDER,
    hidden: true,
  },
  {
    path: '/projects/:projectId/files',
    label: 'Shared files',
    ticket: 'LD-043',
    roles: PROVIDER,
    hidden: true,
  },
  {
    path: '/projects/:projectId/risks',
    label: 'Risks and blockers',
    ticket: 'LD-047',
    roles: PROVIDER,
    hidden: true,
  },
  {
    path: '/projects/:projectId/activity',
    label: 'Activity and decisions',
    ticket: 'LD-053',
    roles: PROVIDER,
    hidden: true,
  },
  { path: '/tasks/:taskId', label: 'Task detail', ticket: 'LD-034', roles: PROVIDER, hidden: true },
  {
    path: '/portal/projects/:projectId',
    label: 'Customer project portal',
    ticket: 'LD-052',
    roles: CUSTOMER,
    hidden: true,
  },
  {
    path: '/portal/milestones/:milestoneId',
    label: 'Milestone acceptance',
    ticket: 'LD-044',
    roles: CUSTOMER,
    hidden: true,
  },
];

export function isVisibleTo(item: NavItem, role: Role): boolean {
  return !item.roles || item.roles.includes(role);
}

export function sidebarItems(role: Role): readonly NavItem[] {
  return NAV_ITEMS.filter((item) => !item.hidden && isVisibleTo(item, role));
}
