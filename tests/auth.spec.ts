import { test, expect, Page } from '@playwright/test';

// Shared login helper - matches real UI: type="email", type="password", button text "Sign In"
async function login(page: Page, email = 'rinitlulla18@gmail.com', password = 'admin123') {
  await page.goto('/');
  // Prevent the attendance modal from showing
  await page.evaluate(() => {
    localStorage.setItem('attendance_popup_last_shown_USR-2026-RINIT', new Date().toDateString());
  });

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]'); // "Sign In" button

  // Fallback: Dismiss the daily attendance popup if it appears anyway
  const closeBtn = page.locator('button', { hasText: 'Close' });
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
    await expect(closeBtn).not.toBeVisible();
  }
}

test.describe('Authentication', () => {
  test('login page shows correct branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=SILVERCORP EDTECH')).toBeVisible();
    await expect(page.locator('text=Welcome')).toBeVisible();
    await expect(page.locator('text=Enter your credentials to access the portal')).toBeVisible();
  });

  test('login form has correct input types', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]', { hasText: 'Sign In' })).toBeVisible();
  });

  test('successful admin login lands on dashboard', async ({ page }) => {
    await login(page);
    await expect(page.locator('h2', { hasText: 'Total Leads' })).toBeVisible({ timeout: 10000 });
    // User name is in the avatar alt text
    await expect(page.locator('img[alt*="Rinit"]')).toBeVisible();
  });

  test('wrong password shows error message', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'rinitlulla18@gmail.com');
    await page.fill('input[type="password"]', 'WRONGPASSWORD');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
    // Should still be on login page
    await expect(page.locator('button[type="submit"]', { hasText: 'Sign In' })).toBeVisible();
  });

  test('empty email shows browser validation error (not submitting)', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    // Browser native validation prevents submission - stay on login page
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('text=Total Leads')).not.toBeVisible();
  });

  test('empty password shows validation error message', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'rinitlulla18@gmail.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please enter both email and password')).toBeVisible({ timeout: 3000 });
  });

  test('session persists after page reload', async ({ page }) => {
    await login(page);
    await expect(page.locator('h2', { hasText: 'Total Leads' })).toBeVisible({ timeout: 10000 });
    await page.reload();
    // Pre-emptively wait for the app to settle
    await page.waitForLoadState('networkidle');
    // Re-dismiss modal if it reappears due to reload
    const closeBtn = page.locator('button', { hasText: 'Close' });
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    }
    // Should still be logged in
    await expect(page.locator('h2', { hasText: 'Total Leads' })).toBeVisible({ timeout: 15000 });
  });

  test('clearing session storage logs out on reload', async ({ page }) => {
    await login(page);
    await expect(page.locator('h2', { hasText: 'Total Leads' })).toBeVisible({ timeout: 10000 });
    // Remove the session key used in App.tsx
    await page.evaluate(() => localStorage.removeItem('silvercorp_session'));
    await page.reload();
    // Should be back on login page
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
  });

  test('logout via profile modal works', async ({ page }) => {
    await login(page);
    // Explicitly wait for the avatar to be visible
    const avatar = page.locator('img[alt*="Rinit"]');
    await expect(avatar).toBeVisible({ timeout: 10000 });
    await avatar.click();
    await page.locator('button span', { hasText: 'Logout' }).click();
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
  });

  test('all four nav items visible after login', async ({ page }) => {
    await login(page);
    await expect(page.locator('button', { hasText: 'Dashboard' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'All Leads' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Tasks', exact: true }).first()).toBeVisible();
    await expect(page.locator('button', { hasText: 'Admin Tool' })).toBeVisible();
  });

  test('non-existent email shows error', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'nobody@notexist.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
  });
});
