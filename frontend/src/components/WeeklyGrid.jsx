import React, { useEffect, useState } from 'react';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

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
        // ЗАЩИТА: Если пришла ошибка или не массив, ставим пустой массив
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
            recipe_id: recipe.id
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

  return (
    <div className="h-full w-full overflow-x-auto overflow-y-hidden bg-gray-100 rounded-lg border border-gray-300 flex flex-col">
      <div className="grid grid-cols-7 h-full min-w-[1050px] divide-x divide-gray-300">
        
        {DAYS.map((day) => {
          const dayItems = plan.filter(p => p.day_of_week === day);
          
          // ЗАЩИТА: используем ?. и || 0, чтобы не падать на удаленных рецептах
          const dayCost = dayItems.reduce((sum, item) => sum + (item.recipe?.total_cost || 0), 0);
          const dayCals = dayItems.reduce((sum, item) => sum + (item.recipe?.total_calories || 0), 0);

          const hasData = dayItems.length > 0;

          return (
            <div key={day} className="flex flex-col h-full bg-white relative group min-w-0">
              
              {/* Шапка дня */}
              <div className="bg-gray-800 text-white py-2 flex flex-col items-center justify-center shadow-md z-10 shrink-0 border-b border-gray-600 gap-1">
                <span className="font-bold text-xs uppercase tracking-wider">{day}</span>
                <div className="flex gap-1">
                    <div className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        hasData ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                    }`}>
                      €{dayCost.toFixed(2)}
                    </div>
                    <div className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        hasData ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {dayCals} ккал
                    </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-1 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 min-h-0">
                {MEALS.map((meal) => {
                    const itemsInSlot = plan.filter(p => p.day_of_week === day && p.meal_type === meal.id);
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
                        onDrop={(e) => handleDrop(e, day, meal.id)}
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
                              {itemsInSlot.map(item => {
                                  // ЗАЩИТА: Если рецепт был удален, но запись в плане осталась
                                  if (!item.recipe) return (
                                    <div key={item.id} className="relative bg-red-50 border border-red-200 rounded p-1.5">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                                          className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold"
                                        >
                                          ×
                                        </button>
                                        <span className="text-[10px] text-red-400 italic">Рецепт удален</span>
                                    </div>
                                  );

                                  return (
                                    <div key={item.id} className="relative flex flex-col bg-white rounded border border-gray-200 shadow-sm p-1.5 group/item hover:border-indigo-300 transition-colors">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                                            className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover/item:opacity-100 shadow-sm hover:bg-red-500 hover:text-white transition-all z-20"
                                            title="Удалить"
                                        >
                                            ×
                                        </button>
                                        
                                        <span className="text-[11px] text-gray-800 font-medium leading-tight line-clamp-3 break-words" title={item.recipe.title}>
                                            {item.recipe.title}
                                        </span>
                                        
                                        <div className="flex justify-between items-end mt-1">
                                            <span className="text-[9px] text-green-600 font-mono leading-none font-bold">
                                                €{(item.recipe.total_cost || 0).toFixed(2)}
                                            </span>
                                            <span className="text-[9px] text-orange-600 font-mono leading-none">
                                                {item.recipe.total_calories || 0} ккал
                                            </span>
                                        </div>
                                    </div>
                                  );
                              })}
                          </div>
                        )}
                      </div>
                    );
                })}
                <div className="h-8"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyGrid;