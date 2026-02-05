import React, { useState, useEffect, useMemo } from 'react';
import { CATEGORIES } from '../constants/categories';

const DraggableRecipeList = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState([]);

  const toggleCategory = (id) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Порядок и названия категорий
  // Используем общий список

  useEffect(() => {
    fetch('/api/recipes/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRecipes(data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleDragStart = (e, recipe) => {
    e.dataTransfer.setData('recipeData', JSON.stringify(recipe));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 1. Сначала фильтруем по поиску
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recipes, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Поиск */}
      <div className="p-3 border-b border-gray-200 shrink-0 sticky top-0 bg-white z-10">
        <input
          type="text"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none bg-gray-50 focus:bg-white transition-colors"
          placeholder="🔍 Найти рецепт..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Список с категориями */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {filteredRecipes.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            Ничего не найдено
          </div>
        ) : (
          CATEGORIES.map(category => {
            // Фильтруем рецепты для текущей категории
            const categoryRecipes = filteredRecipes.filter(r => {
              const rCat = r.category || 'other'; // Если категории нет, считаем 'other'

              // Если это категория 'other', собираем все, что помечено как 'other' ИЛИ имеет неизвестную категорию
              if (category.id === 'other') {
                const knownIds = CATEGORIES.map(c => c.id).filter(id => id !== 'other');
                return rCat === 'other' || !knownIds.includes(rCat);
              }

              return rCat === category.id;
            });

            // Если категория пуста (после поиска), не рендерим её
            if (categoryRecipes.length === 0) return null;

            return (
              <div key={category.id} className="animate-fadeIn">
                {/* Заголовок категории */}
                <h3
                  className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 sticky top-0 bg-white/95 backdrop-blur py-1 z-10 border-b border-transparent cursor-pointer hover:text-indigo-600 transition-colors flex justify-between items-center pr-2"
                  onClick={() => toggleCategory(category.id)}
                >
                  <span>{category.icon} {category.label} <span className="text-gray-300 font-normal">({categoryRecipes.length})</span></span>
                  <span>{expandedCategories.includes(category.id) ? '▲' : '▼'}</span>
                </h3>

                {expandedCategories.includes(category.id) && (
                  <div className="space-y-2">
                    {categoryRecipes.map(recipe => (
                      <div
                        key={recipe.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, recipe)}
                        className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-800 text-sm leading-tight group-hover:text-indigo-700">
                            {recipe.title}
                          </span>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          <div className="flex gap-2 text-[10px] text-gray-500 font-mono">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                              {recipe.calories_per_100g > 0 ? `${recipe.calories_per_100g} ккал/100г` : `${recipe.total_calories} ккал`}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 rounded border border-gray-100">
                            id: {recipe.id}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DraggableRecipeList;