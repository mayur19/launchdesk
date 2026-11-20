import { CUSTOMER_ROLES, PROVIDER_ROLES } from '@launchdesk/shared';
import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, sidebarItems } from '../src/routes/navigation';

describe('navigation', () => {
  it('covers all 20 PRD §4 screens with unique paths', () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(NAV_ITEMS.length).toBeGreaterThanOrEqual(20);
  });

  it('tags every pending screen with an LD ticket', () => {
    for (const item of NAV_ITEMS.filter((i) => i.ticket)) {
      expect(item.ticket).toMatch(/^LD-\d{3}$/);
    }
  });

  it('marks customer accounts as implemented', () => {
    expect(NAV_ITEMS.find((i) => i.path === '/customers')?.ticket).toBeUndefined();
  });

  it('never shows provider screens to customer users', () => {
    for (const role of CUSTOMER_ROLES) {
      const labels = sidebarItems(role).map((i) => i.label);
      expect(labels).toEqual(['Home', 'My projects', 'Notifications']);
    }
  });

  it('shows admin-only screens to provider admins only', () => {
    for (const role of PROVIDER_ROLES) {
      const hasSettings = sidebarItems(role).some((i) => i.path === '/settings');
      expect(hasSettings).toBe(role === 'PROVIDER_ADMIN');
    }
  });

  it('hides deep-link detail screens from the sidebar', () => {
    const sidebar = sidebarItems('PROVIDER_ADMIN').map((i) => i.path);
    expect(sidebar.some((path) => path.includes(':'))).toBe(false);
  });
});
