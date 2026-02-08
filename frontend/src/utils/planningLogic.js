/**
 * Logic for auto-distributing meals.
 * 
 * @param {Object} params
 * @param {Array} params.recipes - List of all recipes
 * @param {Array} params.familyMembers - List of family members
 * @param {number} params.eatersCount - Number of eaters
 * @param {Object} params.plannedPortions - Map of recipeId -> portion size
 * @param {Array} params.visibleRecipes - List of visible (non-hidden) recipes
 * @param {Array} params.lastWeekPlan - Plan from the previous week (for history)
 * @param {Function} params.getDefaultPortion - Helper to get default portion
 * @returns {Array} newMeals - List of generated meal items
 */
export const calculateDistributedMeals = ({
    recipes,
    familyMembers,
    eatersCount,
    plannedPortions,
    visibleRecipes,
    lastWeekPlan,
    getDefaultPortion
}) => {
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

    shuffleArray(sortedRecipes);

    const breakfastRecipes = sortedRecipes.filter(r => r.category === 'breakfast');

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

    // 3. Sequential Lunch & Dinner Distribution
    // Pool of recipes for L/D (Main + Soup)
    const lunchDinnerRecipes = shuffleArray([...visibleRecipes.filter(r => r.category === 'main' || r.category === 'soup')]);

    if (lunchDinnerRecipes.length > 0) {
        let currentRecipe = null;
        let currentPortionsLeft = 0;
        let recipeIdx = 0;

        // Helper to get next recipe from pool (circular)
        const getNextRecipe = () => {
            if (lunchDinnerRecipes.length === 0) return null;
            const r = lunchDinnerRecipes[recipeIdx % lunchDinnerRecipes.length];
            recipeIdx++;
            return r;
        };

        const slots = [];
        for (let d = 0; d < 7; d++) {
            slots.push({ day: d, type: 'lunch' });
            slots.push({ day: d, type: 'dinner' });
        }

        for (const slot of slots) {
            // Determine what to serve
            // If we have enough left in "Pot" for all eaters, serve it.
            // Else, cook NEW batch.
            if (!currentRecipe || currentPortionsLeft < eatersCount) {
                // Cook New Batch
                currentRecipe = getNextRecipe();
                if (currentRecipe) {
                    // "Cook" - we have the whole batch available now
                    const batchSize = plannedPortions[currentRecipe.id] || getDefaultPortion(currentRecipe);
                    currentPortionsLeft = batchSize;
                }
            }

            if (currentRecipe) {
                // Serve to all consumers
                consumers.forEach(consumer => {
                    newMeals.push({
                        day: slot.day,
                        type: slot.type,
                        recipeId: currentRecipe.id,
                        memberId: consumer.id
                    });
                });
                consumption[slot.day][slot.type] = new Set(consumers.map(c => c.id));

                // Deduct from Pot
                currentPortionsLeft -= eatersCount;
            }
        }
    }

    return newMeals;
};
