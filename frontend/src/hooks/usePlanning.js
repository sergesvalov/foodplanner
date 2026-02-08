import { useCallback } from 'react';
import { fetchPlan, savePlan, clearPlan } from '../api/plan';
import { calculateItemStats } from '../utils/stats';
import { calculateDistributedMeals } from '../utils/planningLogic';
import { usePlanningState } from './usePlanningState';

export const usePlanning = () => {
    // -------------------------------------------------------------------------
    // 1. Data Fetching & State (via usePlanningState)
    // -------------------------------------------------------------------------
    const {
        recipes,
        weeklyPlan,
        familyMembers,
        hiddenIds,
        setHiddenIds,
        highlightedIds,
        setHighlightedIds,
        plannedPortions,
        setPlannedPortions,
        eatersCount,
        plannedMeals,
        setPlannedMeals,
        nextMondayDate,
        loadSharedPlan
    } = usePlanningState();

    // -------------------------------------------------------------------------
    // 3. Actions / Handlers (AUTO-SAVE)
    // -------------------------------------------------------------------------

    const updatePortion = (id, change) => {
        setPlannedPortions(prev => {
            let current = prev[id];
            if (current === undefined) {
                const recipe = recipes.find(r => r.id === id);
                current = recipe ? (recipe.portions || 1) : 1;
            }
            const newVal = Math.max(0.5, current + change);
            return { ...prev, [id]: newVal };
        });
    };

    const toggleHighlight = (e, id) => {
        if (e) e.stopPropagation();
        setHighlightedIds(prev =>
            prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]
        );
    };

    const hideRecipe = (e, id) => {
        if (e) e.stopPropagation();
        if (!window.confirm("Скрыть рецепт из планирования?")) return;
        setHiddenIds(prev => [...prev, id]);
    };

    const restoreAll = () => {
        if (!window.confirm("Показать все скрытые рецепты?")) return;
        setHiddenIds([]);
    };

    // Helper: Calculate date for day index (0-Mon ... 6-Sun) based on Next Week
    const getDateForDayIndex = (dayIndex) => {
        if (!nextMondayDate) return null;
        const targetDate = new Date(nextMondayDate);
        targetDate.setDate(nextMondayDate.getDate() + dayIndex);
        return targetDate.toISOString().split('T')[0];
    };

    const WEEK_DAYS_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

    const addMeal = async (dayIndex, type, recipeId, memberId = undefined) => {
        if (!nextMondayDate) return;

        try {
            const dateStr = getDateForDayIndex(dayIndex);
            const r = recipes.find(x => x.id === recipeId);
            const portions = plannedPortions[recipeId] || (r ? (r.portions || 1) : 1);

            // Handle Mock IDs: valid IDs are integers. If string start with 'mock-', send null
            let finalMemberId = memberId;
            if (typeof memberId === 'string' && memberId.startsWith('mock-')) {
                finalMemberId = null;
            }

            const payload = {
                day_of_week: WEEK_DAYS_NAMES[dayIndex],
                meal_type: type,
                recipe_id: recipeId,
                family_member_id: finalMemberId,
                portions: portions,
                date: dateStr
            };


            // Call API directly (Auto-Save)
            const res = await fetch('/api/plan/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Reload plan to sync ID
                loadSharedPlan();
            } else {
                console.error("Failed to add meal:", await res.text());
                alert("Ошибка сохранения! Попробуйте обновить страницу.");
            }
        } catch (e) {
            console.error(e);
            alert("Ошибка сети при сохранении.");
        }
    };

    const updateMealMember = async (instance, newMemberId) => {
        if (!instance.id) return; // Cannot update unsaved (should not happen with auto-save)

        try {
            const res = await fetch(`/api/plan/${instance.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ family_member_id: newMemberId })
            });
            if (res.ok) {
                // Optimistic local update or Reload
                setPlannedMeals(prev => prev.map(m => m.id === instance.id ? { ...m, memberId: newMemberId } : m));
            }
        } catch (e) { console.error(e); }
    };

    const removeMeal = async (dayIndex, type, recipeId) => {
        // Fallback remove by properties if ID missing (should rarely happen now)
        // Find instance
        const instance = plannedMeals.find(m => m.day === dayIndex && m.type === type && m.recipeId === recipeId);
        if (instance && instance.id) {
            await removeMealByInstance(instance);
        } else {
            // Optimistic fallback removal (legacy mode)
            setPlannedMeals(prev => prev.filter(m =>
                !(m.day === dayIndex && m.type === type && m.recipeId === recipeId)
            ));
        }
    };

    const removeMealByInstance = async (instance) => {
        if (!instance.id) return;
        try {
            const res = await fetch(`/api/plan/${instance.id}`, { method: 'DELETE' });
            if (res.ok) {
                setPlannedMeals(prev => prev.filter(m => m.id !== instance.id));
            }
        } catch (e) { console.error(e); }
    };

    const moveMeal = async (mealInstance, targetDay, targetType) => {
        if (!nextMondayDate || !mealInstance.id) return;

        try {
            const targetDateStr = getDateForDayIndex(targetDay);
            const payload = {
                day_of_week: WEEK_DAYS_NAMES[targetDay],
                date: targetDateStr,
                meal_type: targetType
            };

            const res = await fetch(`/api/plan/${mealInstance.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                loadSharedPlan(); // Sync fully to catch any date shifts
            }
        } catch (e) { console.error(e); }
    };


    // -------------------------------------------------------------------------
    // 4. Derived Logic (Helpers)
    // -------------------------------------------------------------------------

    const getDefaultPortion = (recipe) => recipe.portions || 1;

    const visibleRecipes = recipes.filter(r => !hiddenIds.includes(r.id));

    // Sort/Filter Helper
    const getRecipesByCategories = useCallback((categories, sectionTitle, sourceList) => {
        return sourceList
            .filter(r => categories.includes(r.category))
            .sort((a, b) => {
                const aPinned = highlightedIds.includes(a.id);
                const bPinned = highlightedIds.includes(b.id);
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;

                if (sectionTitle === 'Завтрак') {
                    const ratingDiff = (b.rating || 0) - (a.rating || 0);
                    if (ratingDiff !== 0) return ratingDiff;

                    const aUsed = weeklyPlan.some(p => p.recipe_id === a.id && p.meal_type === 'breakfast');
                    const bUsed = weeklyPlan.some(p => p.recipe_id === b.id && p.meal_type === 'breakfast');
                    if (aUsed && !bUsed) return -1;
                    if (!bUsed && aUsed) return 1;
                }

                return (b.rating || 0) - (a.rating || 0);
            });
    }, [highlightedIds, weeklyPlan]);

    // Stats Helper - REFACTORED to use utils
    // Import at top level really, but here for clarity of replacement block.
    // NOTE: Requires import { calculateItemStats } from '../utils/stats'; at top of file. 

    const getTotalStats = (categoryRecipes) => {
        return categoryRecipes.reduce((acc, recipe) => {
            const portion = plannedPortions[recipe.id] || getDefaultPortion(recipe);
            // Construct a "fake" plan item to use utility
            const item = { recipe, portions: portion };
            const s = calculateItemStats(item);

            return {
                calories: acc.calories + s.cals,
                cost: acc.cost + s.cost
            };
        }, { calories: 0, cost: 0 });
    };

    const getScheduledStats = (meals = plannedMeals) => {
        return meals.reduce((acc, meal) => {
            const recipe = recipes.find(r => r.id === meal.recipeId);
            if (!recipe) return acc;

            const item = { recipe, portions: meal.portions || 1 };
            const s = calculateItemStats(item);

            return {
                calories: acc.calories + s.cals,
                cost: acc.cost + s.cost
            };
        }, { calories: 0, cost: 0 });
    };

    // -------------------------------------------------------------------------
    // 5. Auto Distribute Logic
    // -------------------------------------------------------------------------
    const autoDistribute = async () => {
        if (plannedMeals.length > 0 && !window.confirm("Это действие перезапишет текущее расписание по дням. Продолжить?")) return;

        // Calculate Last Week Range
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0(Sun)..6(Sat) in JS
        // We want Monday of current week as baseline.
        // If today is Sunday (0), Monday was 6 days ago. If Monday (1), 0 days ago.
        // BUT wait, standard week starts Monday.
        // JS getDay(): Sun=0, Mon=1, ..., Sat=6.
        // Monday offset:
        const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() - diffToMon);

        const lastMonday = new Date(currentMonday);
        lastMonday.setDate(currentMonday.getDate() - 7);
        const lastSunday = new Date(currentMonday);
        lastSunday.setDate(currentMonday.getDate() - 1);

        const formatDate = (d) => d.toISOString().split('T')[0];

        let lastWeekPlan = [];
        try {
            lastWeekPlan = await fetchPlan(formatDate(lastMonday), formatDate(lastSunday));
        } catch (e) {
            console.error("Failed to fetch last week history", e);
            // Non-blocking error, just proceed with empty history
        }

        // Calculate Auto Distribution using Utility
        const newMeals = calculateDistributedMeals({
            recipes,
            familyMembers,
            eatersCount,
            plannedPortions,
            visibleRecipes,
            lastWeekPlan,
            getDefaultPortion
        });

        // Save to Backend using Batch API
        const batchPayload = newMeals.map(m => {
            const dateStr = getDateForDayIndex(m.day);
            const r = recipes.find(r => r.id === m.recipeId);
            const portions = r ? (r.portions || 1) : 1;

            // Handle Mock IDs
            let finalMemberId = m.memberId;
            if (typeof m.memberId === 'string' && m.memberId.startsWith('mock-')) {
                finalMemberId = null;
            }

            return {
                day_of_week: WEEK_DAYS_NAMES[m.day],
                meal_type: m.type,
                recipe_id: m.recipeId,
                portions: portions,
                family_member_id: finalMemberId,
                date: dateStr
            };
        });


        try {
            const res = await fetch('/api/plan/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchPayload)
            });
            if (res.ok) {
                loadSharedPlan();
            } else {
                console.error("Batch save failed");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const savePlanToNextWeek = async () => {
        if (!window.confirm("Сохранить текущий план на СЛЕДУЮЩУЮ неделю? Это перезапишет существующий план на ту неделю.")) return;

        // Target Week Dates
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0-6
        const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() - diffToMon);

        const nextMonday = new Date(currentMonday);
        nextMonday.setDate(currentMonday.getDate() + 7);
        const nextSunday = new Date(nextMonday);
        nextSunday.setDate(nextMonday.getDate() + 6);

        const formatDate = (d) => d.toISOString().split('T')[0];
        const startDateStr = formatDate(nextMonday);
        const endDateStr = formatDate(nextSunday);

        try {
            // 1. Prepare items to save
            const itemsToSave = plannedMeals.map(pm => {
                const mealDate = new Date(nextMonday);
                mealDate.setDate(nextMonday.getDate() + pm.day); // pm.day is 0-6
                const portions = pm.portions || 1;

                // Allow Mocks to be saved as unassigned (null)
                let finalMemberId = pm.memberId;
                if (typeof pm.memberId === 'string' && pm.memberId.startsWith('mock-')) {
                    finalMemberId = null;
                }

                return {
                    day_of_week: WEEK_DAYS_NAMES[pm.day],
                    meal_type: pm.type,
                    recipe_id: pm.recipeId,
                    portions: portions,
                    family_member_id: finalMemberId,
                    date: formatDate(mealDate)
                };
            });

            if (itemsToSave.length === 0) {
                alert("План пуст, нечего сохранять.");
                return;
            }

            // 2. Backup existing plan (Safety)
            // We fetch the plan for next week first.
            let backupPlan = [];
            try {
                backupPlan = await fetchPlan(startDateStr, endDateStr);
            } catch (e) {
                console.warn("Could not fetch backup plan", e);
                // Decide if we proceed. Yes, but warn? No, proceed.
            }

            // 3. Clear target week
            await clearPlan(startDateStr, endDateStr);

            // 4. Save new items
            // We trust savePlan fails if something is wrong.
            try {
                await savePlan(itemsToSave);
                alert("✅ План успешно сохранен на следующую неделю!");
            } catch (saveError) {
                console.error("Save failed, attempting restore...", saveError);
                // 5. Restore backup if save failed
                if (backupPlan.length > 0) {
                    try {
                        const restoreItems = backupPlan.map(item => ({
                            day_of_week: item.day_of_week,
                            meal_type: item.meal_type,
                            recipe_id: item.recipe_id,
                            portions: item.portions,
                            family_member_id: item.family_member_id,
                            date: item.date
                        }));
                        await savePlan(restoreItems);
                        alert("❌ Ошибка сохранения! Старый план был восстановлен. Детали: " + saveError.message);
                    } catch (restoreError) {
                        alert("CRITICAL: Ошибка сохранения и НЕ удалось восстановить старый план! Данные могут быть потеряны.");
                    }
                } else {
                    alert("❌ Ошибка сохранения! (Резервная копия была пуста): " + saveError.message);
                }
            }

        } catch (error) {
            console.error(error);
            alert("❌ Ошибка инициализации сохранения: " + error.message);
        }
    };

    return {
        recipes,
        visibleRecipes,
        hiddenIds,
        highlightedIds,
        plannedPortions,
        eatersCount,
        familyMembers,
        plannedMeals,
        updatePortion,
        toggleHighlight,
        hideRecipe,
        restoreAll,
        addMeal,
        updateMealMember,
        removeMeal,
        removeMealByInstance,
        moveMeal,
        getRecipesByCategories,
        getTotalStats,
        getScheduledStats,
        getDefaultPortion,
        autoDistribute,
        savePlanToNextWeek
    };
};
