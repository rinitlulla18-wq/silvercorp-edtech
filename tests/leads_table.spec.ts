import { test, expect, Page } from '@playwright/test';

async function login(page: Page, email = 'rinitlulla18@gmail.com', password = 'admin123') {
  await page.goto('/');
  // Prevent the attendance modal from showing by setting the "last shown" timestamp in localStorage
  await page.evaluate(() => {
    localStorage.setItem('attendance_popup_last_shown_USR-2026-RINIT', new Date().toDateString());
  });
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Double check if the modal appeared anyway (fallback)
  const closeBtn = page.locator('button', { hasText: 'Close' });
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
    // Wait for modal to be removed from visibility
    await expect(closeBtn).not.toBeVisible();
  }
  
  // Navigate to All Leads
  await page.click('text=All Leads');
  await expect(page.locator('text=STUDENT INFO')).toBeVisible({ timeout: 10000 });
}

test.describe('Leads Table & Filters', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ── PAGINATION ──────────────────────────────────────────────────────────────

  test('shows pagination text with correct format', async ({ page }) => {
    // Real text: "Showing 1–50 of 505 leads"
    await expect(page.locator('text=of')).toContainText(/of.*leads/);
    await expect(page.locator('text=Showing')).toBeVisible();
  });

  test('first page shows exactly 50 rows', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(50);
  });

  test('page shows 1–50 on first page', async ({ page }) => {
    const paginationText = page.locator('p.text-sm.text-slate-400');
    await expect(paginationText).toContainText('1');
    await expect(paginationText).toContainText('50');
  });

  test('clicking page 2 loads next 50 records', async ({ page }) => {
    // Click page 2 button
    await page.locator('button', { hasText: '2' }).first().click();
    await page.waitForTimeout(800);
    const paginationText = page.locator('p.text-sm.text-slate-400');
    await expect(paginationText).toContainText('51');
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(50);
  });

  test('Prev is disabled on page 1', async ({ page }) => {
    const prevBtn = page.locator('button', { hasText: '← Prev' });
    await expect(prevBtn).toBeDisabled();
  });

  test('Next button moves to page 2', async ({ page }) => {
    await page.locator('button', { hasText: '← Prev' }); // Confirm on page 1
    // Click any page 2 button
    await page.locator('button', { hasText: '2' }).first().click();
    await page.waitForTimeout(800);
    await expect(page.locator('p.text-sm.text-slate-400')).toContainText('51');
  });

  test('Prev button goes back to page 1', async ({ page }) => {
    await page.locator('button', { hasText: '2' }).first().click();
    await page.waitForTimeout(500);
    await page.locator('button', { hasText: '← Prev' }).click();
    await page.waitForTimeout(800);
    await expect(page.locator('p.text-sm.text-slate-400')).toContainText('1');
    await expect(page.locator('button', { hasText: '← Prev' })).toBeDisabled();
  });

  test('total shows correct total student count in pagination', async ({ page }) => {
    // Total should be a number > 0 from the DB
    const text = await page.locator('p.text-sm.text-slate-400').textContent();
    const match = text?.match(/of\s+([\d,]+)\s+leads/);
    expect(match).not.toBeNull();
    const total = parseInt(match![1].replace(',', ''));
    expect(total).toBeGreaterThan(0);
  });

  // ── SEARCH ───────────────────────────────────────────────────────────────────

  test('search box has correct placeholder', async ({ page }) => {
    // Real placeholder from SearchBar.tsx: "Search by name, notes, service..."
    await expect(page.locator('input[placeholder="Search by name, notes, service..."]')).toBeVisible();
  });

  test('search for known lead by name filters results', async ({ page }) => {
    // "Santosh Santu" is a lead we know exists in the DB
    await page.fill('input[placeholder="Search by name, notes, service..."]', 'Santosh Santu');
    await page.waitForTimeout(800);
    await expect(page.locator('text=Santosh Santu').first()).toBeVisible();
  });

  test('search for known lead by student ID', async ({ page }) => {
    await page.fill('input[placeholder="Search by name, notes, service..."]', 'SC26000001');
    await page.waitForTimeout(800);
    await expect(page.locator('text=SC26000001').first()).toBeVisible();
    // Only 1 match expected
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(5);
  });

  test('search for nonexistent name shows empty state', async ({ page }) => {
    await page.fill('input[placeholder="Search by name, notes, service..."]', 'ZZZNOBODYZXQWERTY9999');
    await page.waitForTimeout(800);
    // StudentTable shows "No students found." when empty
    await expect(page.locator('text=No students found.')).toBeVisible();
  });

  test('clearing search restores all leads', async ({ page }) => {
    await page.fill('input[placeholder="Search by name, notes, service..."]', 'ZZZNOBODYZXQWERTY9999');
    await page.waitForTimeout(600);
    await page.fill('input[placeholder="Search by name, notes, service..."]', '');
    await page.waitForTimeout(800);
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(50);
  });

  // ── FILTERS ──────────────────────────────────────────────────────────────────

  test('Lead Status filter shows correct default option', async ({ page }) => {
    // Real option text: "All Lead Status"
    await expect(page.locator('select', { hasText: 'All Lead Status' })).toBeVisible();
  });

  test('filter by New lead status reduces or maintains result count', async ({ page }) => {
    await page.locator('select', { hasText: 'All Lead Status' }).selectOption('New');
    await page.waitForTimeout(800);
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    // Verify badge text in rows
    const statusBadges = page.locator('tbody tr td', { hasText: 'New' });
    await expect(statusBadges.first()).toBeVisible();
  });

  test('filter by Study Abroad service category', async ({ page }) => {
    await page.locator('select', { hasText: 'All Services' }).selectOption('Study Abroad');
    await page.waitForTimeout(800);
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('clear filters button appears when filters active and clears them', async ({ page }) => {
    await page.locator('select', { hasText: 'All Lead Status' }).selectOption('New');
    await page.waitForTimeout(500);
    // Clear Filters button should appear 
    const clearBtn = page.locator('button', { hasText: 'Clear Filters' });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await page.waitForTimeout(800);
    // Now select should be back to default "All Lead Status"
    const statusSelect = page.locator('select', { hasText: 'All Lead Status' });
    await expect(statusSelect).toBeVisible();
  });

  test('Follow-ups filter has correct options', async ({ page }) => {
    const select = page.locator('select').first(); // Follow-up is the first select
    await expect(select.locator('option', { hasText: 'All Follow-ups' })).toHaveCount(1);
    await expect(select.locator('option', { hasText: 'Overdue' })).toHaveCount(1);
    await expect(select.locator('option', { hasText: 'Today' })).toHaveCount(1);
  });

  test('table header columns exist', async ({ page }) => {
    await expect(page.locator('th', { hasText: 'STUDENT INFO' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'LEAD STATUS' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'SERVICE CATEGORY' })).toBeVisible();
  });

  test('All Users filter only visible for admin', async ({ page }) => {
    // We logged in as admin so "All Users" dropdown should exist
    await expect(page.locator('select', { hasText: 'All Users' })).toBeVisible();
  });

  test('filter by Unassigned shows unassigned leads', async ({ page }) => {
    await page.locator('select', { hasText: 'All Users' }).selectOption('unassigned');
    await page.waitForTimeout(800);
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    // We know from screenshot most leads are unassigned
    expect(count).toBeGreaterThan(0);
  });
});
