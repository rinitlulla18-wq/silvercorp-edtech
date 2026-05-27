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

async function goToLeads(page: Page) {
  await page.click('text=All Leads');
  await expect(page.locator('th', { hasText: 'STUDENT INFO' })).toBeVisible({ timeout: 10000 });
}

async function openFirstLead(page: Page) {
  // Click the first lead name (bold text in first data row)
  await page.locator('tbody tr').first().locator('td').first().locator('p, span, a').first().click();
  // The student page should open
  await expect(page.locator('text=Details')).toBeVisible({ timeout: 8000 });
}

test.describe('Lead Lifecycle & Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToLeads(page);
  });

  // ── TABLE INTERACTIONS ───────────────────────────────────────────────────────

  test('clicking a lead name opens the lead detail view', async ({ page }) => {
    const firstLeadName = await page.locator('tbody tr').first().locator('td').first().innerHTML();
    expect(firstLeadName).toBeTruthy();
    // Click the first lead's name
    await page.locator('tbody tr p').first().click();
    await expect(page.locator('text=Details')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Journey')).toBeVisible();
    await expect(page.locator('text=Notes')).toBeVisible();
    await expect(page.locator('text=Documents')).toBeVisible();
    await expect(page.locator('text=Tasks')).toBeVisible();
    await expect(page.locator('text=Change History')).toBeVisible();
  });

  test('lead detail view shows correct tab labels', async ({ page }) => {
    await page.locator('tbody tr p').first().click();
    // Exact tabs from StudentPage.tsx: 'Details' | 'Journey' | 'Documents' | 'Tasks' | 'Notes' | 'Important Credentials' | 'Change History'
    await expect(page.locator('button', { hasText: 'Details' })).toBeVisible({ timeout: 8000 });
    await expect(page.locator('button', { hasText: 'Journey' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Notes' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Documents' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Tasks' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Change History' })).toBeVisible();
  });

  test('clicking Notes tab shows note input', async ({ page }) => {
    await page.locator('tbody tr p').first().click();
    await page.locator('button', { hasText: 'Notes' }).click();
    // NotesTab.tsx has placeholder "Add a note..."
    await expect(page.locator('textarea[placeholder="Add a note..."]')).toBeVisible({ timeout: 5000 });
  });

  test('adding a note persists in the tab', async ({ page }) => {
    await page.locator('tbody tr p').first().click();
    await page.locator('button', { hasText: 'Notes' }).click();
    const noteText = `Test note ${Date.now()}`;
    await page.fill('textarea[placeholder="Add a note..."]', noteText);
    await page.locator('button', { hasText: 'Add Note' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(`text=${noteText}`).first()).toBeVisible();
  });

  test('clicking Tasks tab shows task input', async ({ page }) => {
    await page.locator('tbody tr p').first().click();
    await page.locator('button', { hasText: 'Tasks' }).click();
    // TasksTab.tsx has placeholder "What needs to be done?"
    await expect(page.locator('input[placeholder="What needs to be done?"]')).toBeVisible({ timeout: 5000 });
  });

  test('lead status badge visible in table row', async ({ page }) => {
    // Each row should have a status badge like "New"
    const statusBadge = page.locator('tbody tr').first().locator('span', { hasText: 'New' });
    await expect(statusBadge).toBeVisible();
  });

  test('chat icon opens chat modal for a lead', async ({ page }) => {
    // ChatHistoryModal has SVG icon button 
    await page.locator('tbody tr').first().locator('button').last().click();
    // ChatHistoryModal has placeholder "Type a new note..."
    await expect(page.locator('text=Type a new note...')).toBeVisible({ timeout: 5000 });
  });

  test('chat message input has correct placeholder', async ({ page }) => {
    await page.locator('tbody tr').first().locator('button').last().click();
    await expect(page.locator('textarea[placeholder="Type a new note..."]')).toBeVisible({ timeout: 5000 });
  });

  // ── ADD LEAD MODAL (from Header) ─────────────────────────────────────────────

  test('Add Lead button is visible in header (admin role)', async ({ page }) => {
    // Header.tsx has title="Add Lead" on the button
    await expect(page.locator('[title="Add Lead"]')).toBeVisible();
  });

  test('Add Lead modal opens on click', async ({ page }) => {
    await page.locator('[title="Add Lead"]').click();
    await expect(page.locator('text=Add New Lead')).toBeVisible({ timeout: 5000 });
  });

  test('Add Lead modal has Manual and Excel tabs', async ({ page }) => {
    await page.locator('[title="Add Lead"]').click();
    await expect(page.locator('text=Manual Entry')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Excel Import')).toBeVisible();
  });

  test('Add Lead modal closing with Escape key works', async ({ page }) => {
    await page.locator('[title="Add Lead"]').click();
    await expect(page.locator('text=Add New Lead')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(page.locator('text=Add New Lead')).not.toBeVisible();
  });

  test('creating a new lead manually appears in table', async ({ page }) => {
    const uniqueName = `AutoTest-${Date.now()}`;
    await page.locator('[title="Add Lead"]').click();
    await expect(page.locator('text=Add New Lead')).toBeVisible({ timeout: 5000 });

    // Fill in required fields. AddLeadModal.tsx: fullName, mobile, etc.
    await page.locator('input[placeholder="555 123 4567"]').fill('9988776655');
    // Fill name - it's likely a text input near "Full Name" label
    await page.locator('input').filter({ hasText: '' }).first().fill(uniqueName);
    // This approach is brittle - use getByLabel instead
    await page.getByLabel('Full Name').fill(uniqueName);
    await page.getByLabel('Mobile').fill('9988776655');
    await page.click('button', { hasText: 'Add Lead' });
    await page.waitForTimeout(1000);

    // Search for it in the table
    await page.fill('input[placeholder="Search by name, notes, service..."]', uniqueName);
    await page.waitForTimeout(800);
    await expect(page.locator(`text=${uniqueName}`).first()).toBeVisible();
  });

  // ── JOURNEY TAB ─────────────────────────────────────────────────────────────

  test('Journey tab is accessible from lead detail', async ({ page }) => {
    await page.locator('tbody tr p').first().click();
    await page.locator('button', { hasText: 'Journey' }).click();
    // JourneyFlowchart renders the journey -- check for known step labels
    await expect(page.locator('text=Loan Assistance').or(page.locator('text=Visa').or(page.locator('text=Flight')))).toBeVisible({ timeout: 8000 });
  });

  // ── SEARCH + OPEN ────────────────────────────────────────────────────────────

  test('search for Santosh Santu and open their record', async ({ page }) => {
    await page.fill('input[placeholder="Search by name, notes, service..."]', 'Santosh Santu');
    await page.waitForTimeout(800);
    await expect(page.locator('text=Santosh Santu').first()).toBeVisible();
    await page.locator('text=Santosh Santu').first().click();
    await expect(page.locator('button', { hasText: 'Details' })).toBeVisible({ timeout: 8000 });
  });

  test('student ID is visible in the first table row', async ({ page }) => {
    // Each row has a student ID like "SC26000001" or "SC1011"
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('text=/SC\\d*/')).toBeVisible();
  });

  test('lead row has phone and email action buttons', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    // Phone icon button and email icon button exist
    const buttons = firstRow.locator('button, a[href^="tel:"], a[href^="mailto:"]');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
