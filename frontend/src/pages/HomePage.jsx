import React, { useState } from 'react';
import WeeklyGrid from '../components/WeeklyGrid';
import DraggableRecipeList from '../components/DraggableRecipeList';
import HomeToolbar from '../components/planning/HomeToolbar';
import { autofillWeek, autofillOne, exportPlan, importPlan } from '../api/plan';

const HomePage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedUser, setSelectedUser] = useState('all');

  const handleSavePlan = async () => {
    try {
      const data = await exportPlan();
      alert("✅ " + data.message);
    } catch (err) { console.error(err); alert("Ошибка: " + err.message); }
  };

  const handleAutoPlanWeek = async () => {
    if (!confirm("Спланировать обеды и ужины на СЛЕДУЮЩУЮ неделю?")) return;
    try {
      const data = await autofillWeek();
      alert("✅ " + data.message);
      setRefreshKey(k => k + 1);
    } catch (err) {
      alert("❌ Ошибка: " + err.message);
    }
  };

  const handleLoadPlan = async () => {
    if (!window.confirm("Загрузить сохраненный план? Текущий план будет перезаписан!")) return;
    try {
      const data = await importPlan();
      alert("✅ " + data.message);
      window.location.reload();
    } catch (err) { console.error(err); alert("Ошибка: " + err.message); }
  };

  const handleAutoFillOne = async () => {
    try {
      const body = {};
      if (selectedUser !== 'all') {
        body.family_member_id = parseInt(selectedUser);
      }

      const data = await autofillOne(body);
      if (data.warning) alert(data.warning);
      setRefreshKey(k => k + 1);
    } catch (err) { console.error(err); alert("Ошибка: " + err.message); }
  };

  return (
    <div className="flex flex-row items-start bg-gray-100 relative min-h-screen">

      {/* Левая колонка - STICKY SIDEBAR */}
      <div className="shrink-0 w-80 sticky top-0 md:top-16 h-screen md:h-[calc(100vh-64px)] overflow-y-auto border-r border-gray-200 bg-white z-30 hidden md:block">
        <DraggableRecipeList />
      </div>

      {/* Правая колонка - Основной контент */}
      <div className="flex-1 p-4 min-w-0 flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Неделя</h1>
          <HomeToolbar
            onAutoFillOne={handleAutoFillOne}
            onSave={handleSavePlan}
            onLoad={handleLoadPlan}
          />
        </div>
        <div className="flex-1 min-h-0">
          <WeeklyGrid key={refreshKey} selectedUser={selectedUser} onUserChange={setSelectedUser} />
        </div>
      </div>

    </div>
  );
};

export default HomePage;