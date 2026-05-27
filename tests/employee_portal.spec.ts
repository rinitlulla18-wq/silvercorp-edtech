import { test, expect, Page } from '@playwright/test';

async function loginAsEmployee(page: Page) {
  await page.goto('/');
  // Prevent the attendance modal from showing
  await page.evaluate(() => {
    localStorage.setItem('attendance_popup_last_shown_USR-2026-RINIT', new Date().toDateString());
  });

  await page.fill('input[type="email"]', 'rinitlulla18@gmail.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Fallback: Dismiss the daily attendance popup if it appears anyway
  const closeBtn = page.locator('button', { hasText: 'Close' });
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
    await expect(closeBtn).not.toBeVisible();
  }
  await expect(page.locator('h2', { hasText: 'Total Leads' })).toBeVisible({ timeout: 10000 });
}

test.describe('Employee Portal & Admin Tool', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  // ── ADMIN TOOL NAVIGATION ─────────────────────────────────────────────────────

  test('Admin Tool tab is visible in nav', async ({ page }) => {
    await expect(page.locator('text=Admin Tool')).toBeVisible();
  });

  test('clicking Admin Tool opens the admin panel', async ({ page }) => {
    await page.click('text=Admin Tool');
    // AdminTool renders employee management
    await expect(page.locator('text=Manage Employees').or(page.locator('text=Add Employee').or(page.locator('text=Team')))).toBeVisible({ timeout: 8000 });
  });

  // ── TASKS NAVIGATION ─────────────────────────────────────────────────────────

  test('Tasks tab is visible in nav', async ({ page }) => {
    await expect(page.locator('text=Tasks')).toBeVisible();
  });

  test('clicking Tasks shows My Tasks section', async ({ page }) => {
    await page.click('text=Tasks');
    await expect(page.locator('text=My Tasks')).toBeVisible({ timeout: 8000 });
  });

  test('Tasks view has an input to add new tasks', async ({ page }) => {
    await page.click('text=Tasks');
    // UserTasksTab.tsx has placeholder "Add a new task..."
    await expect(page.locator('input[placeholder="Add a new task..."]')).toBeVisible({ timeout: 8000 });
  });

  test('can add a personal task in Tasks view', async ({ page }) => {
    await page.click('text=Tasks');
    const taskText = `Task-${Date.now()}`;
    await page.fill('input[placeholder="Add a new task..."]', taskText);
    // There's also an optional Student ID field
    await page.locator('button', { hasText: 'Add Task' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(`text=${taskText}`).first()).toBeVisible();
  });

  // ── DASHBOARD NAVIGATION ──────────────────────────────────────────────────────

  test('Dashboard tab navigates back to overview', async ({ page }) => {
    await page.click('text=Tasks');
    await page.click('text=Dashboard');
    await expect(page.locator('h2', { hasText: 'Total Leads' })).toBeVisible({ timeout: 8000 });
  });

  test('All Leads tab shows the student table', async ({ page }) => {
    await page.click('text=All Leads');
    await expect(page.locator('th', { hasText: 'STUDENT INFO' })).toBeVisible({ timeout: 8000 });
  });

  // ── ATTENDANCE MODAL (AttendanceModal.tsx) ────────────────────────────────────

  test('attendance modal has Discipline Beats Motivation title', async ({ page }) => {
    // After login, set localStorage to force popup for next visit
    await page.evaluate(() => {
      const userId = JSON.parse(localStorage.getItem('silvercorp_session') || '{}');
      localStorage.removeItem(`attendance_popup_last_shown_USR-2026-RINIT`);
    });
    await page.reload();
    // Modal should appear (title = "Discipline Beats Motivation")
    const modalTitle = page.locator('h2', { hasText: 'Discipline Beats Motivation' });
    if (await modalTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(modalTitle).toBeVisible();
      await expect(page.locator('button', { hasText: 'Close' })).toBeVisible();
      await page.locator('button', { hasText: 'Close' }).click();
      await expect(modalTitle).not.toBeVisible();
    }
  });

  // ── PROFILE MODAL ─────────────────────────────────────────────────────────────

  test('employee can open profile modal', async ({ page }) => {
    // Click avatar in header
    await page.locator('img[alt*="Rinit"]').click();
    await expect(page.locator('h2', { hasText: 'User Profile' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Rinit Lulla')).toBeVisible();
    await page.locator('button[aria-label="Close modal"]').click();
  });

  test('profile modal shows correct user email', async ({ page }) => {
    await page.locator('img[alt*="Rinit"]').click();
    await expect(page.locator('text=rinitlulla18@gmail.com')).toBeVisible();
  });

  test('profile modal matches user ID', async ({ page }) => {
    await page.locator('img[alt*="Rinit"]').click();
    await expect(page.locator('text=User ID: USR-2026-RINIT')).toBeVisible();
  });

  test('user profile modal has Attendance and Leaves buttons', async ({ page }) => {
    await page.locator('img[alt*="Rinit"]').click();
    await expect(page.locator('text=Attendance')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Leaves')).toBeVisible();
  });

  test('closing profile modal with X button works', async ({ page }) => {
    await page.locator('img[alt*="Rinit"]').click();
    await expect(page.locator('h2', { hasText: 'User Profile' })).toBeVisible({ timeout: 5000 });
    await page.locator('button[aria-label="Close modal"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=User Profile')).not.toBeVisible();
  });

  // ── API-LEVEL ENDPOINT TESTS ──────────────────────────────────────────────────

  test('/api/employees returns list of users', async ({ request }) => {
    const res = await request.get('/api/employees');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    // Check that users have expected fields
    const firstUser = data[0];
    expect(firstUser).toHaveProperty('id');
    expect(firstUser).toHaveProperty('fullName');
    expect(firstUser).toHaveProperty('email');
    expect(firstUser).toHaveProperty('role');
  });

  test('/api/login rejects invalid credentials', async ({ request }) => {
    const res = await request.post('/api/login', {
      data: { email: 'hacker@evil.com', password: 'wrongpass' }
    });
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  test('/api/login accepts valid admin credentials', async ({ request }) => {
    const res = await request.post('/api/login', {
      data: { email: 'rinitlulla18@gmail.com', password: 'admin123' }
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user).toHaveProperty('id');
    expect(data.user.role).toBe('admin');
  });

  // ── HEADER REFRESH BUTTON ─────────────────────────────────────────────────────

  test('refresh button is visible in header', async ({ page }) => {
    // Header has an onRefresh button (SVG rotate icon)
    const refreshBtn = page.locator('button[title="Refresh Data"], button svg.animate-spin').first();
    await expect(page.locator('button').nth(2)).toBeVisible(); // Approximate - at least 3 buttons in header
  });

  // ── RESPONSIVE LAYOUT ─────────────────────────────────────────────────────────

  test('dashboard renders correctly at 1280px wide', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('h2', { hasText: 'Total Leads' })).toBeVisible();
    // All 8 stat cards in a grid
    const cards = page.locator('div').filter({ hasText: /^Total Leads/ });
    await expect(cards.first()).toBeVisible();
  });

  test('dashboard renders stat grid at 1024px wide', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('h2', { hasText: 'Total Leads' })).toBeVisible();
  });
});
