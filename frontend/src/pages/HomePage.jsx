import React from 'react';
import WeeklyGrid from '../components/WeeklyGrid';
import DraggableRecipeList from '../components/DraggableRecipeList';

const HomePage = () => {
  return (
    // ИСПРАВЛЕНИЕ ЛЕЙАУТА:
    // Используем h-full, чтобы занять всё место внутри <main> (который flex-1 в App.jsx).
    // Больше никаких calc(100vh - 64px), так как это вызывало баги.
    <div className="flex flex-row items-stretch h-full bg-gray-100">
      
      {/* Левая колонка */}
      <div className="shrink-0 h-full">
        <DraggableRecipeList />
      </div>

      {/* Правая колонка */}
      <div className="flex-1 p-4 overflow-hidden h-full">
         <WeeklyGrid />
      </div>

    </div>
  );
};

export default HomePage;