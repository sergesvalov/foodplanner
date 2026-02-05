import React, { useState } from 'react';
import WeeklyGrid from '../components/WeeklyGrid';
import DraggableRecipeList from '../components/DraggableRecipeList';

const HomePage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedUser, setSelectedUser] = useState('all');

  const handleSavePlan = async () => {
    try {
      const res = await fetch('/api/plan/export');
      const data = await res.json();
      if (res.ok) alert("✅ " + data.message);
      else alert("❌ Ошибка: " + data.detail);
    } catch (err) { console.error(err); alert("Ошибка сети"); }
  };

  const handleAutoPlanWeek = async () => {
    if (!confirm("Спланировать обеды и ужины на СЛЕДУЮЩУЮ неделю?")) return;
    try {
      const res = await fetch('/api/plan/autofill_week', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert("✅ " + data.message);
        setRefreshKey(k => k + 1);
      } else {
        alert("❌ Ошибка: " + data.detail);
      }
    } catch (err) {
      alert("❌ Ошибка сети");
    }
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

  const handleAutoFillOne = async () => {
    try {
      const body = {};
      if (selectedUser !== 'all') {
        body.family_member_id = parseInt(selectedUser);
      }

      const res = await fetch('/api/plan/autofill_one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        // Убрали alert, чтобы не надоедал
        setRefreshKey(k => k + 1); // Обновляем сетку
      } else {
        alert("⚠️ " + data.detail);
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
          <h1 className="text-2xl font-bold text-gray-800">Неделя</h1>
          <div className="flex gap-2">
            <button
              onClick={handleAutoPlanWeek}
              className="px-3 py-1 bg-violet-100 text-violet-700 rounded hover:bg-violet-200 border border-violet-200 text-sm font-medium transition-colors flex items-center gap-1"
              title="Спланировать обеды и ужины на следующую неделю"
            >
              🔮 Спланировать
            </button>
            <button
              onClick={handleAutoFillOne}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 border border-purple-200 text-sm font-medium transition-colors flex items-center gap-1"
              title="Добавить случайный перекус на сегодня"
            >
              🧟 Дожрать
            </button>
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
          <WeeklyGrid key={refreshKey} selectedUser={selectedUser} onUserChange={setSelectedUser} />
        </div>
      </div>

    </div>
  );
};

export default HomePage;