import { useState, useEffect, useCallback } from 'react';
import { fetchRecipes } from '../api/recipes';
import { fetchPlan, savePlan, clearPlan } from '../api/plan';
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
    const [plannedMeals, setPlannedMeals] = useState([]);

    // Load Shared Plan (Next Week) on Mount
    useEffect(() => {
        const loadSharedPlan = async () => {
            try {
                const today = new Date();
                const dayOfWeek = today.getDay();
                const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const currentMonday = new Date(today);
                currentMonday.setDate(today.getDate() - diffToMon);

                const nextMonday = new Date(currentMonday);
                nextMonday.setDate(currentMonday.getDate() + 7);

                const nextSunday = new Date(nextMonday);
                nextSunday.setDate(nextMonday.getDate() + 6);

                const formatDate = (d) => d.toISOString().split('T')[0];

                const data = await fetchPlan(formatDate(nextMonday), formatDate(nextSunday));

                if (Array.isArray(data) && data.length > 0) {
                    const daysMap = {
                        'Понедельник': 0, 'Вторник': 1, 'Среда': 2, 'Четверг': 3,
                        'Пятница': 4, 'Суббота': 5, 'Воскресенье': 6
                    };

                    const mapped = data.map(item => ({
                        day: daysMap[item.day_of_week],
                        type: item.meal_type,
                        recipeId: item.recipe_id,
                        memberId: item.family_member_id,
                        portions: item.portions || 1 // Load portion from DB
                    })).filter(i => i.day !== undefined); // Ensure valid mapping

                    setPlannedMeals(mapped);
                }
            } catch (e) {
                console.error("Failed to load shared plan", e);
            }
        };
        loadSharedPlan();
    }, []);

    // Sync to LS removed to prefer DB source of truth
    // If we want offline support, we'd need more logic. 
    // user asked for "everyone sees it", which implies DB priority.


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
            { day: dayIndex, type, recipeId, memberId, portions: 1 }
        ]);
    };

    const updateMealMember = (instance, newMemberId) => {
        setPlannedMeals(prev => prev.map(m =>
            m === instance ? { ...m, memberId: newMemberId } : m
        ));
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
                    remainingPortions[recipe.id]--;
                    filledSlots++;
                }
            }
        });

        // 3. Distribute Lunch/Dinner (Main/Soup) - SAME AS BEFORE
        // Create strict consumer constraints based on *current* plan (if any) or existing logic?
        // Wait, the previous logic used 'recipeConsumers' from the *current* plan being overwritten.
        // But we are overwriting it.
        // The logic "Strict Consumer Constraint: If this recipe was eaten by ANYONE ... restrict"
        // was based on preserving manual assignments. But here we are overwriting?
        // Actually, 'autoDistribute' overwrites 'plannedMeals'.
        // So 'recipeConsumers' derived from 'plannedMeals' (which is about to be wiped) is maybe not what we want?
        // If the user manually assigned "Steak to Dad" then clicked "Auto", maybe they want to keep that constraint?
        // But the prompt says "Auto Distribute" overwrites.
        // Let's remove that complexity or keep it if it makes sense.
        // The previous code scan `plannedMeals` (which is the OLD state).
        // The confirmation says "Перезапишет текущее расписание". So we start fresh.
        // Thus, no consumer constraints from previous plan needed.

        // 3. Distribute Lunch/Dinner (Main/Soup)

        // Identify recipes eaten for Lunch/Dinner last week
        const lastWeekLunchDinnerIds = new Set();
        if (Array.isArray(lastWeekPlan)) {
            lastWeekPlan.forEach(item => {
                if ((item.meal_type === 'lunch' || item.meal_type === 'dinner') && item.recipe_id) {
                    lastWeekLunchDinnerIds.add(item.recipe_id);
                }
            });
        }

        // Split mainRecipes into New and Old
        const newMainRecipes = mainRecipes.filter(r => !lastWeekLunchDinnerIds.has(r.id));
        const oldMainRecipes = mainRecipes.filter(r => lastWeekLunchDinnerIds.has(r.id));

        // Interleave them: New, Old, New, Old...
        const balancedMainRecipes = [];
        const maxLength = Math.max(newMainRecipes.length, oldMainRecipes.length);
        for (let i = 0; i < maxLength; i++) {
            if (i < newMainRecipes.length) balancedMainRecipes.push(newMainRecipes[i]);
            if (i < oldMainRecipes.length) balancedMainRecipes.push(oldMainRecipes[i]);
        }

        // Fallback: If one list is empty, balancedMainRecipes will just be the other list.
        // If both have items, it's mixed 50/50 as requested.

        balancedMainRecipes.forEach(recipe => {
            let remaining = remainingPortions[recipe.id];
            const validTypes = getValidTypes(recipe.category);
            if (validTypes.length === 0 || remaining <= 0) return;

            // Sequential Timeline Approach
            const timeline = [];
            for (let d = 0; d < 7; d++) {
                if (validTypes.includes('lunch')) timeline.push({ d, t: 'lunch' });
                if (validTypes.includes('dinner')) timeline.push({ d, t: 'dinner' });
            }

            if (timeline.length === 0) return;

            let idx = 0;
            let loopCount = 0;

            // Strategy: "Clean Start" for Big Recipes
            // If recipe has enough portions for everyone, it MUST start on a "fresh" meal slot (nobody eaten yet).
            // This aligns the family meal.
            // Small recipes (leftovers/singles) can fill gaps.

            const isBigRecipe = remaining >= consumers.length;
            let foundStart = false;

            // Scan for a valid start index
            for (let i = 0; i < timeline.length; i++) {
                const slot = timeline[i];
                const eatenCount = consumption[slot.d][slot.t].size;

                if (isBigRecipe) {
                    if (eatenCount === 0) {
                        idx = i;
                        foundStart = true;
                        break;
                    }
                } else {
                    if (eatenCount < consumers.length) {
                        idx = i;
                        foundStart = true;
                        break;
                    }
                }
            }

            if (!foundStart && isBigRecipe) {
                // Fallback: If no clean slots, just find any space
                for (let i = 0; i < timeline.length; i++) {
                    const slot = timeline[i];
                    if (consumption[slot.d][slot.t].size < consumers.length) {
                        idx = i;
                        foundStart = true;
                        break;
                    }
                }
            }

            // If still no space, we can't place it efficiently, but let loop handle it.

            while (remaining > 0 && loopCount < timeline.length * 2) {
                const slot = timeline[idx];
                const eaten = consumption[slot.d][slot.t];

                // Base candidates: those who haven't eaten yet in this slot
                let candidates = consumers.filter(c => !eaten.has(c.id));

                if (candidates.length > 0) {
                    // Try to feed the whole group if possible, or as many as we can
                    const takeCount = Math.min(remaining, candidates.length);
                    const targets = candidates.slice(0, takeCount);

                    targets.forEach(c => {
                        newMeals.push({ day: slot.d, type: slot.t, recipeId: recipe.id, memberId: c.id });
                        eaten.add(c.id);
                    });
                    remaining -= takeCount;
                }

                idx = (idx + 1) % timeline.length;
                loopCount++;
            }
        });

        setPlannedMeals(newMeals);
    };

    const savePlanToNextWeek = async () => {
        if (!window.confirm("Сохранить текущий план на СЛЕДУЮЩУЮ неделю? Это перезапишет существующий план на ту неделю.")) return;

        try {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0-6
            const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            // Current Monday
            const currentMonday = new Date(today);
            currentMonday.setDate(today.getDate() - diffToMon);

            // Next Monday
            const nextMonday = new Date(currentMonday);
            nextMonday.setDate(currentMonday.getDate() + 7);

            const formatDate = (d) => d.toISOString().split('T')[0];
            const WEEK_DAYS_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

            const itemsToSave = plannedMeals.map(pm => {
                const mealDate = new Date(nextMonday);
                mealDate.setDate(nextMonday.getDate() + pm.day); // pm.day is 0-6

                // Use instance-specific portion, default to 1
                const portions = pm.portions || 1;

                return {
                    day_of_week: WEEK_DAYS_NAMES[pm.day],
                    meal_type: pm.type,
                    recipe_id: pm.recipeId,
                    portions: portions,
                    family_member_id: pm.memberId,
                    date: formatDate(mealDate)
                };
            });

            if (itemsToSave.length === 0) {
                alert("План пуст, нечего сохранять.");
                return;
            }

            // Clear the logic range first to ensure we overwrite even empty days
            const nextSunday = new Date(nextMonday);
            nextSunday.setDate(nextMonday.getDate() + 6);

            await clearPlan(formatDate(nextMonday), formatDate(nextSunday));
            await savePlan(itemsToSave);

            alert("✅ План успешно сохранен на следующую неделю!");

        } catch (error) {
            console.error(error);
            alert("❌ Ошибка при сохранении: " + error.message);
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
