import React, { useState } from 'react';
import WeeklyGrid from '../components/WeeklyGrid';
import DraggableRecipeList from '../components/DraggableRecipeList';

const HomePage = () => {
  // refreshTrigger нужен, чтобы обновить список, если мы удалили что-то (опционально)
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)] overflow-hidden">
      {/* Боковая панель: Источник рецептов */}
      <div className="w-full md:w-1/4 min-w-[250px] flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-3 bg-gray-50 border-b font-semibold text-gray-700">
          📚 Доступные рецепты
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-xs text-gray-500 mb-2 px-1">
            Перетащите карточку в нужный день недели.
          </p>
          <DraggableRecipeList refreshTrigger={refreshKey} />
        </div>
      </div>

      {/* Основная часть: Сетка расписания */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow border border-gray-200 p-4">
        <WeeklyGrid />
      </div>
    </div>
  );
};

export default HomePage;