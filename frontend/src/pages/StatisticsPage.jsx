import React, { useState, useEffect, useMemo } from 'react';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

const StatisticsPage = () => {
  const [plan, setPlan] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('all');
  const [loading, setLoading] = useState(true);

  // 1. Загрузка данных
  useEffect(() => {
    Promise.all([
      fetch('/api/plan/').then(res => res.json()),
      fetch('/api/admin/family').then(res => res.json())
    ])
    .then(([planData, usersData]) => {
      setPlan(Array.isArray(planData) ? planData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  // 2. Логика расчета стоимости одной позиции (дублируем логику из WeeklyGrid)
  const calculateItemStats = (item) => {
    const recipe = item.recipe;
    if (!recipe) return { cost: 0, cals: 0 };
    
    const basePortions = recipe.portions || 1;
    const targetPortions = item.portions || 1;
    const ratio = targetPortions / basePortions;

    return { 
      cost: (recipe.total_cost || 0) * ratio, 
      cals: Math.round((recipe.total_calories || 0) * ratio) 
    };
  };

  // 3. Агрегация данных
  const stats = useMemo(() => {
    const dailyStats = {};
    let totalCost = 0;
    let totalCals = 0;

    // Инициализируем нулями
    DAYS.forEach(day => {
      dailyStats[day] = { cost: 0, cals: 0, itemsCount: 0 };
    });

    plan.forEach(item => {
      // Фильтрация по пользователю
      if (selectedUser !== 'all') {
        // Если у записи нет владельца (null), она считается общей (показываем только если выбрано 'all' или логика "общих" блюд)
        // В данном случае, если фильтр включен, показываем только то, что привязано к user_id
        if (item.family_member_id !== parseInt(selectedUser)) return;
      }

      if (dailyStats[item.day_of_week]) {
        const { cost, cals } = calculateItemStats(item);
        dailyStats[item.day_of_week].cost += cost;
        dailyStats[item.day_of_week].cals += cals;
        dailyStats[item.day_of_week].itemsCount += 1;
        
        totalCost += cost;
        totalCals += cals;
      }
    });

    return { daily: dailyStats, total: { cost: totalCost, cals: totalCals } };
  }, [plan, selectedUser]);

  if (loading) return <div className="p-10 text-center text-gray-500">Загрузка статистики...</div>;

  return (
    <div className="container mx-auto max-w-5xl p-6 h-full overflow-y-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📊 Статистика питания</h1>
          <p className="text-gray-500">Анализ расходов и калорийности за неделю</p>
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center justify-between relative overflow-hidden">
           <div className="z-10">
             <div className="text-sm font-bold text-green-600 uppercase tracking-wider mb-1">Общий бюджет</div>
             <div className="text-4xl font-extrabold text-gray-800">€{stats.total.cost.toFixed(2)}</div>
             <div className="text-xs text-gray-400 mt-2">за текущую неделю</div>
           </div>
           <div className="absolute -right-6 -bottom-6 text-9xl text-green-50 opacity-50 select-none">€</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between relative overflow-hidden">
           <div className="z-10">
             <div className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-1">Всего калорий</div>
             <div className="text-4xl font-extrabold text-gray-800">{stats.total.cals}</div>
             <div className="text-xs text-gray-400 mt-2">за текущую неделю</div>
           </div>
           <div className="absolute -right-6 -bottom-6 text-9xl text-orange-50 opacity-50 select-none">🔥</div>
        </div>
      </div>

      {/* DAILY CHART / LIST */}
      <h3 className="font-bold text-xl text-gray-700 mb-4">Детализация по дням</h3>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">День недели</th>
                <th className="px-6 py-4">Блюд</th>
                <th className="px-6 py-4">Калории</th>
                <th className="px-6 py-4">Стоимость</th>
                <th className="px-6 py-4 hidden md:table-cell">Инфо</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DAYS.map(day => {
                const dayStat = stats.daily[day];
                const isZero = dayStat.itemsCount === 0;
                
                // Простейшая визуализация (процент от макс. калорий за неделю для примера, или просто бар)
                const maxCalsPerDay = 3000; // Условная норма для визуальной шкалы
                const widthPercent = Math.min((dayStat.cals / maxCalsPerDay) * 100, 100);

                return (
                  <tr key={day} className={`hover:bg-gray-50 transition-colors ${isZero ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 font-bold text-gray-700">
                      {day}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {dayStat.itemsCount > 0 ? (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">
                          {dayStat.itemsCount}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`font-bold ${dayStat.cals > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                          {dayStat.cals} ккал
                        </span>
                        {/* Visual Bar */}
                        {dayStat.cals > 0 && (
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400" style={{ width: `${widthPercent}%` }}></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-green-700">
                      {dayStat.cost > 0 ? `€${dayStat.cost.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 hidden md:table-cell">
                      {dayStat.itemsCount > 0 && selectedUser === 'all' && (
                         "Суммарно на семью"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;