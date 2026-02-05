const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // We might need to adjust this depending on the actual app title
    await expect(page).toHaveTitle(/FoodPlanner/i);
});

test('shows login or main page', async ({ page }) => {
    await page.goto('/');
    // Basic check to see if we get a 200 OK or content renders
    // This helps verify networking between testing container and frontend
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
});
