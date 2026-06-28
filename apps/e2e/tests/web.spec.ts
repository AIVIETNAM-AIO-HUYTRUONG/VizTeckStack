import { test, expect } from '@playwright/test';

// Seeded data from the database
const ROADMAPS = [
  { slug: 'frontend', title: 'Frontend Developer' },
  { slug: 'backend', title: 'Backend Developer' },
  { slug: 'fullstack', title: 'Fullstack Developer' },
];

const LESSON_NODE_ID = 'lesson-intro'; // "Intro to HTML" node in frontend

test.describe('Web — Homepage', () => {
  test('loads and shows roadmap cards', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/VizTeckStack/);
    await expect(page.getByRole('heading', { name: 'Learning Roadmaps' })).toBeVisible();

    for (const rm of ROADMAPS) {
      await expect(page.getByText(rm.title).first()).toBeVisible();
    }
  });

  test('roadmap cards link to correct detail page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Frontend Developer').first().click();
    await expect(page).toHaveURL(/\/roadmap\/frontend/);
  });

  test('header logo links back to homepage', async ({ page }) => {
    await page.goto('/roadmap/frontend');
    await page.getByRole('link', { name: 'VizTeckStack' }).click();
    await expect(page).toHaveURL('/');
  });

  test('theme toggle button is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /toggle dark mode/i })).toBeVisible();
  });
});

test.describe('Web — Roadmap page', () => {
  test('roadmap graph page loads for each seeded roadmap', async ({ page }) => {
    for (const rm of ROADMAPS) {
      await page.goto(`/roadmap/${rm.slug}`);
      // React Flow canvas should mount
      await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10000 });
    }
  });

  test('unknown slug shows 404', async ({ page }) => {
    const res = await page.goto('/roadmap/does-not-exist-xyz');
    // Next.js notFound() returns 404
    expect(res?.status()).toBe(404);
  });

  test('roadmap page has no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/roadmap/frontend');
    await page.locator('.react-flow').waitFor({ timeout: 10000 });
    // Filter out known non-blocking dev warnings
    const critical = errors.filter(
      (e) => !e.includes('Download the React DevTools') && !e.includes('Warning:')
    );
    expect(critical, `Console errors: ${critical.join('\n')}`).toHaveLength(0);
  });
});

test.describe('Web — Lesson node page', () => {
  test('loads lesson node page correctly', async ({ page }) => {
    await page.goto(`/roadmap/frontend/node/${LESSON_NODE_ID}`);
    // Should show the lesson title
    await expect(page.locator('h1').filter({ hasText: /intro to html/i })).toBeVisible({
      timeout: 8000,
    });
    // Sidebar should show the roadmap tree
    await expect(page.locator('[data-testid="lesson-sidebar"]')).toBeVisible();
  });

  test('back to roadmap button navigates correctly', async ({ page }) => {
    await page.goto(`/roadmap/frontend/node/${LESSON_NODE_ID}`);
    // Breadcrumb "Frontend" link navigates back to the roadmap
    await expect(page.locator('a[href="/roadmap/frontend"]').first()).toBeVisible({ timeout: 8000 });
    await page.locator('a[href="/roadmap/frontend"]').first().click();
    await expect(page).toHaveURL(/\/roadmap\/frontend$/);
  });

  test('invalid node id shows error gracefully', async ({ page }) => {
    await page.goto('/roadmap/frontend/node/00000000-0000-0000-0000-000000000000');
    // Should not crash — either 404, error message, or error boundary
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Application error');
  });
});

test.describe('Web — Dark mode', () => {
  test('toggles dark class on html element', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');

    const toggle = page.getByRole('button', { name: /toggle dark mode/i });
    const initialDark = await html.evaluate((el) => el.classList.contains('dark'));

    await toggle.click();
    const afterDark = await html.evaluate((el) => el.classList.contains('dark'));

    expect(afterDark).toBe(!initialDark);
  });
});
