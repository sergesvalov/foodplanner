import React, { useEffect, useState } from 'react';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const EXTRA_KEY = 'Вкусняшки';
const EXTRA_MEAL_TYPE = 'yummy';

const MEALS = [
  { id: 'takeaway', label: '🎒 Взять с собой', color: 'bg-teal-50 border-teal-100', isSnack: true },
  { id: 'pre_breakfast', label: 'Ранний старт', color: 'bg-orange-50 border-orange-100', isSnack: true },
  { id: 'breakfast', label: 'Завтрак', color: 'bg-yellow-50 border-yellow-100', isSnack: false },
  { id: 'morning_snack', label: '2-й завтрак', color: 'bg-purple-50 border-purple-100', isSnack: true },
  { id: 'lunch', label: 'Обед', color: 'bg-green-50 border-green-100', isSnack: false },
  { id: 'afternoon_snack', label: 'Полдник', color: 'bg-pink-50 border-pink-100', isSnack: true },
  { id: 'dinner', label: 'Ужин', color: 'bg-blue-50 border-blue-100', isSnack: false },
  { id: 'late_snack', label: 'Поздний ужин', color: 'bg-indigo-50 border-indigo-100', isSnack: true },
];

const WeeklyGrid = () => {
  const [plan, setPlan] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingDrop, setPendingDrop] = useState(null);

  const fetchPlan = () => {
    fetch('/api/plan/')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setPlan(data); else setPlan([]); })
      .catch(err => { console.error(err); setPlan([]); });
  };

  const fetchUsers = () => {
      fetch('/api/admin/family').then(res => res.json()).then(setUsers).catch(console.error);
  };

  useEffect(() => {
    fetchPlan();
    fetchUsers();
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-indigo-300', 'bg-white'); };
  const handleDragLeave = (e) => { e.currentTarget.classList.remove('ring-2', 'ring-indigo-300', 'bg-white'); };

  const handleDrop = (e, day, mealType) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-indigo-300', 'bg-white');
    const data = e.dataTransfer.getData('recipeData');
    if (!data) return;
    const recipe = JSON.parse(data);
    
    if (users.length === 0) confirmAdd(day, mealType, recipe.id, null);
    else setPendingDrop({ day, mealType, recipeId: recipe.id });
  };

  const confirmAdd = async (day, mealType, recipeId, userId) => {
    try {
        const res = await fetch('/api/plan/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                day_of_week: day,
                meal_type: mealType,
                recipe_id: recipeId,
                portions: 1,
                family_member_id: userId
            })
        });
        if (res.ok) fetchPlan();
    } catch (err) { console.error(err); }
    setPendingDrop(null);
  };

  const handleRemove = async (itemId) => {
    if (!window.confirm("Удалить?")) return;
    await fetch(`/api/plan/${itemId}`, { method: 'DELETE' }); fetchPlan();
  };

  const handlePortionChange = async (itemId, newPortions) => {
    // ИЗМЕНЕНИЕ: Лимит увеличен до 20
    if (newPortions < 1 || newPortions > 20) return;
    setPlan(plan.map(item => item.id === itemId ? { ...item, portions: parseInt(newPortions) } : item));
    try {
        await fetch(`/api/plan/${itemId}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ portions: parseInt(newPortions) }) });
    } catch (e) { fetchPlan(); }
  };

  const calculateItemStats = (item) => {
      const recipe = item.recipe;
      if (!recipe) return { cost: 0, cals: 0 };
      const ratio = (item.portions || 1) / (recipe.portions || 1);
      return { cost: (recipe.total_cost || 0) * ratio, cals: Math.round((recipe.total_calories || 0) * ratio) };
  };

  const weeklyStats = plan.reduce((acc, item) => {
      const s = calculateItemStats(item);
      return { cost: acc.cost + s.cost, cals: acc.cals + s.cals };
  }, { cost: 0, cals: 0 });

  const ALL_COLUMNS = [...DAYS, EXTRA_KEY];

  return (
    <div className="w-full flex flex-col bg-gray-100 rounded-lg border border-gray-300 relative h-auto shadow-sm">
      
      {pendingDrop && (
          <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Кто будет это есть?</h3>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                      {users.map(u => (
                          <button key={u.id} onClick={() => confirmAdd(pendingDrop.day, pendingDrop.mealType, pendingDrop.recipeId, u.id)}
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left group">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase bg-${u.color}-500 shadow-sm`}>{u.name[0]}</div>
                              <span className="font-medium text-gray-700">{u.name}</span>
                          </button>
                      ))}
                      <button onClick={() => confirmAdd(pendingDrop.day, pendingDrop.mealType, pendingDrop.recipeId, null)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 hover:bg-gray-50 text-left">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">?</div>
                          <span className="font-medium text-gray-500">Общее (Без имени)</span>
                      </button>
                  </div>
                  <button onClick={() => setPendingDrop(null)} className="mt-4 w-full py-2 text-gray-500 hover:bg-gray-100 rounded text-sm font-medium">Отмена</button>
              </div>
          </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-3 border-b border-gray-200 flex justify-between items-center shadow-sm z-20 rounded-t-lg">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">📅 План питания <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{plan.length} блюд</span></h2>
          <div className="flex gap-4">
              <div className="flex flex-col items-end"><span className="text-[10px] text-gray-400 uppercase font-bold">Бюджет</span><span className="text-lg font-bold text-green-600 leading-none">€{weeklyStats.cost.toFixed(2)}</span></div>
              <div className="flex flex-col items-end"><span className="text-[10px] text-gray-400 uppercase font-bold">Калории</span><span className="text-lg font-bold text-orange-600 leading-none">{weeklyStats.cals}</span></div>
          </div>
      </div>

      {/* GRID */}
      <div className="overflow-x-auto overflow-y-visible">
        <div className="grid grid-cols-8 divide-x divide-gray-300 min-w-[1200px]">
            {ALL_COLUMNS.map((col) => {
            const isExtra = col === EXTRA_KEY;
            const items = plan.filter(p => p.day_of_week === col);
            const stats = items.reduce((acc, i) => { const s = calculateItemStats(i); return { cost: acc.cost + s.cost, cals: acc.cals + s.cals }; }, { cost: 0, cals: 0 });

            return (
                <div key={col} className={`flex flex-col h-auto relative group min-w-0 ${isExtra ? 'bg-indigo-50/30' : 'bg-white'}`}>
                
                <div className={`py-2 flex flex-col items-center justify-center border-b border-gray-600 gap-1 ${isExtra ? 'bg-indigo-700' : 'bg-gray-800'}`}>
                    <span className="font-bold text-xs uppercase tracking-wider text-white">{isExtra ? '🍪 Вкусняшки' : col}</span>
                    <div className="flex gap-1">
                        <div className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${items.length>0 ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>€{stats.cost.toFixed(2)}</div>
                        <div className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${items.length>0 ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}`}>{stats.cals}</div>
                    </div>
                </div>
                
                <div className="p-1 space-y-1 h-full">
                    {isExtra ? (
                        <div className="min-h-[300px] h-full border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/50 flex flex-col p-2 gap-2 hover:bg-indigo-100/50"
                            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, col, EXTRA_MEAL_TYPE)}>
                            {items.map(item => <PlanItemCard key={item.id} item={item} onRemove={handleRemove} onPortionChange={handlePortionChange} calculateStats={calculateItemStats} />)}
                        </div>
                    ) : (
                        MEALS.map((meal) => {
                            const slotItems = plan.filter(p => p.day_of_week === col && p.meal_type === meal.id);
                            const isCompact = meal.isSnack && slotItems.length === 0;
                            return (
                            <div key={meal.id} className={`relative rounded border ${meal.color} ${isCompact ? 'h-8 opacity-50 hover:opacity-100 hover:h-auto border-dashed flex items-center justify-center' : 'min-h-[80px] pb-1 shadow-sm'}`}
                                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, col, meal.id)}>
                                {isCompact ? <span className="text-[9px] text-gray-400 uppercase font-bold">+ {meal.label}</span> : <div className="text-[9px] font-bold uppercase px-1.5 py-1 text-gray-500/80 mb-0.5">{meal.label}</div>}
                                {!isCompact && <div className="px-1 space-y-1">{slotItems.map(item => <PlanItemCard key={item.id} item={item} onRemove={handleRemove} onPortionChange={handlePortionChange} calculateStats={calculateItemStats} />)}</div>}
                            </div>
                            );
                        })
                    )}
                    <div className="h-10"></div>
                </div>
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};

const PlanItemCard = ({ item, onRemove, onPortionChange, calculateStats }) => {
    if (!item.recipe) return null;
    const stats = calculateStats(item);
    const base = item.recipe.portions || 1;
    const u = item.family_member;

    return (
        <div className={`relative flex flex-col bg-white rounded border border-gray-200 shadow-sm p-1.5 group/item hover:border-indigo-300 ${u ? `border-l-4 border-l-${u.color}-500` : ''}`}>
            <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover/item:opacity-100 shadow-sm hover:bg-red-500 hover:text-white z-20">×</button>
            <span className="text-[11px] text-gray-800 font-medium leading-tight line-clamp-2" title={item.recipe.title}>{item.recipe.title}</span>
            {u && <div className={`text-[9px] px-1 rounded-sm inline-block mt-0.5 font-bold text-white bg-${u.color}-500 self-start`}>{u.name}</div>}
            <div className="flex items-center gap-1 mt-1 bg-gray-50 rounded px-1 py-0.5 justify-between">
                <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-400">Порц:</span>
                    {/* ИЗМЕНЕНИЕ: max="20" */}
                    <input type="number" min="1" max="20" className="w-6 h-4 text-[10px] font-bold text-center border rounded" value={item.portions || 1} onClick={(e)=>e.stopPropagation()} onChange={(e)=>onPortionChange(item.id, e.target.value)} />
                </div>
                {base > 1 && <span className="text-[8px] text-gray-400">(из {base})</span>}
            </div>
            <div className="flex justify-between items-end mt-1"><span className="text-[9px] text-green-600 font-bold">€{stats.cost.toFixed(2)}</span><span className="text-[9px] text-orange-600">{stats.cals}</span></div>
        </div>
    );
};

export default WeeklyGrid;