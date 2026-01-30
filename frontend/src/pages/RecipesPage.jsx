import React, { useState, useEffect } from 'react';
import RecipeBuilder from '../components/RecipeBuilder';

const RecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const fetchRecipes = () => {
    fetch('/api/recipes/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            setRecipes(data);
        } else {
            console.error("API вернул не массив:", data);
            setRecipes([]);
        }
      })
      .catch(err => {
          console.error(err);
          setRecipes([]);
      });
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleServerExport = async () => {
    if(!window.confirm("Сохранить тексты рецептов в файл recipes.json на сервере?")) return;
    try {
      const res = await fetch('/api/recipes/export');
      const data = await res.json();
      if (res.ok) alert("✅ " + data.message);
      else alert("❌ Ошибка: " + data.detail);
    } catch (err) { alert("Ошибка сети"); }
  };

  const handleServerImport = async () => {
    if(!window.confirm("Загрузить рецепты из файла?")) return;
    try {
      const res = await fetch('/api/recipes/import', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Готово!\nСоздано: ${data.created}\nОбновлено текстов: ${data.updated}`);
        fetchRecipes();
      } else {
        alert("❌ Ошибка: " + data.detail);
      }
    } catch (err) { alert("Ошибка сети"); }
  };

  const handleRecipeSaved = () => {
    fetchRecipes();
    setEditingRecipe(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить этот рецепт?")) return;
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchRecipes();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="container mx-auto max-w-6xl h-full flex flex-col p-4 pb-6">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 shrink-0">
        <h2 className="text-2xl font-bold text-gray-800">Управление рецептами</h2>
        <div className="flex gap-2">
          <button onClick={handleServerExport} className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border border-blue-200 font-medium text-sm flex items-center gap-2 transition-colors">
            💾 Сохранить тексты
          </button>
          <button onClick={handleServerImport} className="px-4 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 border border-orange-200 font-medium text-sm flex items-center gap-2 transition-colors">
            📂 Загрузить тексты
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-hidden min-h-0">
        <div className="overflow-y-auto pr-2">
          <RecipeBuilder 
            onRecipeCreated={handleRecipeSaved} 
            initialData={editingRecipe}
            onCancel={() => setEditingRecipe(null)}
          />
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden h-full">
          <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 shrink-0">
            Каталог блюд ({recipes.length})
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {Array.isArray(recipes) && recipes.map(recipe => (
              <div 
                key={recipe.id} 
                className={`p-4 rounded-lg border transition-all ${
                  editingRecipe?.id === recipe.id 
                    ? 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-300' 
                    : 'bg-white border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-gray-800">{recipe.title}</h4>
                    <div className="flex gap-2">
                        <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                          €{(recipe.total_cost || 0).toFixed(2)}
                        </span>
                        {/* ИЗМЕНЕНИЕ: Показываем ккал/100г, если они есть, иначе общие */}
                        <span className="text-xs font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100">
                          {recipe.calories_per_100g > 0 
                            ? `${recipe.calories_per_100g} ккал/100г` 
                            : `${recipe.total_calories} ккал (всего)`
                          }
                        </span>
                    </div>
                  </div>
                  
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                    {recipe.ingredients ? recipe.ingredients.length : 0} инг.
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[1.25rem]">
                  {recipe.description || "Нет описания"}
                </p>

                <div className="flex justify-end gap-2 border-t pt-2 border-gray-100">
                  <button 
                    onClick={() => { setEditingRecipe(recipe); }}
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
            
            {(!Array.isArray(recipes) || recipes.length === 0) && (
                <div className="text-center text-gray-400 mt-10">Список рецептов пуст</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipesPage;