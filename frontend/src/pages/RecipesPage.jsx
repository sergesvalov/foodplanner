import React, { useState, useEffect } from 'react';
import RecipeBuilder from '../components/RecipeBuilder';

const RecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  
  // Состояние: какой рецепт мы сейчас редактируем (null = режим создания)
  const [editingRecipe, setEditingRecipe] = useState(null);

  const fetchRecipes = () => {
    fetch('/api/recipes/')
      .then(res => res.json())
      .then(data => setRecipes(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Коллбек: рецепт создан или обновлен
  const handleRecipeSaved = () => {
    fetchRecipes();
    setEditingRecipe(null); // Выход из режима редактирования
  };

  // Удаление рецепта
  const handleDelete = async (id) => {
    if (!window.confirm("Удалить этот рецепт?")) return;
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchRecipes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl h-[calc(100vh-100px)]">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Управление рецептами</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full pb-10">
        
        {/* КОЛОНКА 1: Конструктор (Форма) */}
        <div className="overflow-y-auto">
          <RecipeBuilder 
            onRecipeCreated={handleRecipeSaved} 
            initialData={editingRecipe}
            onCancel={() => setEditingRecipe(null)}
          />
        </div>

        {/* КОЛОНКА 2: Список рецептов */}
        <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden h-[600px] md:h-auto">
          <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">
            Каталог блюд ({recipes.length})
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {recipes.map(recipe => (
              <div 
                key={recipe.id} 
                className={`p-4 rounded-lg border transition-all ${
                  editingRecipe?.id === recipe.id 
                    ? 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-300' 
                    : 'bg-white border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800">{recipe.title}</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {recipe.ingredients.length} инг.
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[1.25rem]">
                  {recipe.description || "Нет описания"}
                </p>

                <div className="flex justify-end gap-2 border-t pt-2 border-gray-100">
                  <button 
                    onClick={() => {
                        setEditingRecipe(recipe);
                        // Прокрутка вверх на мобильных, чтобы увидеть форму
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 font-medium transition"
                  >
                    Изменить
                  </button>
                  <button 
                    onClick={() => handleDelete(recipe.id)}
                    className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium transition"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}

            {recipes.length === 0 && (
              <div className="text-center text-gray-400 mt-10">Список рецептов пуст</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RecipesPage;