import React, { useEffect, useState } from 'react';

const DraggableRecipeList = ({ refreshTrigger }) => {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetch('/api/recipes/')
      .then(res => res.json())
      .then(data => setRecipes(data))
      .catch(err => console.error(err));
  }, [refreshTrigger]);

  const handleDragStart = (e, recipe) => {
    e.dataTransfer.setData('recipeData', JSON.stringify(recipe));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="bg-white p-2 h-full overflow-y-auto">
      <div className="space-y-2">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, recipe)}
            className="group p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-indigo-400 hover:shadow-md transition-all active:cursor-grabbing"
          >
            <div className="flex justify-between items-start mb-1">
              <div className="font-semibold text-gray-800 text-sm leading-tight">
                {recipe.title}
              </div>
              
              {/* --- НОВОЕ: Бейдж с ценой --- */}
              <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                €{recipe.total_cost.toFixed(2)}
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
               <span>{recipe.ingredients.length} инг.</span>
            </div>
          </div>
        ))}
        {recipes.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Список пуст</p>}
      </div>
    </div>
  );
};

export default DraggableRecipeList;