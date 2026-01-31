import React from 'react';
import WeeklyGrid from '../components/WeeklyGrid';
import DraggableRecipeList from '../components/DraggableRecipeList';

const HomePage = () => {
  return (
    <div className="flex flex-row items-start bg-gray-100 relative min-h-screen">
      
      {/* Левая колонка - STICKY SIDEBAR */}
      {/* sticky: панель фиксируется при прокрутке */}
      {/* top-0 md:top-16: отступ сверху (учитывая Navbar, если он есть) */}
      {/* h-screen: высота панели ограничена экраном, чтобы внутри был свой скролл */}
      <div className="shrink-0 w-80 sticky top-0 md:top-16 h-screen md:h-[calc(100vh-64px)] overflow-y-auto border-r border-gray-200 bg-white z-30 hidden md:block">
        <DraggableRecipeList />
      </div>

      {/* Правая колонка - Основной контент */}
      {/* flex-1: занимает всё свободное место */}
      {/* min-w-0: предотвращает "распирание" flex-контейнера */}
      <div className="flex-1 p-4 min-w-0">
         <WeeklyGrid />
      </div>

    </div>
  );
};

export default HomePage;