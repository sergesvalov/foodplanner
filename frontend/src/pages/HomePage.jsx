import React from 'react';
import WeeklyGrid from '../components/WeeklyGrid';
import DraggableRecipeList from '../components/DraggableRecipeList';

const HomePage = () => {
  return (
    // ИЗМЕНЕНИЯ:
    // Было: h-[calc(100vh-64px)] overflow-hidden
    // Стало: min-h-[calc(100vh-64px)] (без overflow-hidden)
    // Это позволяет странице расти вниз, и появляется общий скролл браузера.
    <div className="flex flex-row items-stretch min-h-[calc(100vh-64px)] bg-gray-100">
      
      {/* Левая колонка (Список рецептов) */}
      <div className="shrink-0">
        <DraggableRecipeList />
      </div>

      {/* Правая колонка (Сетка недели) */}
      {/* flex-1 заставляет сетку занимать все оставшееся место */}
      <div className="flex-1 p-4 overflow-hidden">
         <WeeklyGrid />
      </div>

    </div>
  );
};

export default HomePage;