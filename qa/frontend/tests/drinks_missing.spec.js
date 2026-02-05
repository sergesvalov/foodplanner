const { test, expect } = require('@playwright/test');

test('Weekly plan should show Drinks category', async ({ page }) => {
    // Navigate to the planning page
    await page.goto('/planning'); // Assuming /planning is the route, checking codebase next if unsure

    // Wait for the plan to load
    await page.waitForLoadState('networkidle');

    // Check for the presence of "Напитки" or "Drinks" header
    // Using a flexible locator that looks for the text
    const drinksHeader = page.getByText(/Напитки|Drinks/i);

    await expect(drinksHeader).toBeVisible({ timeout: 5000 });
});
