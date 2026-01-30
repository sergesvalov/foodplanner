import React from 'react';
import WeeklyGrid from '../components/WeeklyGrid';
import DraggableRecipeList from '../components/DraggableRecipeList';

const HomePage = () => {
  return (
    <div className="flex flex-row items-start bg-gray-100 relative">
      
      {/* Левая колонка - STICKY */}
      {/* top-16 компенсирует высоту Navbar (64px) */}
      {/* h-[calc(100vh-64px)] ограничивает высоту списка, чтобы внутри него был свой скролл, если рецептов много */}
      <div className="shrink-0 w-80 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto border-r border-gray-200 bg-white z-30">
        <DraggableRecipeList />
      </div>

      {/* Правая колонка - Таблица */}
      {/* Теперь она просто занимает оставшееся место и растет в высоту */}
      <div className="flex-1 p-4 min-w-0">
         <WeeklyGrid />
      </div>

    </div>
  );
};

export default HomePage;