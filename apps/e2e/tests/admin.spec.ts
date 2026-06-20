import { test, expect, type Page } from '@playwright/test';

const ADMIN_TOKEN = 'supersecret';
const ROADMAP_ID = 'cmqjg391q0000tux4lzw52wao'; // "Frontend Developer"

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.locator('#admin-token').fill(ADMIN_TOKEN);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/roadmaps$/, { timeout: 8000 });
}

test.describe('Admin — Login', () => {
  test('login page renders token input and submit button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#admin-token')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('wrong token shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#admin-token').fill('wrongtoken');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Invalid token')).toBeVisible({ timeout: 8000 });
  });

  test('correct token redirects to /roadmaps', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/roadmaps$/);
  });

  test('already logged-in root redirects to /roadmaps', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/roadmaps$/, { timeout: 5000 });
  });
});

test.describe('Admin — Roadmaps list', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('lists seeded roadmaps', async ({ page }) => {
    await expect(page.getByText('Frontend Developer')).toBeVisible();
    await expect(page.getByText('Backend Developer')).toBeVisible();
    await expect(page.getByText('Fullstack Developer')).toBeVisible();
  });

  test('"New Roadmap" button opens create modal', async ({ page }) => {
    await page.getByRole('button', { name: /new roadmap/i }).click();
    // Modal input for title should appear
    await expect(page.getByLabel(/title/i).or(page.locator('input[placeholder*="title" i]'))).toBeVisible({ timeout: 5000 });
  });

  test('clicking a roadmap navigates to graph editor', async ({ page }) => {
    await page.getByRole('link', { name: /frontend developer/i }).click();
    await expect(page).toHaveURL(/\/roadmaps\//, { timeout: 5000 });
  });

  test('unauthenticated visit to /roadmaps redirects to /login', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('admin_token'));
    await page.goto('/roadmaps');
    await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });
  });
});

test.describe('Admin — Graph editor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/roadmaps/${ROADMAP_ID}`);
  });

  test('graph editor loads React Flow canvas', async ({ page }) => {
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10000 });
  });

  test('save button is present in editor', async ({ page }) => {
    await page.locator('.react-flow').waitFor({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible({ timeout: 5000 });
  });

  test('no console errors on graph editor load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.locator('.react-flow').waitFor({ timeout: 10000 });
    const critical = errors.filter(
      (e) => !e.includes('Download the React DevTools') && !e.includes('Warning:')
    );
    expect(critical, `Console errors:\n${critical.join('\n')}`).toHaveLength(0);
  });
});
