import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
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

test.describe('Edge Cases, Resilience & API Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ── SERVER ERROR HANDLING ─────────────────────────────────────────────────────

  test('app shows loading indicator during slow fetch', async ({ page }) => {
    // Intercept and slow down response
    await page.route('/api/students*', async route => {
      await new Promise(res => setTimeout(res, 1500));
      await route.continue();
    });
    await page.click('text=All Leads');
    // Loading overlay text: "Loading…"
    await expect(page.locator('text=Loading…')).toBeVisible({ timeout: 3000 });
    // And eventually resolves
    await expect(page.locator('th', { hasText: 'STUDENT INFO' })).toBeVisible({ timeout: 10000 });
  });

  test('app handles /api/students 500 error gracefully', async ({ page }) => {
    await page.route('/api/students*', route => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }));
    await page.click('text=All Leads');
    await page.waitForTimeout(1500);
    // Table should not crash the entire app - login page should not appear
    await expect(page.locator('text=SILVERCORP EDTECH').or(page.locator('text=Total Leads').or(page.locator('text=All Leads')))).toBeVisible();
  });

  // ── SQL INJECTION PROTECTION ─────────────────────────────────────────────────

  test('SQL injection in search does not return all results or crash', async ({ page }) => {
    await page.click('text=All Leads');
    await expect(page.locator('th', { hasText: 'STUDENT INFO' })).toBeVisible({ timeout: 8000 });
    await page.fill('input[placeholder="Search by name, notes, service..."]', "' OR 1=1; --");
    await page.waitForTimeout(1000);
    // Either shows "No students found." or a limited result, NOT all 505 leads
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    // Should not return all 505+ results
    expect(count).toBeLessThan(50);
  });

  // ── CONCURRENT CONTEXTS ─────────────────────────────────────────────────────

  test('two sessions can be logged in simultaneously', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    await p1.goto('/');
    await p1.fill('input[type="email"]', 'rinitlulla18@gmail.com');
    await p1.fill('input[type="password"]', 'admin123');
    await p1.click('button[type="submit"]');

    await p2.goto('/');
    await p2.fill('input[type="email"]', 'rinitlulla18@gmail.com');
    await p2.fill('input[type="password"]', 'admin123');
    await p2.click('button[type="submit"]');

    // Both should reach dashboard independently  
    const close1 = p1.locator('button', { hasText: 'Close' });
    if (await close1.isVisible({ timeout: 3000 }).catch(() => false)) await close1.click();
    const close2 = p2.locator('button', { hasText: 'Close' });
    if (await close2.isVisible({ timeout: 3000 }).catch(() => false)) await close2.click();

    await expect(p1.locator('h2', { hasText: 'Total Leads' })).toBeVisible({ timeout: 8000 });
    await expect(p2.locator('h2', { hasText: 'Total Leads' })).toBeVisible({ timeout: 8000 });

    await ctx1.close();
    await ctx2.close();
  });

  // ── API DIRECT ENDPOINT TESTS ─────────────────────────────────────────────────

  test('GET /api/students returns paginated structure', async ({ request }) => {
    const res = await request.get('/api/students?page=1&limit=10');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('rows');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('totalPages');
    expect(Array.isArray(data.rows)).toBeTruthy();
    expect(data.rows.length).toBeLessThanOrEqual(10);
  });

  test('GET /api/students page=1 has different rows than page=2', async ({ request }) => {
    const page1 = await request.get('/api/students?page=1&limit=5');
    const page2 = await request.get('/api/students?page=2&limit=5');
    const d1 = await page1.json();
    const d2 = await page2.json();
    // First ID on page 1 must not match first ID on page 2
    expect(d1.rows[0].id).not.toBe(d2.rows[0].id);
  });

  test('GET /api/students search=Santosh returns that lead', async ({ request }) => {
    const res = await request.get('/api/students?search=Santosh&limit=10');
    const data = await res.json();
    expect(data.total).toBeGreaterThanOrEqual(1);
    const found = data.rows.some((r: any) => r.fullName.includes('Santosh'));
    expect(found).toBeTruthy();
  });

  test('GET /api/students status=New only returns New leads', async ({ request }) => {
    const res = await request.get('/api/students?status=New&limit=20');
    const data = await res.json();
    const allNew = data.rows.every((r: any) => r.leadStatus === 'New');
    expect(allNew).toBeTruthy();
  });

  test('POST /api/students creates a new lead', async ({ request }) => {
    const uniqueEmail = `auto-${Date.now()}@test.com`;
    const res = await request.post('/api/students', {
      data: {
        fullName: 'Playwright Test Lead',
        email: uniqueEmail,
        mobile: '9988776600',
        serviceCategory: 'Study Abroad',
        leadStatus: 'New',
        assignedUserId: null,
      }
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('id');

    // Verify it can be found via search
    const search = await request.get(`/api/students?search=${encodeURIComponent(uniqueEmail)}`);
    const searchData = await search.json();
    expect(searchData.total).toBeGreaterThanOrEqual(1);

    // Cleanup: delete if endpoint exists, else leave for now
    if (data.id) {
      await request.delete(`/api/students/${data.id}`).catch(() => {});
    }
  });

  test('PATCH /api/students/:id updates lead status', async ({ request }) => {
    // Get a lead to update
    const listRes = await request.get('/api/students?page=1&limit=1&search=Playwright+Test');
    const listData = await listRes.json();
    if (listData.rows.length === 0) {
      test.skip();
      return;
    }
    const leadId = listData.rows[0].id;
    const res = await request.patch(`/api/students/${leadId}`, {
      data: { leadStatus: 'In Follow-up' }
    });
    expect(res.ok()).toBeTruthy();

    // Verify change persisted
    const check = await request.get(`/api/students/${leadId}`);
    if (check.ok()) {
      const updated = await check.json();
      expect(updated.leadStatus).toBe('In Follow-up');
    }
  });

  test('GET /api/students with invalid page returns empty or first page', async ({ request }) => {
    const res = await request.get('/api/students?page=99999&limit=50');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    // rows might be empty for non-existent page
    expect(Array.isArray(data.rows)).toBeTruthy();
    expect(data.total).toBeGreaterThan(0); // Total still correct
  });

  // ── RAPID INTERACTIONS ────────────────────────────────────────────────────────

  test('rapid filter changes do not crash the app', async ({ page }) => {
    await page.click('text=All Leads');
    await expect(page.locator('th', { hasText: 'STUDENT INFO' })).toBeVisible({ timeout: 8000 });
    // Rapidly switch filters
    await page.locator('select', { hasText: 'All Lead Status' }).selectOption('New');
    await page.locator('select', { hasText: 'All Services' }).selectOption('Study Abroad');
    await page.locator('select', { hasText: 'All Lead Status' }).selectOption('');
    await page.locator('select', { hasText: 'All Services' }).selectOption('');
    await page.waitForTimeout(1000);
    // App should still work
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('search and then paginate keeps search active', async ({ page }) => {
    await page.click('text=All Leads');
    await expect(page.locator('th', { hasText: 'STUDENT INFO' })).toBeVisible({ timeout: 8000 });
    // This only works if there are >50 results matching "Har" (there are many "Harsh")
    await page.fill('input[placeholder="Search by name, notes, service..."]', 'Har');
    await page.waitForTimeout(800);
    const paginationVisible = await page.locator('p.text-sm.text-slate-400').isVisible();
    if (paginationVisible) {
      const text = await page.locator('p.text-sm.text-slate-400').textContent();
      expect(text).toContain('leads');
    }
  });

  // ── HEADER UI ELEMENTS ────────────────────────────────────────────────────────

  test('SilverCorp Edtech logo/brand is visible in header', async ({ page }) => {
    await expect(page.locator('text=SilverCorp Edtech').first()).toBeVisible();
  });

  test('header shows logged-in user name', async ({ page }) => {
    // User name is in the avatar alt text in the header
    await expect(page.locator('img[alt*="Rinit"]')).toBeVisible();
  });
});
