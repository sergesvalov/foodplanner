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

    // State for hidden recipes
    const [hiddenIds, setHiddenIds] = useState(() => {
        const saved = localStorage.getItem('planning_hidden_recipes');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('planning_hidden_recipes', JSON.stringify(hiddenIds));
    }, [hiddenIds]);

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
    const getRecipesByCategories = (categories) => {
        return recipes
            .filter(r => categories.includes(r.category))
            .filter(r => !hiddenIds.includes(r.id)) // Filter hidden
            .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    };

    // Define columns
    const sections = [
        {
            title: 'Завтрак',
            icon: '🍳',
            items: getRecipesByCategories(['breakfast', 'snack']),
            color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        },
        {
            title: 'Обед',
            icon: '🍲',
            items: getRecipesByCategories(['soup', 'main']),
            color: 'bg-orange-50 border-orange-200 text-orange-800'
        },
        {
            title: 'Ужин',
            icon: '🍽️',
            items: getRecipesByCategories(['main', 'side']),
            color: 'bg-blue-50 border-blue-200 text-blue-800'
        }
    ];

    return (
        <div className="container mx-auto max-w-7xl p-4 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Планирование меню</h2>
                {hiddenIds.length > 0 && (
                    <button
                        onClick={restoreAll}
                        className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                    >
                        Показать скрытые ({hiddenIds.length})
                    </button>
                )}
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
                            {section.items.map(recipe => (
                                <div key={recipe.id} className="bg-white p-3 rounded-lg shadow-sm border border-black/5 hover:shadow-md transition-shadow cursor-pointer group">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">
                                            {recipe.title}
                                        </h4>
                                        {recipe.rating > 0 && (
                                            <span className="text-[10px] text-yellow-500 shrink-0 ml-1">
                                                {'⭐'.repeat(recipe.rating)}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => hideRecipe(e, recipe.id)}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                                        title="Скрыть из планирования"
                                    >
                                        ❌
                                    </button>

                                    <div className="flex flex-wrap gap-1 mt-2">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                            {recipe.calories_per_portion} ккал
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                            €{recipe.total_cost}
                                        </span>
                                    </div>
                                </div>
                            ))}

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
