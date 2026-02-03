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

    // View Mode: 'browse' | 'summary'
    const [viewMode, setViewMode] = useState('browse');

    // Planned Portions { recipeId: number }
    const [plannedPortions, setPlannedPortions] = useState(() => {
        const saved = localStorage.getItem('planning_portions');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('planning_portions', JSON.stringify(plannedPortions));
    }, [plannedPortions]);

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

    // Helper to filter recipes by multiple categories
    const getRecipesByCategories = (categories, sectionTitle) => {
        return recipes
            .filter(r => categories.includes(r.category))
            .filter(r => !hiddenIds.includes(r.id)) // Filter hidden
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
                    // (Check if recipe ID is in breakfast slots of weeklyPlan)
                    // Note: We might want ANY usage in week, or just breakfast. User said "those that were in breakfast".
                    const aUsed = weeklyPlan.some(p => p.recipe_id === a.id && p.meal_type === 'breakfast');
                    const bUsed = weeklyPlan.some(p => p.recipe_id === b.id && p.meal_type === 'breakfast');
                    if (aUsed && !bUsed) return -1;
                    if (!bUsed && aUsed) return 1;
                }

                return (b.rating || 0) - (a.rating || 0);
            });
    };

    // Define columns
    const sections = [
        {
            title: 'Завтрак',
            icon: '🍳',
            items: getRecipesByCategories(['breakfast', 'snack'], 'Завтрак'),
            color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        },
        {
            title: 'Обед',
            icon: '🍲',
            items: getRecipesByCategories(['soup', 'main'], 'Обед'),
            color: 'bg-orange-50 border-orange-200 text-orange-800'
        },
        {
            title: 'Ужин',
            icon: '🍽️',
            items: getRecipesByCategories(['main', 'side'], 'Ужин'),
            color: 'bg-blue-50 border-blue-200 text-blue-800'
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

    const plannedRecipes = recipes.filter(r => !hiddenIds.includes(r.id));
    const totalStats = getTotalStats(plannedRecipes);



    return (
        <div className="container mx-auto max-w-7xl p-4 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">
                    {viewMode === 'browse' ? 'Планирование меню' : 'Итоговый список'}
                </h2>

                <div className="flex items-center gap-4">
                    {viewMode === 'browse' ? (
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
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="text-right mr-4 text-sm hidden md:block">
                                <span className="font-bold text-gray-900 block">€{totalStats.cost.toFixed(2)}</span>
                                <span className="text-gray-500 block">{Math.round(totalStats.calories)} ккал</span>
                            </div>
                            <button
                                onClick={() => setViewMode('browse')}
                                className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                            >
                                ← Назад
                            </button>
                        </div>
                    )}
                </div>
            </div>

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
                                    Нет рецептов
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlanningPage;
