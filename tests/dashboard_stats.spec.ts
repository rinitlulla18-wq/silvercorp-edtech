import { test, expect, Page } from '@playwright/test';

async function login(page: Page, email = 'rinitlulla18@gmail.com', password = 'admin123') {
  await page.goto('/');
  // Prevent the attendance modal from showing
  await page.evaluate(() => {
    localStorage.setItem('attendance_popup_last_shown_USR-2026-RINIT', new Date().toDateString());
  });

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Fallback: Dismiss the daily attendance popup if it appears anyway
  const closeBtn = page.locator('button', { hasText: 'Close' });
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
    await expect(closeBtn).not.toBeVisible();
  }
}

test.describe('Dashboard Statistics Accuracy', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Should be on dashboard
    await expect(page.locator('h2', { hasText: 'Total Leads' })).toBeVisible({ timeout: 10000 });
  });

  // ── MAIN STATS CARDS ─────────────────────────────────────────────────────────

  test('Total Leads card is visible and shows a number', async ({ page }) => {
    const card = page.locator('div').filter({ hasText: 'Total Leads' }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    const value = card.locator('h3').first();
    const text = await value.textContent();
    expect(parseInt(text!.replace(/,/g, ''))).toBeGreaterThan(0);
  });

  test('Total Leads shows 505 (correct global total, not paginated 50)', async ({ page }) => {
    const totalLeadsSection = page.locator('div').filter({ hasText: 'Total Leads' }).filter({ hasText: 'Assigned to you' }).first();
    await expect(totalLeadsSection).toBeVisible({ timeout: 10000 });
    const valueEl = totalLeadsSection.locator('h3').first();
    const text = await valueEl.textContent();
    const total = parseInt(text!.replace(/,/g, ''));
    expect(total).toBeGreaterThanOrEqual(505);
  });

  test('Lost stat card is visible with a numeric value', async ({ page }) => {
    const lostSection = page.locator('div').filter({ hasText: 'Lost' }).filter({ hasText: 'of total' }).first();
    await expect(lostSection).toBeVisible({ timeout: 10000 });
    const valueEl = lostSection.locator('h3').first();
    const text = await valueEl.textContent();
    expect(parseInt(text!)).toBeGreaterThanOrEqual(0);
  });

  test('Finalised card is visible', async ({ page }) => {
    await expect(page.locator('div').filter({ hasText: 'Finalised' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('In Follow-up card is visible', async ({ page }) => {
    await expect(page.locator('div').filter({ hasText: 'In Follow-up' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('Converted card is visible', async ({ page }) => {
    await expect(page.locator('div').filter({ hasText: 'Converted' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('Overdue card is visible and shows a number', async ({ page }) => {
    const overdueSection = page.locator('div').filter({ hasText: 'Overdue' }).filter({ hasText: 'Action needed' }).first();
    await expect(overdueSection).toBeVisible({ timeout: 10000 });
    const value = await overdueSection.locator('h3').first().textContent();
    expect(parseInt(value!)).toBeGreaterThanOrEqual(0);
  });

  test('Due Today card is visible with subtext', async ({ page }) => {
    await expect(page.locator('text=Due Today')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Follow-ups required')).toBeVisible();
  });

  test('Performance Rating card shows a decimal rating', async ({ page }) => {
    await expect(page.locator('text=Performance Rating')).toBeVisible();
    await expect(page.locator('text=/ 10')).toBeVisible();
  });

  // ── STATUS DISTRIBUTION CHART ─────────────────────────────────────────────

  test('Lead Status section shows all 5 status labels', async ({ page }) => {
    await expect(page.locator('h3', { hasText: 'Lead Status' })).toBeVisible();
    await expect(page.locator('text=New').first()).toBeVisible();
    await expect(page.locator('text=In Follow-up').first()).toBeVisible();
    await expect(page.locator('text=Converted').first()).toBeVisible();
    await expect(page.locator('text=Finalised').first()).toBeVisible();
    await expect(page.locator('text=Lost').first()).toBeVisible();
  });

  test('New status bar shows 505 (100%) matching total', async ({ page }) => {
    // Since all 505 leads are "New", bar should show 505
    await expect(page.locator('text=New')).toBeVisible();
    const newRow = page.locator('div').filter({ hasText: /^New\s+\d+ \(\d+%\)/ }).first();
    const text = await newRow.textContent();
    expect(text).toContain('505');
    expect(text).toContain('100%');
  });

  // ── TOP SERVICES & DESTINATIONS ──────────────────────────────────────────────

  test('Top Services section is visible', async ({ page }) => {
    await expect(page.locator('h3', { hasText: 'Top Services' })).toBeVisible();
  });

  test('Top Services shows at least one service', async ({ page }) => {
    const services = page.locator('h3').filter({ hasText: 'Top Services' }).locator('..').locator('div div');
    const count = await services.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Top Destinations section is visible', async ({ page }) => {
    await expect(page.locator('h3', { hasText: 'Top Destinations' })).toBeVisible();
  });

  test('View All Leads button navigates to leads', async ({ page }) => {
    await page.locator('text=View All Leads').click();
    await expect(page.locator('th', { hasText: 'STUDENT INFO' })).toBeVisible({ timeout: 8000 });
  });

  // ── PRIORITY TASKS & RECENT ACTIVITY ─────────────────────────────────────────

  test('Priority Tasks section is visible', async ({ page }) => {
    await expect(page.locator('text=Priority Tasks')).toBeVisible();
  });

  test('Recent Activity section is visible', async ({ page }) => {
    await expect(page.locator('text=Recent Activity')).toBeVisible();
  });

  test('View All Tasks button navigates to tasks', async ({ page }) => {
    await page.locator('text=View All Tasks').click();
    await expect(page.locator('text=My Tasks')).toBeVisible({ timeout: 8000 });
  });

  // ── EMPLOYEE STATS ───────────────────────────────────────────────────────────

  test('employee sees "Assigned to you" subtext (not global)', async ({ page }) => {
    // Even as admin, we show "Assigned to you" subtext
    await expect(page.locator('text=Assigned to you')).toBeVisible();
  });

  // ── API STATS ENDPOINT ───────────────────────────────────────────────────────

  test('/api/stats endpoint returns expected fields', async ({ request }) => {
    const response = await request.get('/api/stats?role=admin');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('statusDistribution');
    expect(data).toHaveProperty('serviceDistribution');
    expect(data).toHaveProperty('overdue');
    expect(data).toHaveProperty('dueToday');
    expect(data).toHaveProperty('finalised');
    expect(data).toHaveProperty('converted');
    expect(data).toHaveProperty('countryDistribution');
  });

  test('/api/stats total matches /api/students total', async ({ request }) => {
    const statsRes = await request.get('/api/stats?role=admin');
    const statsData = await statsRes.json();
    const studentsRes = await request.get('/api/students?page=1&limit=1');
    const studentsData = await studentsRes.json();
    expect(statsData.total).toBe(studentsData.total);
  });

  test('/api/stats statusDistribution sums to total', async ({ request }) => {
    const res = await request.get('/api/stats?role=admin');
    const data = await res.json();
    const sum = data.statusDistribution.reduce((acc: number, s: any) => acc + s.count, 0);
    expect(sum).toBe(data.total);
  });
});
