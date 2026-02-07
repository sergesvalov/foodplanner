import { useState, useEffect, useCallback } from 'react';
import { fetchRecipes } from '../api/recipes';
import { fetchPlan } from '../api/plan';
import { fetchFamily } from '../api/admin';
import { MEAL_TYPES } from '../constants/planning';

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
    const [plannedMeals, setPlannedMeals] = useState(() => {
        try {
            const saved = localStorage.getItem('planning_meals');
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error parsing planning_meals', e);
            return [];
        }
    });
    useEffect(() => {
        localStorage.setItem('planning_meals', JSON.stringify(plannedMeals));
    }, [plannedMeals]);


    // -------------------------------------------------------------------------
    // 3. Actions / Handlers
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

    const addMeal = (dayIndex, type, recipeId, memberId = undefined) => {
        setPlannedMeals(prev => [
            ...prev,
            { day: dayIndex, type, recipeId, memberId }
        ]);
    };

    const removeMeal = (dayIndex, type, recipeId) => {
        setPlannedMeals(prev => prev.filter(m =>
            !(m.day === dayIndex && m.type === type && m.recipeId === recipeId)
        ));
    };

    const removeMealByInstance = (instance) => {
        setPlannedMeals(prev => {
            const idx = prev.indexOf(instance);
            if (idx === -1) return prev;
            return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        });
    };

    const moveMeal = (mealInstance, targetDay, targetType) => {
        setPlannedMeals(prev => {
            // Find by matching properties since mealInstance is a copy from DnD event
            const idx = prev.findIndex(pm =>
                pm.day === mealInstance.day &&
                pm.type === mealInstance.type &&
                pm.recipeId === mealInstance.recipeId &&
                pm.memberId === mealInstance.memberId
            );

            if (idx === -1) return prev;

            const newArr = [...prev];
            // Update the found item in place
            newArr[idx] = { ...newArr[idx], day: targetDay, type: targetType };
            return newArr;
        });
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

    // Stats Helper
    const getTotalStats = (categoryRecipes) => {
        return categoryRecipes.reduce((acc, recipe) => {
            const portion = plannedPortions[recipe.id] || getDefaultPortion(recipe);
            // FIX: recipe.total_cost is for the WHOLE BATCH (recipe.portions).
            // We need cost per portion * planned portions.
            const costPerPortion = recipe.portions > 0 ? (recipe.total_cost / recipe.portions) : 0;

            return {
                calories: acc.calories + (recipe.calories_per_portion * portion),
                cost: acc.cost + (costPerPortion * portion)
            };
        }, { calories: 0, cost: 0 });
    };

    const getScheduledStats = (meals = plannedMeals) => {
        return meals.reduce((acc, meal) => {
            const recipe = recipes.find(r => r.id === meal.recipeId);
            if (!recipe) return acc;

            // One meal instance = One portion
            const costPerPortion = recipe.portions > 0 ? (recipe.total_cost / recipe.portions) : 0;

            return {
                calories: acc.calories + recipe.calories_per_portion,
                cost: acc.cost + costPerPortion
            };
        }, { calories: 0, cost: 0 });
    };

    // -------------------------------------------------------------------------
    // 5. Auto Distribute Logic
    // -------------------------------------------------------------------------
    const autoDistribute = () => {
        if (plannedMeals.length > 0 && !window.confirm("Это действие перезапишет текущее расписание по дням. Продолжить?")) return;

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

        const sortedRecipes = [...visibleRecipes]
            .filter(r => r.category !== 'side')
            .sort((a, b) => (b.rating || 0) - (a.rating || 0));

        // Helper to get allowed meal types for a recipe category
        const getValidTypes = (category) => {
            if (category === 'breakfast') return ['breakfast'];
            if (category === 'soup') return ['lunch'];
            if (category === 'main') return ['lunch', 'dinner'];
            return [];
        };

        // 1. Analyze Breakfast History from current plan (before clearing)
        // Map<memberId, Array<{ recipeId, count }>> sorted by count DESC
        const breakfastHistory = {};
        consumers.forEach(c => {
            const history = {};
            plannedMeals
                .filter(pm => pm.memberId === c.id && pm.type === 'breakfast')
                .forEach(pm => {
                    history[pm.recipeId] = (history[pm.recipeId] || 0) + 1;
                });

            breakfastHistory[c.id] = Object.entries(history)
                .map(([rId, count]) => ({ recipeId: parseInt(rId), count }))
                .sort((a, b) => b.count - a.count);
        });

        // Separate recipes
        const breakfastRecipes = sortedRecipes.filter(r => r.category === 'breakfast');
        const mainRecipes = sortedRecipes.filter(r => r.category !== 'breakfast');

        // To do this correctly, we need a mutable map of remaining portions
        const remainingPortions = {};
        visibleRecipes.forEach(r => {
            remainingPortions[r.id] = Math.round(plannedPortions[r.id] || getDefaultPortion(r));
        });

        // 2. Distribute Breakfasts based on History
        // Iterate consumers first, then their favorite recipes
        consumers.forEach(consumer => {
            const history = breakfastHistory[consumer.id] || [];

            // Fill days sequentially for this consumer
            // We need to find empty breakfast slots for this consumer
            // Slots: 0..6
            // We fill them in order: Mon, Tue, ...

            let currentDay = 0;

            history.forEach(item => {
                const recipeId = item.recipeId;
                const recipe = breakfastRecipes.find(r => r.id === recipeId);

                if (!recipe || remainingPortions[recipeId] <= 0) return;

                // How many to take? Min(historyCount, remaining)
                // And also limited by available days?
                // The prompt says "in the same amount as it was".

                const targetCount = item.count;
                let taken = 0;

                while (taken < targetCount && remainingPortions[recipeId] > 0) {
                    // Find next empty breakfast slot for this consumer
                    while (currentDay < 7 && consumption[currentDay]['breakfast'].has(consumer.id)) {
                        currentDay++;
                    }

                    if (currentDay >= 7) break; // No more slots for this consumer

                    // Assign
                    newMeals.push({ day: currentDay, type: 'breakfast', recipeId: recipeId, memberId: consumer.id });
                    consumption[currentDay]['breakfast'].add(consumer.id);
                    remainingPortions[recipeId]--;
                    taken++;
                }
            });
        });

        // 3. Distribute Lunch/Dinner (Main/Soup)
        mainRecipes.forEach(recipe => {
            let remaining = remainingPortions[recipe.id];
            const validTypes = getValidTypes(recipe.category);
            if (validTypes.length === 0 || remaining <= 0) return;

            // Sequential Timeline Approach
            // 1. Build Timeline of valid slots for 7 days
            const timeline = [];
            for (let d = 0; d < 7; d++) {
                // Order: Lunch -> Dinner (matches requirement: "if dinner full, go to next lunch")
                if (validTypes.includes('lunch')) timeline.push({ d, t: 'lunch' });
                if (validTypes.includes('dinner')) timeline.push({ d, t: 'dinner' });
            }

            if (timeline.length === 0) return;

            // 2. Start from Monday Lunch (or first available 'lunch'/'dinner' in the week)
            let idx = 0;

            // 3. Fill Sequentially
            let loopCount = 0;
            // Allow up to 2 full loops to find spots
            while (remaining > 0 && loopCount < timeline.length * 2) {
                const slot = timeline[idx];

                const eaten = consumption[slot.d][slot.t];
                // Find consumers who haven't eaten this meal type on this day
                const candidates = consumers.filter(c => !eaten.has(c.id));

                if (candidates.length > 0) {
                    // Saturated the slot: give to all candidates up to remaining portions
                    const takeCount = Math.min(remaining, candidates.length);
                    // For main meals, usually fill sequentially/stable
                    const targets = candidates.slice(0, takeCount);

                    targets.forEach(c => {
                        newMeals.push({ day: slot.d, type: slot.t, recipeId: recipe.id, memberId: c.id });
                        eaten.add(c.id);
                    });
                    remaining -= takeCount;
                }

                // Move to next slot in timeline (wrap around)
                idx = (idx + 1) % timeline.length;
                loopCount++;
            }
        });

        setPlannedMeals(newMeals);
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
        removeMeal,
        addMeal,
        removeMeal,
        removeMealByInstance,
        moveMeal,
        getRecipesByCategories,
        getTotalStats,
        getScheduledStats,
        getDefaultPortion,
        autoDistribute
    };
};
