import React, { useState } from 'react';
import WeeklyGrid from './components/WeeklyGrid';
import RecipeBuilder from './components/RecipeBuilder';
import DraggableRecipeList from './components/DraggableRecipeList';

function App() {
  // Состояние-триггер: когда создаем рецепт, обновляем список слева
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRecipeCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col h-screen">
      <header className="bg-white shadow p-4 z-10 shrink-0">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold text-indigo-600">Menu Planner (Docker Edition)</h1>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto p-4 flex gap-4 overflow-hidden">
        {/* ЛЕВАЯ КОЛОНКА: Конструктор + Список */}
        <div className="w-[300px] shrink-0 flex flex-col gap-4 overflow-hidden h-full">
            <div className="shrink-0">
                <RecipeBuilder onRecipeCreated={handleRecipeCreated} />
            </div>
            <div className="flex-1 overflow-hidden">
                <DraggableRecipeList refreshTrigger={refreshKey} />
            </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Сетка календаря */}
        <div className="flex-1 overflow-y-auto pb-10">
            <WeeklyGrid />
        </div>
      </main>
    </div>
  );
}

export default App;