import React, { useEffect, useState } from 'react';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const EXTRA_KEY = 'Вкусняшки'; // Название "дня" для базы данных
const EXTRA_MEAL_TYPE = 'yummy'; // Тип приема пищи для базы

const MEALS = [
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

  const fetchPlan = () => {
    fetch('/api/plan/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPlan(data);
        else setPlan([]);
      })
      .catch(err => {
        console.error(err);
        setPlan([]);
      });
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('ring-2', 'ring-indigo-300', 'bg-white');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('ring-2', 'ring-indigo-300', 'bg-white');
  };

  const handleDrop = async (e, day, mealType) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-indigo-300', 'bg-white');
    const data = e.dataTransfer.getData('recipeData');
    if (!data) return;
    
    try {
        const recipe = JSON.parse(data);
        const res = await fetch('/api/plan/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                day_of_week: day,
                meal_type: mealType,
                recipe_id: recipe.id,
                portions: 1
            })
        });
        if (res.ok) fetchPlan();
    } catch (err) { console.error(err); }
  };

  const handleRemove = async (itemId) => {
    if (!window.confirm("Удалить блюдо из расписания?")) return;
    await fetch(`/api/plan/${itemId}`, { method: 'DELETE' });
    fetchPlan();
  };

  const handlePortionChange = async (itemId, newPortions) => {
    if (newPortions < 1 || newPortions > 10) return;
    
    const updatedPlan = plan.map(item => 
        item.id === itemId ? { ...item, portions: parseInt(newPortions) } : item
    );
    setPlan(updatedPlan);

    try {
        await fetch(`/api/plan/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portions: parseInt(newPortions) })
        });
    } catch (e) {
        console.error(e);
        fetchPlan();
    }
  };

  // --- РАСЧЕТЫ ---
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

  // ИТОГО ЗА ВСЮ НЕДЕЛЮ (Включая вкусняшки)
  const weeklyStats = plan.reduce((acc, item) => {
      const stats = calculateItemStats(item);
      return { cost: acc.cost + stats.cost, cals: acc.cals + stats.cals };
  }, { cost: 0, cals: 0 });

  // Список колонок: 7 дней + 1 колонка Вкусняшки
  const ALL_COLUMNS = [...DAYS, EXTRA_KEY];

  return (
    <div className="h-full w-full flex flex-col bg-gray-100 rounded-lg border border-gray-300">
      
      {/* --- СВОДКА ЗА НЕДЕЛЮ --- */}
      <div className="bg-white p-3 border-b border-gray-200 flex justify-between items-center shadow-sm z-20">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            📅 План питания
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {plan.length} блюд
            </span>
          </h2>
          <div className="flex gap-4">
              <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Бюджет недели</span>
                  <span className="text-lg font-bold text-green-600 leading-none">€{weeklyStats.cost.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Калории недели</span>
                  <span className="text-lg font-bold text-orange-600 leading-none">{weeklyStats.cals}</span>
              </div>
          </div>
      </div>

      {/* --- СЕТКА --- */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="grid grid-cols-8 h-full min-w-[1200px] divide-x divide-gray-300">
            
            {ALL_COLUMNS.map((columnKey) => {
            const isExtra = columnKey === EXTRA_KEY; // Это колонка вкусняшек?
            const colItems = plan.filter(p => p.day_of_week === columnKey);
            
            // Статистика колонки
            const colStats = colItems.reduce((acc, item) => {
                const stats = calculateItemStats(item);
                return { cost: acc.cost + stats.cost, cals: acc.cals + stats.cals };
            }, { cost: 0, cals: 0 });

            const hasData = colItems.length > 0;

            return (
                <div key={columnKey} className={`flex flex-col h-full relative group min-w-0 ${isExtra ? 'bg-indigo-50/30' : 'bg-white'}`}>
                
                {/* Шапка колонки */}
                <div className={`py-2 flex flex-col items-center justify-center shadow-md z-10 shrink-0 border-b border-gray-600 gap-1 ${isExtra ? 'bg-indigo-700' : 'bg-gray-800'}`}>
                    <span className="font-bold text-xs uppercase tracking-wider text-white">
                        {isExtra ? '🍪 Вкусняшки' : columnKey}
                    </span>
                    <div className="flex gap-1">
                        <div className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            hasData ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                        }`}>
                        €{colStats.cost.toFixed(2)}
                        </div>
                        <div className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            hasData ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'
                        }`}>
                        {colStats.cals}
                        </div>
                    </div>
                </div>

                {/* Тело колонки */}
                <div className="flex-1 overflow-y-auto p-1 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 min-h-0">
                    
                    {isExtra ? (
                        // === ВЕРСТКА ДЛЯ ВКУСНЯШЕК (Одна большая зона) ===
                        <div 
                            className="h-full min-h-[200px] border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/50 flex flex-col p-2 gap-2 transition-colors hover:bg-indigo-100/50 hover:border-indigo-300"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, columnKey, EXTRA_MEAL_TYPE)}
                        >
                            {colItems.length === 0 && (
                                <div className="flex-1 flex items-center justify-center text-center opacity-30 pointer-events-none">
                                    <div className="text-xs font-bold text-indigo-800 uppercase">Перетащите<br/>сюда<br/>дополнительные<br/>продукты</div>
                                </div>
                            )}

                            {colItems.map(item => (
                                <PlanItemCard 
                                    key={item.id} 
                                    item={item} 
                                    onRemove={handleRemove} 
                                    onPortionChange={handlePortionChange}
                                    calculateStats={calculateItemStats}
                                />
                            ))}
                        </div>
                    ) : (
                        // === ВЕРСТКА ДЛЯ ОБЫЧНЫХ ДНЕЙ (По приемам пищи) ===
                        <>
                            {MEALS.map((meal) => {
                                const itemsInSlot = plan.filter(p => p.day_of_week === columnKey && p.meal_type === meal.id);
                                const isCompact = meal.isSnack && itemsInSlot.length === 0;

                                return (
                                <div 
                                    key={meal.id} 
                                    className={`
                                    relative rounded transition-all duration-200 border
                                    ${meal.color}
                                    ${isCompact 
                                        ? 'h-6 opacity-50 hover:opacity-100 hover:h-auto border-dashed border-gray-300 flex items-center justify-center cursor-default' 
                                        : 'min-h-[60px] pb-1 shadow-sm'}
                                    `}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, columnKey, meal.id)}
                                >
                                    {isCompact ? (
                                        <span className="text-[9px] text-gray-400 uppercase font-bold select-none">+ {meal.label}</span>
                                    ) : (
                                        <div className="text-[9px] font-bold uppercase px-1.5 py-1 text-gray-500/80 mb-0.5 select-none">
                                        {meal.label}
                                        </div>
                                    )}

                                    {!isCompact && (
                                    <div className="px-1 space-y-1">
                                        {itemsInSlot.map(item => (
                                            <PlanItemCard 
                                                key={item.id} 
                                                item={item} 
                                                onRemove={handleRemove} 
                                                onPortionChange={handlePortionChange}
                                                calculateStats={calculateItemStats}
                                            />
                                        ))}
                                    </div>
                                    )}
                                </div>
                                );
                            })}
                        </>
                    )}
                    
                    <div className="h-8"></div>
                </div>
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};

// Вынес карточку блюда в отдельный компонент для чистоты кода
const PlanItemCard = ({ item, onRemove, onPortionChange, calculateStats }) => {
    if (!item.recipe) return null;
                                  
    const stats = calculateStats(item);
    const basePortions = item.recipe.portions || 1;

    return (
        <div className="relative flex flex-col bg-white rounded border border-gray-200 shadow-sm p-1.5 group/item hover:border-indigo-300 transition-colors">
            <button 
                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover/item:opacity-100 shadow-sm hover:bg-red-500 hover:text-white transition-all z-20"
            >
                ×
            </button>
            
            <div className="flex justify-between items-start">
                <span className="text-[11px] text-gray-800 font-medium leading-tight line-clamp-2 w-full" title={item.recipe.title}>
                    {item.recipe.title}
                </span>
            </div>
            
            <div className="flex items-center gap-1 mt-1 bg-gray-50 rounded px-1 py-0.5 self-start border border-gray-100 w-full justify-between">
                <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-400">Порц:</span>
                    <input 
                        type="number" min="1" max="10"
                        className="w-6 h-4 text-[10px] font-bold text-center bg-white border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={item.portions || 1}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onPortionChange(item.id, e.target.value)}
                    />
                </div>
                {basePortions > 1 && (
                    <span className="text-[8px] text-gray-400" title={`Базовый рецепт на ${basePortions} порц.`}>
                        (из {basePortions})
                    </span>
                )}
            </div>
            
            <div className="flex justify-between items-end mt-1">
                <span className="text-[9px] text-green-600 font-mono leading-none font-bold">
                    €{stats.cost.toFixed(2)}
                </span>
                <span className="text-[9px] text-orange-600 font-mono leading-none">
                    {stats.cals} ккал
                </span>
            </div>
        </div>
    );
};

export default WeeklyGrid;