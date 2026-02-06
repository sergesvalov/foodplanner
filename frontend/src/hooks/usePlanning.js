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

    const addMeal = (dayIndex, type, recipeId) => {
        setPlannedMeals(prev => [
            ...prev,
            { day: dayIndex, type, recipeId }
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
            const idx = prev.indexOf(mealInstance);
            if (idx === -1) return prev;

            const newArr = [...prev];
            // Update the found item in place or replace it
            newArr[idx] = { ...mealInstance, day: targetDay, type: targetType };
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
            return {
                calories: acc.calories + (recipe.calories_per_portion * portion),
                cost: acc.cost + (recipe.total_cost * portion)
            };
        }, { calories: 0, cost: 0 });
    };

    // -------------------------------------------------------------------------
    // 5. Auto Distribute Logic
    // -------------------------------------------------------------------------
    const autoDistribute = () => {
        if (plannedMeals.length > 0 && !window.confirm("Это действие перезапишет текущее расписание по дням. Продолжить?")) return;

        const newMeals = [];
        const usedSlots = new Set();
        const slotLocks = new Map();
        const memberRecipeStats = new Map();

        let consumers = [];
        if (familyMembers.length > 0) {
            // FIX: Use ALL family members from the system, ignoring the manual 'eatersCount' limiter if it was set lower.
            consumers = [...familyMembers];
        } else {
            // Only fallback to mock eaters if no family members exist
            while (consumers.length < eatersCount) {
                const id = `mock-${consumers.length + 1}`;
                consumers.push({ id: id, name: `Едок ${consumers.length + 1}`, color: 'gray' });
            }
        }

        consumers.forEach(c => memberRecipeStats.set(c.id, new Set()));

        const getNextDay = (currentDay) => (currentDay + 1) % 7;

        const mealTypes = MEAL_TYPES;

        // FIX: Sort recipes by rating (DESC) so high-rated recipes get priority for slots
        const sortedRecipes = [...visibleRecipes].sort((a, b) => (b.rating || 0) - (a.rating || 0));

        sortedRecipes.forEach(recipe => {
            let remaining = Math.round(plannedPortions[recipe.id] || getDefaultPortion(recipe));

            const validTypes = mealTypes
                .filter(mt => mt.categories.includes(recipe.category))
                .map(mt => mt.id);

            if (validTypes.length === 0) return;

            let currentDay = Math.floor(Math.random() * 7);
            let recipeAttempts = 0;

            while (remaining > 0 && recipeAttempts < 50) {
                let placedType = null;
                let foundSlot = false;
                let attempts = 0;

                while (!foundSlot && attempts < 14) {
                    const shuffledTypes = [...validTypes].sort(() => 0.5 - Math.random());

                    for (const type of shuffledTypes) {
                        const slotKey = `${currentDay}-${type}`;
                        const isExclusive = type === 'lunch' || type === 'dinner';

                        if (isExclusive) {
                            const lockedBy = slotLocks.get(slotKey);
                            if (lockedBy && lockedBy !== recipe.id) continue;
                        }

                        let freeConsumers = consumers.filter(c => !usedSlots.has(`${currentDay}-${type}-${c.id}`));
                        let desiredChunk = 0;
                        let targets = [];

                        if (type === 'breakfast') {
                            freeConsumers.sort((a, b) => {
                                const hasA = memberRecipeStats.get(a.id).has(recipe.id) ? 1 : 0;
                                const hasB = memberRecipeStats.get(b.id).has(recipe.id) ? 1 : 0;
                                if (hasA !== hasB) return hasB - hasA;
                                return 0.5 - Math.random();
                            });
                            desiredChunk = Math.min(remaining, freeConsumers.length);
                            if (desiredChunk > 0) targets = freeConsumers.slice(0, desiredChunk);

                        } else {
                            desiredChunk = Math.min(remaining, consumers.length);
                            if (freeConsumers.length >= desiredChunk) {
                                targets = freeConsumers.sort(() => 0.5 - Math.random()).slice(0, desiredChunk);
                            }
                        }

                        if (targets.length > 0) {
                            targets.forEach(consumer => {
                                usedSlots.add(`${currentDay}-${type}-${consumer.id}`);
                                memberRecipeStats.get(consumer.id).add(recipe.id);
                                newMeals.push({
                                    day: currentDay,
                                    type: type,
                                    recipeId: recipe.id,
                                    memberId: consumer.id
                                });
                            });

                            if (isExclusive) slotLocks.set(slotKey, recipe.id);
                            remaining -= targets.length;
                            placedType = type;
                            foundSlot = true;
                            break;
                        }
                    }

                    if (!foundSlot) {
                        currentDay = getNextDay(currentDay);
                        attempts++;
                    }
                }

                if (!foundSlot) break;

                if (foundSlot) {
                    if (placedType === 'breakfast') {
                        currentDay = Math.floor(Math.random() * 7);
                    } else {
                        if (remaining > 0 && remaining < consumers.length) {
                            currentDay = getNextDay(currentDay);
                        }
                    }
                }
                recipeAttempts++;
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
        getDefaultPortion,
        autoDistribute
    };
};
