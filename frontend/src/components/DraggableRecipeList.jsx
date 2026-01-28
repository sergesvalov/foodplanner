import React, { useEffect, useState } from 'react';

const DraggableRecipeList = ({ refreshTrigger }) => {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetch('/api/recipes/')
      .then(res => res.json())
      .then(data => setRecipes(data))
      .catch(err => console.error(err));
  }, [refreshTrigger]); // Перезагружаем список, если refreshTrigger изменился

  const handleDragStart = (e, recipe) => {
    e.dataTransfer.setData('recipeData', JSON.stringify(recipe));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full overflow-y-auto">
      <h3 className="font-bold text-gray-700 mb-3">Каталог рецептов</h3>
      <div className="space-y-2">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, recipe)}
            className="p-2 bg-indigo-50 border border-indigo-200 rounded cursor-grab hover:bg-indigo-100 transition shadow-sm"
          >
            <div className="font-semibold text-indigo-900 text-sm">{recipe.title}</div>
            <div className="text-xs text-indigo-500 truncate">{recipe.ingredients.length} ингредиентов</div>
          </div>
        ))}
        {recipes.length === 0 && <p className="text-xs text-gray-400">Список пуст</p>}
      </div>
    </div>
  );
};

export default DraggableRecipeList;