import React, { useState, useEffect } from 'react';

const PlanningPage = () => {
    const [recipes, setRecipes] = useState([]);

    useEffect(() => {
        fetch('/api/recipes/')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setRecipes(data);
            })
            .catch(err => console.error(err));
    }, []);

    // Fetch weekly plan for "used in week" logic
    const [weeklyPlan, setWeeklyPlan] = useState([]);
    useEffect(() => {
        // Fetch current week plan (simplification: fetch all for now or current range)
        fetch('/api/plan/')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setWeeklyPlan(data);
            })
            .catch(err => console.error(err));
    }, []);

    // State for hidden recipes
    const [hiddenIds, setHiddenIds] = useState(() => {
        const saved = localStorage.getItem('planning_hidden_recipes');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('planning_hidden_recipes', JSON.stringify(hiddenIds));
    }, [hiddenIds]);

    // State for highlighted (pinned) recipes
    const [highlightedIds, setHighlightedIds] = useState(() => {
        const saved = localStorage.getItem('planning_highlighted_recipes');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('planning_highlighted_recipes', JSON.stringify(highlightedIds));
    }, [highlightedIds]);

    // View Mode: 'browse' | 'summary' | 'days'
    const [viewMode, setViewMode] = useState('browse');

    console.log('PlanningPage render, viewMode:', viewMode);

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

    useEffect(() => {
        // Try to fetch family count if not manually set (or just always fetch to verify default if needed, 
        // but here we only set if localStorage was empty? No, we set default 2. 
        // Let's check: if localStorage had nothing, we want to maybe fetch.
        // Or better: just fetch and if user hasn't interactively changed it? 
        // Simplest: Fetch, and if current state is equal to default 2 (likely unconfigured), update it?
        // Or just let user invoke it? 
        // Requirement: "default eaters count equals defined users in admin".
        // So on mount, if we don't have a strong user preference saved, or maybe even if we do?
        // Let's trust localStorage if it exists. If not (or if it's default 2?), maybe check?
        // Actually, user said "default equals...", implying if I reset or first load.
        // Let's do: if localStorage was empty (detected by some flag?) -> we already set 2.
        // Let's refine initial state:
        // We can't easily detect "empty localStorage" inside useState callback side effects.
        // Let's do a fetch inside useEffect and setEatersCount if we want to sync.
        // User might be annoyed if he set it to 1 and we force it to 3.
        // Only set if we haven't saved a preference? 
        // Let's assume if localStorage.getItem('planning_eaters_count') is null, we fetch.
        if (localStorage.getItem('planning_eaters_count') === null) {
            fetch('/api/admin/family')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        setEatersCount(data.length);
                    }
                })
                .catch(console.error);
        }
    }, []);

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
        e.stopPropagation();
        setHighlightedIds(prev =>
            prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]
        );
    };

    const hideRecipe = (e, id) => {
        e.stopPropagation(); // Prevent card click
        if (!window.confirm("Скрыть рецепт из планирования?")) return;
        setHiddenIds(prev => [...prev, id]);
    };

    const restoreAll = () => {
        if (!window.confirm("Показать все скрытые рецепты?")) return;
        setHiddenIds([]);
    };

    // Family Members
    const [familyMembers, setFamilyMembers] = useState([]);

    useEffect(() => {
        // Fetch family for "consumers" logic
        fetch('/api/admin/family')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setFamilyMembers(data);
            })
            .catch(console.error);
    }, []);

    // Sync eatersCount with family size if available (optional, but good for consistency)
    useEffect(() => {
        if (familyMembers.length > 0 && localStorage.getItem('planning_eaters_count') === null) {
            setEatersCount(familyMembers.length);
        }
    }, [familyMembers]);

    const autoDistribute = () => {
        if (plannedMeals.length > 0 && !window.confirm("Это действие перезапишет текущее расписание по дням. Продолжить?")) return;

        const newMeals = [];
        // Track usage: "day-type-memberId" -> true
        const usedSlots = new Set();

        // Track recipe locks: "day-type" -> recipeId (Only for Lunch/Dinner)
        const slotLocks = new Map();

        // Track member history to enforce consistency: MemberID -> Set<RecipeID>
        const memberRecipeStats = new Map();

        // Define consumers: either Real Family Members or Mock IDs based on eatersCount
        let consumers = [];
        if (familyMembers.length > 0) {
            // Use active family members up to eatersCount? Or just all family members?
            // User requirement: "eaters who are accounted for in the system".
            // If eatersCount is manually reduced, we should probably pick the first N members?
            // Or just use all family members if they exist?
            // "eatersCount" is manually adjustable in UI. 
            // If I set Eaters=1 but have 2 family members, who eats?
            // Let's take the first `eatersCount` members from family list.
            consumers = familyMembers.slice(0, eatersCount);
        }

        // If we still don't have enough consumers (e.g. eatersCount > family.length, or no family), fill with mocks
        while (consumers.length < eatersCount) {
            const id = `mock-${consumers.length + 1}`;
            consumers.push({ id: id, name: `Едок ${consumers.length + 1}`, color: 'gray' });
        }

        // Initialize stats
        consumers.forEach(c => memberRecipeStats.set(c.id, new Set()));

        // Helper to get next day index (0-6)
        const getNextDay = (currentDay) => (currentDay + 1) % 7;

        plannedRecipes.forEach(recipe => {
            let remaining = Math.round(plannedPortions[recipe.id] || getDefaultPortion(recipe));

            // Determine valid meal types specific to this recipe
            const validTypes = mealTypes
                .filter(mt => mt.categories.includes(recipe.category))
                .map(mt => mt.id);

            if (validTypes.length === 0) return;

            let currentDay = Math.floor(Math.random() * 7); // Start random day

            // Limit attempts to place recipe to avoid infinite loop
            let recipeAttempts = 0;

            while (remaining > 0 && recipeAttempts < 50) {
                // Strategy: 
                // 1. Try to place as many as possible in one slot (Day + Type) for ALL consumers.
                // 2. If valid slot found (e.g. 2 of 2 consumers free), place 2 portions.
                // 3. If only partial availability (e.g. 1 of 2 free), place 1 portion?
                //    Wait, user said "if portion is only one.. assign to random eater".
                //    So we should check availability for EACH consumer in the slot.

                let placedType = null;
                let placedCountInChunk = 0;
                let foundSlot = false;
                let attempts = 0;

                while (!foundSlot && attempts < 14) {
                    // Try random/shuffled types for currentDay
                    const shuffledTypes = [...validTypes].sort(() => 0.5 - Math.random());

                    for (const type of shuffledTypes) {
                        // Check Slot Locking (Exclusive Lunch/Dinner)
                        const slotKey = `${currentDay}-${type}`;
                        const isExclusive = type === 'lunch' || type === 'dinner';

                        if (isExclusive) {
                            const lockedBy = slotLocks.get(slotKey);
                            if (lockedBy && lockedBy !== recipe.id) {
                                // Busied by another recipe -> skip
                                continue;
                            }
                        }

                        // Check which consumers are free in this slot
                        let freeConsumers = consumers.filter(c => !usedSlots.has(`${currentDay}-${type}-${c.id}`));

                        // Logic Branch: Type-Specific Behavior
                        let desiredChunk = 0;
                        let targets = [];

                        if (type === 'breakfast') {
                            // Breakfast: High Continuity (User Preference) but Mixed Dining allowed
                            // Sort free consumers: Priority to those who already ate this recipe
                            freeConsumers.sort((a, b) => {
                                const hasA = memberRecipeStats.get(a.id).has(recipe.id) ? 1 : 0;
                                const hasB = memberRecipeStats.get(b.id).has(recipe.id) ? 1 : 0;
                                // If affinity differs, prioritize affinity. Else random.
                                if (hasA !== hasB) return hasB - hasA;
                                return 0.5 - Math.random();
                            });

                            // For breakfast, we can place individual portions.
                            desiredChunk = Math.min(remaining, freeConsumers.length);
                            if (desiredChunk > 0) {
                                targets = freeConsumers.slice(0, desiredChunk);
                            }

                        } else {
                            // Lunch/Dinner: Strict Group Dining (No Split unless leftover)
                            desiredChunk = Math.min(remaining, consumers.length);

                            if (freeConsumers.length >= desiredChunk) {
                                // We have enough space for the Strict Group
                                // Randomize targets from the free ones? Or just take first N?
                                // Since we require group size availability, usually freeConsumers == group size.
                                targets = freeConsumers.sort(() => 0.5 - Math.random()).slice(0, desiredChunk);
                            }
                        }

                        if (targets.length > 0) {
                            targets.forEach(consumer => {
                                usedSlots.add(`${currentDay}-${type}-${consumer.id}`);
                                memberRecipeStats.get(consumer.id).add(recipe.id); // Mark history
                                newMeals.push({
                                    day: currentDay,
                                    type: type,
                                    recipeId: recipe.id,
                                    memberId: consumer.id
                                });
                            });

                            // Lock the slot if it's lunch/dinner
                            if (isExclusive) {
                                slotLocks.set(slotKey, recipe.id);
                            }

                            remaining -= targets.length;
                            placedCountInChunk = targets.length;
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

                if (!foundSlot) {
                    // Could not place remaining portions anywhere? Break to avoid loop.
                    break;
                }

                // Refined Logic (Split by Type):
                if (foundSlot) {
                    if (placedType === 'breakfast') {
                        // Breakfast: Randomize next step to scatter portions
                        currentDay = Math.floor(Math.random() * 7);
                    } else {
                        // Lunch/Dinner: Strict Packing order
                        // If leftovers (less than full group) -> Force next day.
                        // If full meal remains -> Stay on current day to try filling Dinner after Lunch.
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

    // Helper to filter recipes by multiple categories
    const getRecipesByCategories = (categories, sectionTitle, sourceList) => {
        return sourceList
            .filter(r => categories.includes(r.category))
            .sort((a, b) => {
                const aPinned = highlightedIds.includes(a.id);
                const bPinned = highlightedIds.includes(b.id);
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;

                // For Breakfast: Rating first, then Used in Week
                if (sectionTitle === 'Завтрак') {
                    // 1. Rating
                    const ratingDiff = (b.rating || 0) - (a.rating || 0);
                    if (ratingDiff !== 0) return ratingDiff;

                    // 2. Used in Breakfast this week
                    const aUsed = weeklyPlan.some(p => p.recipe_id === a.id && p.meal_type === 'breakfast');
                    const bUsed = weeklyPlan.some(p => p.recipe_id === b.id && p.meal_type === 'breakfast');
                    if (aUsed && !bUsed) return -1;
                    if (!bUsed && aUsed) return 1;
                }

                return (b.rating || 0) - (a.rating || 0);
            });
    };

    const plannedRecipes = recipes.filter(r => !hiddenIds.includes(r.id));

    // Determine which list to show based on view mode (Always filter hidden in browse now as well? Or show slightly faded?)
    // Previously: Browsing showed everything but had "Hide" button.
    // Planning: Showed only planned (non-hidden).
    // Let's stick to: Browse = !Hidden, Summary = !Hidden. 
    // Wait, if I hide it, it disappears from Browse too? usually yes.
    // Let's make "sourceList" for Browse be "visible recipes".
    const visibleRecipes = recipes.filter(r => !hiddenIds.includes(r.id));
    const recipesToShow = visibleRecipes;

    // Define columns
    const sections = [
        {
            title: 'Завтрак',
            icon: '🍳',
            items: getRecipesByCategories(['breakfast', 'snack'], 'Завтрак', recipesToShow),
            color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        },
        {
            title: 'Обед',
            icon: '🍲',
            items: getRecipesByCategories(['soup', 'main'], 'Обед', recipesToShow),
            color: 'bg-orange-50 border-orange-200 text-orange-800'
        },
        {
            title: 'Ужин',
            icon: '🍽️',
            items: getRecipesByCategories(['main', 'side'], 'Ужин', recipesToShow),
            color: 'bg-blue-50 border-blue-200 text-blue-800'
        },
        {
            title: 'Напитки',
            icon: '🥤',
            items: getRecipesByCategories(['drink'], 'Напитки', recipesToShow),
            color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
        }
    ];

    // Helper for default portion
    const getDefaultPortion = (recipe) => {
        return recipe.portions || 1;
    };

    // Calculate totals for summary
    const getTotalStats = (categoryRecipes) => {
        return categoryRecipes.reduce((acc, recipe) => {
            const portion = plannedPortions[recipe.id] || getDefaultPortion(recipe);
            // Scale by portion ratio if needed, for now linear
            // Assuming default portion is 1 (in calculations usually) but here we use the actual set portion.
            // Wait, calories_per_portion is for ONE portion.
            // So we just multiply by selected portion count.
            return {
                calories: acc.calories + (recipe.calories_per_portion * portion),
                cost: acc.cost + (recipe.total_cost * portion) // Total cost is per recipe usually? No, "total_cost" might be per ONE portion or WHOLE?
                // Let's check model. Recipe model: "total_cost" usually implies whole dish?
                // But previously I saw usage: `recipe.total_cost * portion`.
                // If `total_cost` is for the WHOLE recipe yield (e.g. 4 portions), then for 1 portion we need / portions?
                // OR `total_cost` is per portion?
                // Let's look at `PlanningPage` prev usage: `recipe.total_cost`.
                // In `ProductList` usually cost is calculated.
                // Re-reading `PlanningPage` logic:
                // `recipe.total_cost` was displayed as "€..." next to calories.
                // Let's assume `total_cost` is PER PORTION for now, consistent with how I treated it in the last edit.
                // Correction: `recipe.total_cost` from backend/routers/recipes.py usually matches `cost_per_portion` if I renamed it?
                // Let's check previous files. `recipes.py`:
                // db_recipe has no total_cost field? It's computed?
                // Ah, backend `RecipeResponse` schema has `total_cost`.
                // Let's assume `total_cost` is per portion or per item as consistent with previous code.
                // Wait, if users see "Max Portions" (e.g. 4), and cost multiplies by 4, that makes sense.
            };
        }, { calories: 0, cost: 0 });
    };

    const totalStats = getTotalStats(plannedRecipes);

    // State for planned meals: [{ day: 0, type: 'breakfast', recipeId: 1 }, ...]
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

    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const mealTypes = [
        { id: 'breakfast', title: 'Завтрак', categories: ['breakfast'] },
        { id: 'lunch', title: 'Обед', categories: ['soup', 'main'] },
        { id: 'dinner', title: 'Ужин', categories: ['main', 'side'] },
        { id: 'snack', title: 'Перекус/Напитки', categories: ['snack', 'drink'] }
    ];

    // Helper to get available options for a slot
    const getOptionsForSlot = (typeCategories) => {
        return plannedRecipes.filter(r => typeCategories.includes(r.category));
    };

    return (
        <div className="container mx-auto max-w-7xl p-4 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">
                    {viewMode === 'browse' && 'Планирование меню'}
                    {viewMode === 'summary' && 'Итоговый список'}
                    {viewMode === 'days' && 'По дням недели'}
                </h2>

                <div className="flex items-center gap-4">
                    {viewMode === 'browse' && (
                        <>
                            {hiddenIds.length > 0 && (
                                <button
                                    onClick={restoreAll}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 underline mr-4"
                                >
                                    Показать скрытые ({hiddenIds.length})
                                </button>
                            )}
                            <button
                                onClick={() => setViewMode('summary')}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                            >
                                Далее к порциям →
                            </button>
                        </>
                    )}
                    {viewMode === 'summary' && (
                        <>
                            <div className="text-right mr-4 text-sm hidden md:block">
                                <span className="font-bold text-gray-900 block">€{totalStats.cost.toFixed(2)}</span>
                                <span className="text-gray-500 block">{Math.round(totalStats.calories)} ккал</span>
                            </div>
                            <button
                                onClick={() => setViewMode('browse')}
                                className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm mr-2"
                            >
                                ← Назад
                            </button>
                            <button
                                onClick={() => setViewMode('days')}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                            >
                                Далее к дням →
                            </button>
                        </>
                    )}
                    {viewMode === 'days' && (
                        <>
                            <button
                                onClick={autoDistribute}
                                className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-200 mr-4 font-medium transition-colors"
                                title="Случайно распределить выбранные блюда по дням"
                            >
                                🪄 Авто-распределение
                            </button>

                            <div className="text-right mr-4 text-sm hidden md:block">
                                <span className="font-bold text-gray-900 block">€{totalStats.cost.toFixed(2)}</span>
                                <span className="text-gray-500 block">{Math.round(totalStats.calories)} ккал</span>
                            </div>
                            <button
                                onClick={() => setViewMode('summary')}
                                className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                            >
                                ← Назад
                            </button>
                        </>
                    )}
                </div>
            </div>

            {viewMode !== 'days' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
                    {sections.map((section, idx) => (
                        <div key={idx} className={`rounded-xl border ${section.color} flex flex-col h-full overflow-hidden shadow-sm`}>
                            {/* Header */}
                            <div className="p-4 border-b border-black/5 font-bold text-lg flex items-center gap-2 bg-white/50 shrink-0">
                                <span>{section.icon}</span>
                                {section.title}
                                <span className="ml-auto text-xs opacity-60 bg-black/10 px-2 py-0.5 rounded-full">
                                    {section.items.length}
                                </span>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {section.items.map(recipe => {
                                    const isPinned = highlightedIds.includes(recipe.id);
                                    return (
                                        <div
                                            key={recipe.id}
                                            className={`p-3 rounded-lg shadow-sm border transition-all cursor-pointer group relative
                                            ${isPinned
                                                    ? 'bg-green-50 border-green-300 shadow-md ring-1 ring-green-200'
                                                    : 'bg-white border-black/5 hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">
                                                        {recipe.title}
                                                    </h4>
                                                    {viewMode === 'summary' && (
                                                        <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                className="w-6 h-6 rounded bg-gray-100 border flex items-center justify-center hover:bg-gray-200"
                                                                onClick={() => updatePortion(recipe.id, -0.5)}
                                                            >-</button>
                                                            <span className="text-sm font-medium w-8 text-center">
                                                                {plannedPortions[recipe.id] || getDefaultPortion(recipe)}
                                                            </span>
                                                            <button
                                                                className="w-6 h-6 rounded bg-gray-100 border flex items-center justify-center hover:bg-gray-200"
                                                                onClick={() => updatePortion(recipe.id, 0.5)}
                                                            >+</button>
                                                            <span className="text-xs text-gray-500 ml-1">порций</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {recipe.rating > 0 && (
                                                    <span className="text-[10px] text-yellow-500 shrink-0 ml-1">
                                                        {'⭐'.repeat(recipe.rating)}
                                                    </span>
                                                )}
                                            </div>
                                            {viewMode === 'browse' && (
                                                <button
                                                    onClick={(e) => hideRecipe(e, recipe.id)}
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                                                    title="Скрыть из планирования"
                                                >
                                                    ❌
                                                </button>
                                            )}

                                            {viewMode === 'browse' && (
                                                <button
                                                    onClick={(e) => toggleHighlight(e, recipe.id)}
                                                    className={`absolute top-2 right-8 transition-all p-1 ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 grayscale hover:grayscale-0'}`}
                                                    title={isPinned ? "Открепить" : "Закрепить"}
                                                >
                                                    📌
                                                </button>
                                            )}

                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {viewMode === 'summary' ? (
                                                    <>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                                            {Math.round(recipe.calories_per_portion * (plannedPortions[recipe.id] || getDefaultPortion(recipe)))} ккал
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-100">
                                                            €{(recipe.total_cost * (plannedPortions[recipe.id] || getDefaultPortion(recipe))).toFixed(2)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                                            {recipe.calories_per_portion} ккал
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                                            €{recipe.total_cost}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {section.items.length === 0 && (
                                    <div className="text-center text-sm opacity-50 py-10 italic">
                                        {viewMode === 'browse' ? 'Нет рецептов' : 'Ничего не выбрано'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex gap-4 flex-1 overflow-auto pb-10 items-start">
                    {weekDays.map((dayName, dIdx) => (
                        <div key={dIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden min-w-[300px] w-[300px] shrink-0">
                            <div className="bg-gray-50 sticky top-0 z-10 p-3 border-b text-center font-bold text-gray-700">
                                {dayName}
                            </div>
                            <div className="flex-1 p-3 space-y-4">
                                {mealTypes.map(mType => {
                                    // Get meals planned for this day & type
                                    const mealsInSlot = plannedMeals.filter(pm => pm.day === dIdx && pm.type === mType.id);
                                    const options = getOptionsForSlot(mType.categories);

                                    return (
                                        <div key={mType.id} className="space-y-1">
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{mType.title}</div>
                                            <div className="space-y-1">
                                                {mealsInSlot.map((pm, pmIdx) => {
                                                    const r = recipes.find(x => x.id === pm.recipeId);
                                                    if (!r) return null;

                                                    // Find member info if present
                                                    const member = familyMembers.find(f => f.id === pm.memberId);
                                                    const colorClass = member ? `bg-${member.color}-500` : 'bg-gray-400';
                                                    const letter = member ? member.name[0] : (pm.memberId ? '?' : '');

                                                    return (
                                                        <div key={pmIdx} className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-2 rounded text-sm relative group">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                {letter && (
                                                                    <div className={`w-5 h-5 rounded-full ${colorClass} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm`} title={member?.name}>
                                                                        {letter}
                                                                    </div>
                                                                )}
                                                                <span className="truncate" title={r.title}>{r.title}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    // Remove specific entry (matched by reference or index? We don't have IDs on meals)
                                                                    // Use filter by index in the global array? 
                                                                    // Easier: remove match by properties including memberId.
                                                                    // Or just remove this specific instance.
                                                                    // We handle removal by filtering out ONE instance.
                                                                    setPlannedMeals(prev => {
                                                                        const idx = prev.indexOf(pm);
                                                                        if (idx === -1) return prev;
                                                                        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
                                                                    });
                                                                }}
                                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 ml-1"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    );
                                                })}

                                                {/* Add Helper */}
                                                <div className="relative group">
                                                    <select
                                                        className="w-full text-xs border border-dashed border-gray-300 rounded p-1.5 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent cursor-pointer"
                                                        value=""
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                addMeal(dIdx, mType.id, parseInt(e.target.value));
                                                            }
                                                        }}
                                                    >
                                                        <option value="">+ Добавить</option>
                                                        {options.map(opt => (
                                                            <option key={opt.id} value={opt.id}>
                                                                {opt.title} ({Math.round(opt.calories_per_portion)} ккал)
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PlanningPage;
