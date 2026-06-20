# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin — Graph editor >> no console errors on graph editor load
- Location: tests\admin.spec.ts:91:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /verify/i })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "VizTeckStack Admin" [level=1] [ref=e5]
      - paragraph [ref=e6]: Enter your admin token to continue
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: Admin token
        - textbox "Admin token" [active] [ref=e10]:
          - /placeholder: Enter your token
          - text: supersecret
      - button "Sign In" [ref=e11] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e17] [cursor=pointer]:
    - img [ref=e18]
  - alert [ref=e21]
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test';
  2  | 
  3  | const ADMIN_TOKEN = 'supersecret';
  4  | const ROADMAP_ID = 'cmqjg391q0000tux4lzw52wao'; // "Frontend Developer"
  5  | 
  6  | async function loginAsAdmin(page: Page) {
  7  |   await page.goto('/login');
  8  |   await page.locator('#admin-token').fill(ADMIN_TOKEN);
> 9  |   await page.getByRole('button', { name: /sign in/i }).click();
     |                                                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
  10 |   await expect(page).toHaveURL(/\/roadmaps$/, { timeout: 8000 });
  11 | }
  12 | 
  13 | test.describe('Admin — Login', () => {
  14 |   test('login page renders token input and submit button', async ({ page }) => {
  15 |     await page.goto('/login');
  16 |     await expect(page.locator('#admin-token')).toBeVisible();
  17 |     await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  18 |   });
  19 | 
  20 |   test('wrong token shows error', async ({ page }) => {
  21 |     await page.goto('/login');
  22 |     await page.locator('#admin-token').fill('wrongtoken');
  23 |     await page.getByRole('button', { name: /sign in/i }).click();
  24 |     await expect(page.getByText('Invalid token')).toBeVisible({ timeout: 8000 });
  25 |   });
  26 | 
  27 |   test('correct token redirects to /roadmaps', async ({ page }) => {
  28 |     await loginAsAdmin(page);
  29 |     await expect(page).toHaveURL(/\/roadmaps$/);
  30 |   });
  31 | 
  32 |   test('already logged-in root redirects to /roadmaps', async ({ page }) => {
  33 |     await loginAsAdmin(page);
  34 |     await page.goto('/');
  35 |     await expect(page).toHaveURL(/\/roadmaps$/, { timeout: 5000 });
  36 |   });
  37 | });
  38 | 
  39 | test.describe('Admin — Roadmaps list', () => {
  40 |   test.beforeEach(async ({ page }) => {
  41 |     await loginAsAdmin(page);
  42 |   });
  43 | 
  44 |   test('lists seeded roadmaps', async ({ page }) => {
  45 |     await expect(page.getByText('Frontend Developer')).toBeVisible();
  46 |     await expect(page.getByText('Backend Developer')).toBeVisible();
  47 |     await expect(page.getByText('Fullstack Developer')).toBeVisible();
  48 |   });
  49 | 
  50 |   test('"New Roadmap" button opens create modal', async ({ page }) => {
  51 |     await page.getByRole('button', { name: /new roadmap/i }).click();
  52 |     // Modal input for title should appear
  53 |     await expect(page.getByLabel(/title/i).or(page.locator('input[placeholder*="title" i]'))).toBeVisible({ timeout: 5000 });
  54 |   });
  55 | 
  56 |   test('clicking a roadmap navigates to graph editor', async ({ page }) => {
  57 |     await page.getByRole('link', { name: /frontend developer/i }).click();
  58 |     await expect(page).toHaveURL(/\/roadmaps\//, { timeout: 5000 });
  59 |   });
  60 | 
  61 |   test('unauthenticated visit to /roadmaps redirects to /login', async ({ page }) => {
  62 |     await page.goto('/');
  63 |     await page.evaluate(() => localStorage.removeItem('admin_token'));
  64 |     await page.goto('/roadmaps');
  65 |     await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });
  66 |   });
  67 | });
  68 | 
  69 | test.describe('Admin — Graph editor', () => {
  70 |   test.beforeEach(async ({ page }) => {
  71 |     await loginAsAdmin(page);
  72 |     await page.goto(`/roadmaps/${ROADMAP_ID}`);
  73 |   });
  74 | 
  75 |   test('graph editor loads React Flow canvas', async ({ page }) => {
  76 |     await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10000 });
  77 |   });
  78 | 
  79 |   test('save button is present in editor', async ({ page }) => {
  80 |     await page.locator('.react-flow').waitFor({ timeout: 10000 });
  81 |     await expect(page.getByRole('button', { name: /save/i })).toBeVisible({ timeout: 5000 });
  82 |   });
  83 | 
  84 |   test('no console errors on graph editor load', async ({ page }) => {
  85 |     const errors: string[] = [];
  86 |     page.on('console', (msg) => {
  87 |       if (msg.type() === 'error') errors.push(msg.text());
  88 |     });
  89 |     await page.locator('.react-flow').waitFor({ timeout: 10000 });
  90 |     const critical = errors.filter(
  91 |       (e) => !e.includes('Download the React DevTools') && !e.includes('Warning:')
  92 |     );
  93 |     expect(critical, `Console errors:\n${critical.join('\n')}`).toHaveLength(0);
  94 |   });
  95 | });
  96 | 
```