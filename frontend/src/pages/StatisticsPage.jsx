import React from 'react';
import { useStatistics } from '../hooks/useStatistics';
import NutritionCard from '../components/stats/NutritionCard';
import DailyStatsTable from '../components/stats/DailyStatsTable';

const StatisticsPage = () => {
  const {
    users,
    selectedUser,
    setSelectedUser,
    loading,
    currentDate,
    setCurrentDate,
    changeWeek,
    stats,
    dailyLimit,
    getWeekRange,
    DAYS
  } = useStatistics();

  if (loading) return <div className="p-10 text-center text-gray-500">Загрузка статистики...</div>;

  return (
    <div className="container mx-auto max-w-5xl p-6 h-full overflow-y-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📊 Статистика питания</h1>
          <div className="flex items-center gap-3 mt-2 text-gray-600 font-medium">
            <button
              onClick={() => changeWeek(-1)}
              className="hover:text-gray-900 hover:bg-gray-100 p-1 rounded transition-colors text-lg"
              title="Предыдущая неделя"
            >
              ◀
            </button>
            <span className="bg-gray-100 px-3 py-1 rounded text-sm">
              {getWeekRange(currentDate).display}
            </span>
            <button
              onClick={() => changeWeek(1)}
              className="hover:text-gray-900 hover:bg-gray-100 p-1 rounded transition-colors text-lg"
              title="Следующая неделя"
            >
              ▶
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs text-blue-600 hover:underline ml-2"
            >
              Сегодня
            </button>
          </div>
        </div>

        {/* NUTRITION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { key: 'prot', title: 'Белки', color: 'blue', icon: '🥩' },
            { key: 'fat', title: 'Жиры', color: 'yellow', icon: '🧀' },
            { key: 'carb', title: 'Углеводы', color: 'red', icon: '🍞' }
          ].map(({ key, title, color, icon }) => (
            <NutritionCard
              key={key}
              title={title}
              value={stats.total[key]}
              limit={dailyLimit[key] * 7}
              color={color}
              icon={icon}
            />
          ))}
        </div>

        {/* User Filter */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-sm font-bold text-gray-400 pl-2">Пользователь:</span>
          <select
            className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="all">👨‍👩‍👧‍👦 Вся семья</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TOTAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <NutritionCard
          title="Общий бюджет"
          value={`€${stats.total.cost.toFixed(2)}`}
          unit="€"
          color="green"
          icon="€"
        />
        <NutritionCard
          title="Всего калорий"
          value={stats.total.cals}
          limit={dailyLimit.cals * 7}
          unit=""
          color="orange"
          icon="🔥"
        />
      </div>

      {/* DAILY CHART / LIST */}
      <h3 className="font-bold text-xl text-gray-700 mb-4">Детализация по дням</h3>

      <DailyStatsTable days={DAYS} stats={stats} dailyLimit={dailyLimit} />

      <div className="mt-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm text-gray-600">
        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">ℹ️ Справка по балансу БЖУ</h4>
        <p className="mb-2">Предупреждения в колонке "Инфо" появляются, если баланс нутриентов за день отклоняется от рекомендованных норм:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Белки:</strong> норма <span className="font-bold text-gray-700">15-20%</span> от общей калорийности (меньше — "Мало белков")</li>
          <li><strong>Жиры:</strong> норма <span className="font-bold text-gray-700">25-35%</span> от общей калорийности (отклонения — "Мало/Много жиров")</li>
          <li><strong>Углеводы:</strong> норма <span className="font-bold text-gray-700">50-55%</span> от общей калорийности (отклонения — "Мало/Много углеводов")</li>
        </ul>
      </div>
    </div>
  );
};

export default StatisticsPage;
