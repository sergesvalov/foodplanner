import React, { useEffect, useState } from 'react';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// Конфигурация слотов (с поддержкой компактных перекусов)
const MEALS = [
  { id: 'pre_breakfast', label: 'Ранний старт', color: 'bg-orange-50 border-orange-200', isSnack: true },
  { id: 'breakfast', label: 'Завтрак', color: 'bg-yellow-50 border-yellow-200', isSnack: false },
  { id: 'morning_snack', label: 'Второй завтрак', color: 'bg-purple-50 border-purple-200', isSnack: true },
  { id: 'lunch', label: 'Обед', color: 'bg-green-50 border-green-200', isSnack: false },
  { id: 'afternoon_snack', label: 'Полдник', color: 'bg-pink-50 border-pink-200', isSnack: true },
  { id: 'dinner', label: 'Ужин', color: 'bg-blue-50 border-blue-200', isSnack: false },
  { id: 'late_snack', label: 'Поздний ужин', color: 'bg-indigo-50 border-indigo-200', isSnack: true },
];

const WeeklyGrid = () => {
  const [plan, setPlan] = useState([]);

  // Загружаем план с сервера
  const fetchPlan = () => {
    fetch('/api/plan/')
      .then(res => res.json())
      .then(data => setPlan(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  // --- НОВОЕ: Подсчет стоимости за день ---
  const calculateDayCost = (day) => {
    // 1. Берем все записи плана для конкретного дня
    const dayItems = plan.filter(p => p.day_of_week === day);
    
    // 2. Суммируем total_cost всех рецептов в этом дне
    const total = dayItems.reduce((sum, item) => {
      // item.recipe может быть null если была ошибка, поэтому используем optional chaining
      return sum + (item.recipe?.total_cost || 0);
    }, 0);

    return total.toFixed(2);
  };

  // --- Drag & Drop ---
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-gray-200', 'scale-[1.02]');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-gray-200', 'scale-[1.02]');
  };

  const handleDrop = async (e, day, mealType) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-200', 'scale-[1.02]');

    const data = e.dataTransfer.getData('recipeData');
    if (!data) return;
    
    const recipe = JSON.parse(data);

    try {
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (itemId) => {
    if (!window.confirm("Удалить блюдо из расписания?")) return;
    await fetch(`/api/plan/${itemId}`, { method: 'DELETE' });
    fetchPlan();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3 h-full">
      {DAYS.map((day) => {
        // Считаем стоимость для текущего дня
        const dayCost = calculateDayCost(day);
        const hasCost = parseFloat(dayCost) > 0;

        return (
          <div key={day} className="flex flex-col border border-gray-300 rounded-lg bg-white overflow-hidden min-w-[150px] shadow-sm">
            {/* Заголовок дня + Стоимость */}
            <div className="bg-gray-800 text-white py-2 px-1 flex flex-col items-center justify-center sticky top-0 z-10 shadow-md">
              <span className="font-bold text-sm uppercase tracking-wide">{day}</span>
              
              {/* Бейдж со стоимостью */}
              <div className={`text-xs mt-1 px-2 py-0.5 rounded-full font-mono font-bold ${
                  hasCost ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                €{dayCost}
              </div>
            </div>

            {/* Контейнер слотов */}
            <div className="flex-1 flex flex-col p-1 gap-1 overflow-y-auto">
              {MEALS.map((meal) => {
                  const itemsInSlot = plan.filter(p => p.day_of_week === day && p.meal_type === meal.id);
                  const isCompact = meal.isSnack && itemsInSlot.length === 0;

                  return (
                    <div 
                      key={meal.id} 
                      className={`
                        relative flex flex-col rounded border transition-all duration-200
                        ${meal.color}
                        ${isCompact ? 'h-6 opacity-60 hover:opacity-100 hover:h-16 border-dashed border-gray-300' : 'min-h-[60px] border-gray-200 shadow-sm'}
                      `}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day, meal.id)}
                      title={isCompact ? `Добавить ${meal.label}` : ''}
                    >
                      {/* Заголовок слота */}
                      {!isCompact && (
                          <div className="text-[10px] font-bold uppercase px-2 py-1 text-gray-600 bg-white/50 rounded-t mb-1 flex justify-between">
                            <span>{meal.label}</span>
                          </div>
                      )}

                      {isCompact && (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400 uppercase font-bold tracking-widest cursor-default">
                              + {meal.label}
                          </div>
                      )}
                      
                      {/* Список рецептов */}
                      <div className={`space-y-1 px-1 ${!isCompact ? 'pb-1' : 'hidden'}`}>
                          {itemsInSlot.map(item => (
                              <div key={item.id} className="flex flex-col text-xs p-1.5 bg-white rounded border border-gray-100 shadow-sm group hover:border-blue-300 transition-colors cursor-grab active:cursor-grabbing">
                                  <div className="flex justify-between items-start">
                                    <span className="text-gray-800 leading-tight font-medium line-clamp-2">
                                        {item.recipe.title}
                                    </span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                                        className="text-gray-300 hover:text-red-500 font-bold ml-1 px-1"
                                    >
                                        ×
                                    </button>
                                  </div>
                                  {/* Цена конкретного блюда в сетке (мелко) */}
                                  <div className="text-[10px] text-green-600 mt-1">
                                    €{item.recipe.total_cost.toFixed(2)}
                                  </div>
                              </div>
                          ))}
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyGrid;