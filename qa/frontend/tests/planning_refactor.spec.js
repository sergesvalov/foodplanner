const { test, expect } = require('@playwright/test');

test.describe('Planning Page Refactor Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Go to home first
        await page.goto('/');
    });

    test('should navigate to planning page and show browse mode', async ({ page }) => {
        // Click Planning link in navbar
        await page.getByText('Planning').click();

        // Verify URL
        await expect(page).toHaveURL(/.*planning/);

        // Check Header
        await expect(page.getByText('Планирование меню')).toBeVisible();

        // Check Categories exist (Breakfast, Lunch, Dinner, Drinks)
        await expect(page.getByText('Завтрак')).toBeVisible();
        await expect(page.getByText('Обед')).toBeVisible();
        await expect(page.getByText('Ужин')).toBeVisible();
        await expect(page.getByText('Напитки')).toBeVisible();

        // Check at least one "Hide" button exists (implies recipes are rendered)
        // Note: This depends on recipes existing in the backend. 
        // If no recipes, it shows "Нет рецептов".
        // We should check for either recipe cards OR "Нет рецептов" message.
        const hasRecipes = await page.locator('.group.relative').count() > 0;
        const hasEmptyMsg = await page.getByText('Нет рецептов').isVisible();

        expect(hasRecipes || hasEmptyMsg).toBeTruthy();
    });

    test('should switch views: Browse -> Summary -> Days', async ({ page }) => {
        await page.goto('/planning');

        // 1. Browse -> Summary
        await page.getByText('Далее к порциям →').click();
        await expect(page.getByText('Итоговый список')).toBeVisible();
        await expect(page.getByText('← Назад')).toBeVisible();
        await expect(page.getByText('Далее к дням →')).toBeVisible();

        // 2. Summary -> Days
        await page.getByText('Далее к дням →').click();
        await expect(page.getByText('По дням недели')).toBeVisible();
        await expect(page.getByText('Авто-распределение')).toBeVisible();

        // 3. Days -> Summary -> Browse (Back flow)
        await page.getByText('← Назад').click(); // Back to Summary
        await expect(page.getByText('Итоговый список')).toBeVisible();

        await page.getByText('← Назад').click(); // Back to Browse
        await expect(page.getByText('Планирование меню')).toBeVisible();
    });
});
