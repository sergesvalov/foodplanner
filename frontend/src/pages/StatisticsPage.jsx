import React, { useState, useEffect, useMemo } from 'react';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

const StatisticsPage = () => {
  const [plan, setPlan] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('all');
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper: Получить диапазон дат недели (Пн-Вс)
  const getWeekRange = (baseDate) => {
    const currentDay = baseDate.getDay();
    const dayIndex = currentDay === 0 ? 6 : currentDay - 1; // 0=Mon, 6=Sun

    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - dayIndex);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const fmt = (d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${yyyy}-${mm}-${dd}`;
    };

    const fmtDisplay = (d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}.${mm}`;
    };

    return {
      start: fmt(start),
      end: fmt(end),
      display: `${fmtDisplay(start)} - ${fmtDisplay(end)}`
    };
  };

  const changeWeek = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentDate(newDate);
  };

  // 1. Загрузка данных
  useEffect(() => {
    setLoading(true);
    const { start, end } = getWeekRange(currentDate);

    Promise.all([
      fetch(`/api/plan/?start_date=${start}&end_date=${end}`).then(res => res.json()),
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
  }, [currentDate]);

  // 2. Логика расчета стоимости одной позиции
  const calculateItemStats = (item) => {
    const recipe = item.recipe;
    if (!recipe) return { cost: 0, cals: 0, prot: 0, fat: 0, carb: 0 };

    const basePortions = recipe.portions || 1;
    const targetPortions = item.portions || 1;
    const ratio = targetPortions / basePortions;

    return {
      cost: (recipe.total_cost || 0) * ratio,
      cals: Math.round((recipe.total_calories || 0) * ratio),
      prot: Math.round((recipe.total_proteins || 0) * ratio),
      fat: Math.round((recipe.total_fats || 0) * ratio),
      carb: Math.round((recipe.total_carbs || 0) * ratio)
    };
  };

  // 3. Агрегация данных
  const stats = useMemo(() => {
    const dailyStats = {};
    let totalCost = 0;
    let totalCals = 0;
    let totalProt = 0;
    let totalFat = 0;
    let totalCarb = 0;

    // Инициализируем нулями
    DAYS.forEach(day => {
      dailyStats[day] = { cost: 0, cals: 0, prot: 0, fat: 0, carb: 0, itemsCount: 0 };
    });

    plan.forEach(item => {
      // Фильтрация по пользователю
      if (selectedUser !== 'all') {
        if (item.family_member_id !== parseInt(selectedUser)) return;
      }

      if (dailyStats[item.day_of_week]) {
        const { cost, cals, prot, fat, carb } = calculateItemStats(item);
        dailyStats[item.day_of_week].cost += cost;
        dailyStats[item.day_of_week].cals += cals;
        dailyStats[item.day_of_week].prot += prot;
        dailyStats[item.day_of_week].fat += fat;
        dailyStats[item.day_of_week].carb += carb;
        dailyStats[item.day_of_week].itemsCount += 1;

        totalCost += cost;
        totalCals += cals;
        totalProt += prot;
        totalFat += fat;
        totalCarb += carb;
      }
    });

    return {
      daily: dailyStats,
      total: {
        cost: totalCost,
        cals: totalCals,
        prot: totalProt,
        fat: totalFat,
        carb: totalCarb
      }
    };
  }, [plan, selectedUser]);

  // 4. НОВОЕ: Расчет дневного лимита калорий и БЖУ
  const dailyLimit = useMemo(() => {
    // Дефолтные значения
    const defaults = { cals: 2000, prot: 135, fat: 100, carb: 300 };

    if (selectedUser === 'all') {
      const res = { cals: 0, prot: 0, fat: 0, carb: 0 };
      if (users.length === 0) return { cals: defaults.cals * 2, prot: defaults.prot * 2, fat: defaults.fat * 2, carb: defaults.carb * 2 }; // Fallback

      users.forEach(u => {
        res.cals += (u.max_calories || defaults.cals);
        res.prot += (u.max_proteins || defaults.prot);
        res.fat += (u.max_fats || defaults.fat);
        res.carb += (u.max_carbs || defaults.carb);
      });
      return res;
    } else {
      const user = users.find(u => u.id === parseInt(selectedUser));
      if (!user) return defaults;
      return {
        cals: user.max_calories || defaults.cals,
        prot: user.max_proteins || defaults.prot,
        fat: user.max_fats || defaults.fat,
        carb: user.max_carbs || defaults.carb
      };
    }
  }, [users, selectedUser]);

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
          <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between relative overflow-hidden">
            <div className="z-10">
              <div className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-1">Белки</div>
              <div className="text-3xl font-extrabold text-gray-800">
                {stats.total.prot} <span className="text-lg text-gray-500 font-medium">/ {dailyLimit.prot * 7}г</span>
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1">Факт / Лимит</div>
            </div>
            <div className="absolute -right-4 -bottom-4 text-8xl text-blue-50 opacity-20 grayscale select-none">🥩</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-100 flex items-center justify-between relative overflow-hidden">
            <div className="z-10">
              <div className="text-sm font-bold text-yellow-600 uppercase tracking-wider mb-1">Жиры</div>
              <div className="text-3xl font-extrabold text-gray-800">
                {stats.total.fat} <span className="text-lg text-gray-500 font-medium">/ {dailyLimit.fat * 7}г</span>
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1">Факт / Лимит</div>
            </div>
            <div className="absolute -right-4 -bottom-4 text-8xl text-yellow-50 opacity-20 grayscale select-none">🧀</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex items-center justify-between relative overflow-hidden">
            <div className="z-10">
              <div className="text-sm font-bold text-red-600 uppercase tracking-wider mb-1">Углеводы</div>
              <div className="text-3xl font-extrabold text-gray-800">
                {stats.total.carb} <span className="text-lg text-gray-500 font-medium">/ {dailyLimit.carb * 7}г</span>
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1">Факт / Лимит</div>
            </div>
            <div className="absolute -right-4 -bottom-4 text-8xl text-red-50 opacity-20 grayscale select-none">🍞</div>
          </div>
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
          <div className="absolute -right-6 -bottom-6 text-9xl text-green-50 opacity-20 grayscale select-none">€</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between relative overflow-hidden">
          <div className="z-10">
            <div className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-1">Всего калорий</div>
            <div className="text-4xl font-extrabold text-gray-800">{stats.total.cals}</div>
            <div className="text-xs text-gray-400 mt-2">
              за текущую неделю (Цель: ~{dailyLimit.cals * 7})
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 text-9xl text-orange-50 opacity-20 grayscale select-none">🔥</div>
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
                <th className="px-6 py-4">Калории / Лимит</th>
                <th className="px-2 py-4 text-center">Б</th>
                <th className="px-2 py-4 text-center">Ж</th>
                <th className="px-2 py-4 text-center">У</th>
                <th className="px-6 py-4">Стоимость</th>
                <th className="px-6 py-4 hidden md:table-cell">Инфо</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DAYS.map(day => {
                const dayStat = stats.daily[day];
                const isZero = dayStat.itemsCount === 0;

                // Расчет процента заполнения и цвета
                const percent = Math.min((dayStat.cals / dailyLimit.cals) * 100, 100);
                const isOverLimit = dayStat.cals > dailyLimit.cals;

                // Percentages for nutrients
                const protPercent = dailyLimit.prot > 0 ? Math.min((dayStat.prot / dailyLimit.prot) * 100, 100) : 0;
                const fatPercent = dailyLimit.fat > 0 ? Math.min((dayStat.fat / dailyLimit.fat) * 100, 100) : 0;
                const carbPercent = dailyLimit.carb > 0 ? Math.min((dayStat.carb / dailyLimit.carb) * 100, 100) : 0;

                // Цвета текста и полоски
                const textColorClass = dayStat.cals > 0
                  ? (isOverLimit ? 'text-red-600' : 'text-green-600')
                  : 'text-gray-300';

                const barColorClass = isOverLimit ? 'bg-red-500' : 'bg-green-500';

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
                    <td className="px-6 py-4 w-1/3">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-end">
                          <span className={`font-bold ${textColorClass}`}>
                            {dayStat.cals} ккал
                          </span>
                          <span className="text-xs text-gray-400">
                            из {dailyLimit.cals}
                          </span>
                        </div>
                        {/* Visual Bar */}
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${barColorClass}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right bg-blue-50/30 align-middle">
                      <div className="text-blue-600 font-medium">
                        {dayStat.prot} <span className="text-blue-300 text-xs">/ {dailyLimit.prot}</span>
                      </div>
                      <div className="w-full h-1.5 bg-blue-200/50 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${protPercent}%` }}></div>
                      </div>
                    </td>
                    <td className="p-3 text-right bg-yellow-50/30 align-middle">
                      <div className="text-yellow-600 font-medium">
                        {dayStat.fat} <span className="text-yellow-300 text-xs">/ {dailyLimit.fat}</span>
                      </div>
                      <div className="w-full h-1.5 bg-yellow-200/50 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${fatPercent}%` }}></div>
                      </div>
                    </td>
                    <td className="p-3 text-right bg-red-50/30 align-middle">
                      <div className="text-red-600 font-medium">
                        {dayStat.carb} <span className="text-red-300 text-xs">/ {dailyLimit.carb}</span>
                      </div>
                      <div className="w-full h-1.5 bg-red-200/50 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${carbPercent}%` }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-green-700">
                      {dayStat.cost > 0 ? `€${dayStat.cost.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 hidden md:table-cell">
                      {isOverLimit && dayStat.cals > 0 && (
                        <div className="text-red-500 font-bold">Превышение!</div>
                      )}
                      {/* Ratio Check: 2 Fat : 3 Carb */}
                      {dayStat.itemsCount > 0 && Math.abs(dayStat.fat * 3 - dayStat.carb * 2) > 5 && (
                        <div className="text-orange-500 font-bold">проблема бжу</div>
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