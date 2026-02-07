import React, { useState, useMemo } from 'react';

const PlanningSidebar = ({ recipes }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const CATEGORIES = [
        { id: 'all', label: 'Все' },
        { id: 'breakfast', label: 'Завтраки' },
        { id: 'soup', label: 'Первое' },
        { id: 'main', label: 'Второе' },
        { id: 'side', label: 'Гарниры' },
        { id: 'snack', label: 'Перекусы' },
        { id: 'yummy', label: 'Вкусняшки' },
    ];

    const filteredRecipes = useMemo(() => {
        return recipes.filter(r => {
            const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => b.rating - a.rating);
    }, [recipes, searchTerm, selectedCategory]);

    const handleDragStart = (e, recipe) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('application/json', JSON.stringify({
            isNew: true,
            recipeId: recipe.id
        }));
    };

    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
            <div className="p-4 border-b border-gray-100 space-y-3">
                <input
                    type="text"
                    placeholder="Поиск рецептов..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="flex flex-wrap gap-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-2 py-1 text-xs rounded-full border transition-colors ${selectedCategory === cat.id
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredRecipes.map(recipe => (
                    <div
                        key={recipe.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, recipe)}
                        className="bg-white p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all group"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="font-medium text-sm text-gray-800 leading-snug">
                                {recipe.title}
                            </div>
                            {recipe.rating > 0 && (
                                <span className="text-[10px] text-yellow-500 min-w-[20px] text-right">
                                    {recipe.rating}⭐
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2 text-[10px] text-gray-500">
                            <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">
                                {Math.round(recipe.calories_per_portion)} ккал
                            </span>
                            <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                                €{recipe.total_cost}
                            </span>
                        </div>
                    </div>
                ))}

                {filteredRecipes.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-8">
                        Ничего не найдено
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlanningSidebar;
