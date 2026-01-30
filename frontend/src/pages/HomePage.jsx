import React from 'react';
import WeeklyGrid from '../components/WeeklyGrid';
import DraggableRecipeList from '../components/DraggableRecipeList';

const HomePage = () => {
  return (
    // Добавил min-h-0 (хотя flex-1 overflow-hidden должно работать, но так надежнее)
    <div className="flex flex-row items-stretch h-full bg-gray-100">
      
      {/* Левая колонка */}
      <div className="shrink-0 h-full">
        <DraggableRecipeList />
      </div>

      {/* Правая колонка */}
      <div className="flex-1 p-4 overflow-hidden h-full min-h-0">
         <WeeklyGrid />
      </div>

    </div>
  );
};

export default HomePage;