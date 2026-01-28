import React, { useState } from 'react';
import RecipeBuilder from '../components/RecipeBuilder';
import DraggableRecipeList from '../components/DraggableRecipeList'; 

const RecipesPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRecipeCreated = () => {
    // Обновляем список после создания
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto max-w-5xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Управление рецептами</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Колонка 1: Конструктор */}
        <div>
          <RecipeBuilder onRecipeCreated={handleRecipeCreated} />
        </div>

        {/* Колонка 2: Список существующих (для просмотра) */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="font-bold text-lg mb-4 text-gray-700">Каталог блюд</h3>
          <div className="h-[500px] overflow-y-auto pr-2">
             {/* Используем тот же компонент списка, но здесь он просто для отображения */}
             <DraggableRecipeList refreshTrigger={refreshKey} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default RecipesPage;