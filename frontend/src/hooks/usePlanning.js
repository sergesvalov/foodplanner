import { useState, useEffect, useCallback } from 'react';
import { fetchRecipes } from '../api/recipes';
import { fetchPlan, savePlan, clearPlan } from '../api/plan';
import { fetchFamily } from '../api/admin';
import { MEAL_TYPES } from '../constants/planning';
import { calculateItemStats } from '../utils/stats';

export const usePlanning = () => {
    // -------------------------------------------------------------------------
    // 1. Data Fetching & Basic State
    // -------------------------------------------------------------------------
    const [recipes, setRecipes] = useState([]);
    const [weeklyPlan, setWeeklyPlan] = useState([]);
    const [familyMembers, setFamilyMembers] = useState([]);

    useEffect(() => {
        Promise.all([
            fetchRecipes().catch(console.error),
            fetchPlan().catch(console.error),
            fetchFamily().catch(console.error)
        ]).then(([recipesData, planData, familyData]) => {
            if (Array.isArray(recipesData)) setRecipes(recipesData);
            if (Array.isArray(planData)) setWeeklyPlan(planData);
            if (Array.isArray(familyData)) setFamilyMembers(familyData);
        });
    }, []);

    // -------------------------------------------------------------------------
    // 2. Local Storage Persisted State
    // -------------------------------------------------------------------------

    // Hidden Recipes
    const [hiddenIds, setHiddenIds] = useState(() => {
        const saved = localStorage.getItem('planning_hidden_recipes');
        return saved ? JSON.parse(saved) : [];
    });
    useEffect(() => {
        localStorage.setItem('planning_hidden_recipes', JSON.stringify(hiddenIds));
    }, [hiddenIds]);

    // Highlighted (Pinned) Recipes
    const [highlightedIds, setHighlightedIds] = useState(() => {
        const saved = localStorage.getItem('planning_highlighted_recipes');
        return saved ? JSON.parse(saved) : [];
    });
    useEffect(() => {
        localStorage.setItem('planning_highlighted_recipes', JSON.stringify(highlightedIds));
    }, [highlightedIds]);

    // Planned Portions { recipeId: number }
    const [plannedPortions, setPlannedPortions] = useState(() => {
        try {
            const saved = localStorage.getItem('planning_portions');
            const parsed = saved ? JSON.parse(saved) : {};
            return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
        } catch (e) {
            console.error('Error parsing planning_portions', e);
            return {};
        }
    });
    useEffect(() => {
        localStorage.setItem('planning_portions', JSON.stringify(plannedPortions));
    }, [plannedPortions]);

    // Eaters Count
    const [eatersCount, setEatersCount] = useState(() => {
        const saved = localStorage.getItem('planning_eaters_count');
        return saved ? parseInt(saved) : 2;
    });
    useEffect(() => {
        localStorage.setItem('planning_eaters_count', eatersCount);
    }, [eatersCount]);

    // Sync eatersCount if uninitialized
    useEffect(() => {
        if (localStorage.getItem('planning_eaters_count') === null && familyMembers.length > 0) {
            setEatersCount(familyMembers.length);
        }
    }, [familyMembers]);

    // Planned Meals
    const [plannedMeals, setPlannedMeals] = useState([]);

    // State for Next Week Start Date (to calculate target dates for API)
    const [nextMondayDate, setNextMondayDate] = useState(null);

    // Initial Load - Next Week
    const loadSharedPlan = useCallback(async () => {
        try {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const currentMonday = new Date(today);
            currentMonday.setDate(today.getDate() - diffToMon);

            const nextMonday = new Date(currentMonday);
            nextMonday.setDate(currentMonday.getDate() + 7);

            // Store valid Date object
            setNextMondayDate(nextMonday);

            const nextSunday = new Date(nextMonday);
            nextSunday.setDate(nextMonday.getDate() + 6);

            const formatDate = (d) => d.toISOString().split('T')[0];

            const data = await fetchPlan(formatDate(nextMonday), formatDate(nextSunday));

            if (Array.isArray(data)) {
                const daysMap = {
                    'Понедельник': 0, 'Вторник': 1, 'Среда': 2, 'Четверг': 3,
                    'Пятница': 4, 'Суббота': 5, 'Воскресенье': 6
                };

                const mapped = data.map(item => ({
                    id: item.id, // Keep ID for updates/deletes
                    day: daysMap[item.day_of_week],
                    // Keep type as is (lunch/dinner separate)
                    type: item.meal_type,
                    recipeId: item.recipe_id,
                    memberId: item.family_member_id,
                    portions: item.portions || 1
                })).filter(i => i.day !== undefined);

                setPlannedMeals(mapped);
            }
        } catch (e) {
            console.error("Failed to load shared plan", e);
        }
    }, []);

    useEffect(() => {
        loadSharedPlan();
    }, [loadSharedPlan]);


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

        // Map of recipe usage in the last week
        const lastWeekUsage = {};
        if (Array.isArray(lastWeekPlan)) {
            lastWeekPlan.forEach(item => {
                if (item.recipe_id) lastWeekUsage[item.recipe_id] = true;
            });
        }

        const newMeals = [];
        // Track who eats what: day -> type -> Set(memberIds)
        const consumption = {};
        for (let d = 0; d < 7; d++) {
            consumption[d] = {
                breakfast: new Set(),
                lunch: new Set(),
                dinner: new Set()
            };
        }

        let consumers = [];
        if (familyMembers.length > 0) {
            consumers = [...familyMembers];
        } else {
            while (consumers.length < eatersCount) {
                const id = `mock-${consumers.length + 1}`;
                consumers.push({ id: id, name: `Едок ${consumers.length + 1}`, color: 'gray' });
            }
        }

        // Helper shuffle
        const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        const sortedRecipes = [...visibleRecipes]
            .filter(r => r.category !== 'side');
        // Removed strict sort by rating here to allow true "From Scratch" randomness if desired.
        // Or we can Keep sort but Shuffle equal ratings.
        // Given the request "remake from scratch", we likely want variety.
        // Let's Shuffle EVERYTHING first, then maybe sort loosely?
        // Actually, if we want "New" and "Old", we handle that in logic.
        // Let's just Shuffle `sortedRecipes` to start with a random seed.

        shuffleArray(sortedRecipes);

        // Optional: still prioritize high rating?
        // If I shuffle, I lose rating priority.
        // User didn't ask to lose rating priority, but "remake from scratch" implies difference.
        // Let's shuffle, but then stable sort by rating?
        // No, let's just shuffle. If they want best rated, they'd ask. "Make a menu" usually implies variety.

        // Helper to get allowed meal types for a recipe category
        const getValidTypes = (category) => {
            if (category === 'breakfast') return ['breakfast'];
            if (category === 'soup') return ['lunch'];
            if (category === 'main') return ['lunch', 'dinner'];
            return [];
        };

        const breakfastRecipes = sortedRecipes.filter(r => r.category === 'breakfast');
        const mainRecipes = sortedRecipes.filter(r => r.category !== 'breakfast');

        // To do this correctly, we need a mutable map of remaining portions
        const remainingPortions = {};
        visibleRecipes.forEach(r => {
            remainingPortions[r.id] = Math.round(plannedPortions[r.id] || getDefaultPortion(r));
        });

        // 1. Analyze History from LAST WEEK for Breakfast Priority
        // Map<memberId, Array<{ recipeId, count }>>
        const breakfastHistory = {};
        consumers.forEach(c => { breakfastHistory[c.id] = []; });

        // Build history map from fetch result
        if (Array.isArray(lastWeekPlan)) {
            consumers.forEach(c => {
                const userHistory = {};
                lastWeekPlan
                    .filter(item => item.meal_type === 'breakfast' && String(item.family_member_id) === String(c.id))
                    .forEach(item => {
                        if (item.recipe_id) {
                            userHistory[item.recipe_id] = (userHistory[item.recipe_id] || 0) + 1;
                        }
                    });

                // Sort by frequency desc
                breakfastHistory[c.id] = Object.entries(userHistory)
                    .map(([rId, count]) => ({ recipeId: parseInt(rId), count }))
                    .sort((a, b) => b.count - a.count);
            });
        }

        // 2. Distribute Breakfasts
        consumers.forEach(consumer => {
            const history = breakfastHistory[consumer.id] || [];
            let currentDay = 0;

            // Strategy: Fill 7 days.
            // Priority 1: Use history (most frequent first)
            // Priority 2: If history exhausted (or none), use random from available

            const slotsToFill = 7;
            let filledSlots = 0;

            // Phase A: Fill from History
            for (const hItem of history) {
                const recipe = breakfastRecipes.find(r => r.id === hItem.recipeId);
                if (!recipe) continue;

                let countToAdd = hItem.count;
                // RELAXED CONSTRAINT: Allow exceeding remainingPortions to ensure we fill the plan.
                while (countToAdd > 0 && filledSlots < slotsToFill) {
                    while (currentDay < 7 && consumption[currentDay]['breakfast'].has(consumer.id)) {
                        currentDay++;
                    }
                    if (currentDay >= 7) break;

                    newMeals.push({
                        day: currentDay,
                        type: 'breakfast',
                        recipeId: recipe.id,
                        memberId: consumer.id
                    });
                    consumption[currentDay]['breakfast'].add(consumer.id);
                    remainingPortions[recipe.id]--;

                    countToAdd--;
                    filledSlots++;
                }
            }

            // Phase B: Fill remainder
            if (filledSlots < slotsToFill) {
                let recipeIdx = 0;
                let attempts = 0;

                while (filledSlots < slotsToFill && attempts < 100) {
                    attempts++;
                    currentDay = 0;
                    while (currentDay < 7 && consumption[currentDay]['breakfast'].has(consumer.id)) {
                        currentDay++;
                    }
                    if (currentDay >= 7) break;

                    // Try to find a recipe with remaining portions first
                    let recipe = null;

                    // distinct breakfast recipes
                    const brOptions = shuffleArray([...breakfastRecipes]); // Shuffle for variety in fallback
                    if (brOptions.length === 0) break;

                    // 1. Look for one with portions > 0
                    const withPortions = brOptions.find(r => remainingPortions[r.id] > 0);

                    if (withPortions) {
                        recipe = withPortions;
                    } else {
                        // 2. If none, just take next in round-robin/sorted list
                        recipe = brOptions[recipeIdx % brOptions.length];
                        recipeIdx++;
                    }

                    if (!recipe) break;

                    newMeals.push({
                        day: currentDay,
                        type: 'breakfast',
                        recipeId: recipe.id,
                        memberId: consumer.id
                    });
                    consumption[currentDay]['breakfast'].add(consumer.id);
                }
            }
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
