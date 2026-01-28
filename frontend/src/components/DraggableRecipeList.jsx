import React, { useEffect, useState } from 'react';

const DraggableRecipeList = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/recipes/')
      .then(res => res.json())
      .then(data => setRecipes(data))
      .catch(err => console.error(err));
  }, []);

  const filteredRecipes = recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (e, recipe) => {
    e.dataTransfer.setData('recipeData', JSON.stringify(recipe));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    // Добавили w-80 (фиксированная ширина) и flex-col
    <div className="h-full flex flex-col bg-white border-r border-gray-200 w-80 shadow-sm z-20">
      
      {/* Шапка */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 shrink-0">
        <h2 className="font-bold text-gray-700 text-lg mb-3 flex items-center gap-2">
          <span>🍽</span> Блюда
          <span className="text-xs font-normal text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full ml-auto">
            {filteredRecipes.length}
          </span>
        </h2>

        <div className="relative">
          <input
            type="text"
            placeholder="Найти..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          {searchTerm && (
            <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
            >
                ✕
            </button>
          )}
        </div>
      </div>

      {/* Список рецептов */}
      {/* overflow-x-hidden убирает горизонтальную полосу, break-words переносит текст */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 bg-gray-50/50">
        {filteredRecipes.length === 0 ? (
            <div className="text-center text-gray-400 text-sm mt-6 flex flex-col items-center">
                <span className="text-2xl mb-2">🔍</span>
                Ничего не найдено
            </div>
        ) : (
            filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                draggable
                onDragStart={(e) => handleDragStart(e, recipe)}
                className="p-3 bg-white border border-gray-200 rounded shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all hover:border-indigo-300 group select-none w-full"
              >
                <div className="flex justify-between items-start mb-1 gap-2">
                    {/* break-words заставляет длинный текст переноситься, а не расширять блок */}
                    <span className="font-semibold text-gray-800 text-sm leading-tight break-words">
                        {recipe.title}
                    </span>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 whitespace-nowrap shrink-0">
                        €{recipe.total_cost.toFixed(2)}
                    </span>
                </div>
                
                <div className="text-[10px] text-gray-400 mt-1 flex justify-between items-center">
                    <span>{recipe.ingredients.length} инг.</span>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default DraggableRecipeList;