import React from 'react';
import WeeklyGrid from '../components/WeeklyGrid';
import DraggableRecipeList from '../components/DraggableRecipeList';

const HomePage = () => {
  const handleSavePlan = async () => {
    try {
      const res = await fetch('/api/plan/export');
      const data = await res.json();
      if (res.ok) alert("✅ " + data.message);
      else alert("❌ Ошибка: " + data.detail);
    } catch (err) { console.error(err); alert("Ошибка сети"); }
  };

  const handleLoadPlan = async () => {
    if (!window.confirm("Загрузить сохраненный план? Текущий план будет перезаписан!")) return;
    try {
      const res = await fetch('/api/plan/import', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert("✅ " + data.message);
        window.location.reload(); // Простой способ обновить сетку
      } else {
        alert("❌ Ошибка: " + data.detail);
      }
    } catch (err) { console.error(err); alert("Ошибка сети"); }
  };

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
      <div className="flex-1 p-4 min-w-0 flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">План на неделю</h1>
          <div className="flex gap-2">
            <button
              onClick={handleSavePlan}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 border border-indigo-200 text-sm font-medium transition-colors"
            >
              💾 Сохранить план
            </button>
            <button
              onClick={handleLoadPlan}
              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 border border-green-200 text-sm font-medium transition-colors"
            >
              📂 Загрузить план
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <WeeklyGrid />
        </div>
      </div>

    </div>
  );
};

export default HomePage;