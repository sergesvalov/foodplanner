import React from 'react';
import { CATEGORIES } from '../../constants/categories';

const RecipeFilters = ({
    searchTerm,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    totalCount
}) => {
    return (
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
            <div className="font-bold text-gray-700">
                Каталог блюд ({totalCount})
            </div>

            <div className="flex gap-2">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="🔍 Поиск..."
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200 w-32 md:w-48"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <select
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
                >
                    <option value="all">Все категории ({totalCount})</option>
                    {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default RecipeFilters;
