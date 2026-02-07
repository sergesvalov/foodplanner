const { test, expect } = require('@playwright/test');

test.describe('Planning Page Refactor Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Go to home first
        await page.goto('/');
    });

    test('should navigate to planning page and show browse mode', async ({ page }) => {
        // Click Planning link in navbar
        await page.getByText('Планирование').click();

        // Verify URL
        await expect(page).toHaveURL(/.*planning/);

        // Check Header
        await expect(page.getByText('Планирование меню')).toBeVisible();

        // Check Categories exist (Breakfast, Lunch, Dinner, Drinks)
        await expect(page.getByText('Завтрак')).toBeVisible();
        await expect(page.getByText('Обед')).toBeVisible();
        await expect(page.getByText('Ужин')).toBeVisible();
        await expect(page.getByText('Напитки')).not.toBeVisible();

        // Check at least one "Hide" button exists (implies recipes are rendered)
        // Note: This depends on recipes existing in the backend. 
        // If no recipes, it shows "Нет рецептов".
        // We should check for either recipe cards OR "Нет рецептов" message.
        const hasRecipes = await page.locator('.group.relative').count() > 0;
        const hasEmptyMsg = await page.getByText('Нет рецептов').count() > 0;

        expect(hasRecipes || hasEmptyMsg).toBeTruthy();
    });

    test('should switch views: Browse -> Days', async ({ page }) => {
        await page.goto('/planning');

        // 1. Browse -> Days
        await expect(page.getByText('Планирование меню')).toBeVisible();
        await page.getByText('Далее к дням →').click();

        // Verify Days view
        await expect(page.getByText('По дням недели')).toBeVisible();
        await expect(page.getByText('Авто-распределение')).toBeVisible();

        // 2. Days -> Browse (Back flow)
        await page.getByText('← Назад').click(); // Back to Browse
        await expect(page.getByText('Планирование меню')).toBeVisible();
    });
});
