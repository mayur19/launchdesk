import { expect, test, type Page } from '@playwright/test';

/** Development-only demo credentials (see README). */
const PASSWORD = 'DemoPassword!2026';
const ADMIN = 'admin@northstar.example';
const CUSTOMER_OWNER = 'owner@atlas-retail.example';

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('redirects anonymous users to the login page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
});

test('rejects invalid credentials', async ({ page }) => {
  await signIn(page, ADMIN, 'wrong-password-123');
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');
});

test('provider admin signs in, sees customer accounts, and signs out', async ({ page }) => {
  await signIn(page, ADMIN);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome');
  await expect(page.getByText('Provider workspace')).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: 'Customers' }).click();
  await expect(page.getByRole('heading', { name: 'Customers', level: 1 })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Atlas Retail' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Vela Health' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'New customer account' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('pending screens name their backlog ticket', async ({ page }) => {
  await signIn(page, ADMIN);
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /Projects/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible();
  await expect(page.getByText('LD-026')).toBeVisible();
});

test('customer users get the customer portal navigation only', async ({ page }) => {
  await signIn(page, CUSTOMER_OWNER);
  await expect(page.getByText('Customer portal')).toBeVisible();
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: /My projects/ })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Customers' })).toHaveCount(0);
});

// TODO(LD-061, LD-062): acceptance scenarios L-01 to L-19 from PRD §9.
