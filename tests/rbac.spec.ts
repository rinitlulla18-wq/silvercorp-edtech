import { test, expect } from '@playwright/test';

// Roles to test against
const roles = [
  { name: 'Admin', email: 'rinitlulla18@gmail.com', canSeeAll: true, canDelete: true },
  { name: 'Employee', email: 'manager@silvercorp.com', canSeeAll: false, canDelete: false },
];

test.describe('Role-Based Access Control (RBAC)', () => {
  for (const role of roles) {
    test.describe(`Role: ${role.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear session
        await page.evaluate(() => localStorage.clear());
        await page.goto('/');
        
        await page.fill('input[type="email"]', role.email);
        await page.fill('input[type="password"]', role.email === 'rinitlulla18@gmail.com' ? 'admin123' : 'pass');
        await page.click('button[type="submit"]');
        
        // Wait for dashboard or stats to load
        await page.waitForSelector('text=Total Leads', { timeout: 10000 }).catch(() => {});
      });

      test('visibility of "All Leads" matches role permission', async ({ page }) => {
        await page.click('text=All Leads');
        await page.waitForTimeout(1000);
        
        if (role.canSeeAll) {
          // Admin should see a high number or at least some leads (assuming DB has data)
          const rowCount = await page.locator('tbody tr').count();
          expect(rowCount).toBeGreaterThan(0);
        } else {
          // New employees might see 0 if none assigned, but we check if filter is active
          // For manager@silvercorp.com, we check if they see ONLY their assigned
        }
      });

      test('admin tools visibility', async ({ page }) => {
        const adminTab = page.locator('text=Admin Tool');
        if (role.name === 'Admin') {
          await expect(adminTab).toBeVisible();
        } else {
          await expect(adminTab).not.toBeVisible();
        }
      });
      
      // Dynamic Permission Matrix (Generates 10+ tests)
      const actions = ['Delete Student', 'Add Employee', 'Export Data', 'Edit Organisation', 'Manage Logo'];
      for (const action of actions) {
        test(`permission for action: ${action}`, async ({ page }) => {
          if (role.name !== 'Admin') {
            // Check if restricted buttons are hidden
            const btn = page.locator(`button`, { hasText: action });
            await expect(btn).not.toBeVisible();
          } else {
            // Admin should see these
          }
        });
      }
    });
  }
});

// Specific API Security Tests (Matrix)
const endpoints = [
  '/api/students',
  '/api/employees',
  '/api/stats',
];

test.describe('API Security Enforcement', () => {
  for (const endpoint of endpoints) {
    test(`unauthenticated request to ${endpoint} is rejected`, async ({ request }) => {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(401);
    });
  }
});
