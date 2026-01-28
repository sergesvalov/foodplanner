import React, { useEffect, useState } from 'react';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// 1. Расширяем список слотов. 
// isSnack: true означает, что слот по умолчанию компактный
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

  const fetchPlan = () => {
    fetch('/api/plan/')
      .then(res => res.json())
      .then(data => setPlan(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  // --- Drag & Drop логика ---
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-gray-200', 'scale-[1.02]'); // Добавим эффект увеличения
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-gray-200', 'scale-[1.02]');
  };

  const handleDrop = async (e, day, mealType) => {
    e.preventDefault();
    // Убираем классы подсветки
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
          meal_type: mealType, // Теперь сюда прилетит 'morning_snack' или 'pre_breakfast' и т.д.
          recipe_id: recipe.id
        })
      });

      if (res.ok) fetchPlan();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (itemId) => {
    if (!window.confirm("Удалить блюдо?")) return;
    await fetch(`/api/plan/${itemId}`, { method: 'DELETE' });
    fetchPlan();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3 h-full">
      {DAYS.map((day) => (
        <div key={day} className="flex flex-col border border-gray-300 rounded-lg bg-white overflow-hidden min-w-[150px] shadow-sm">
          {/* Заголовок дня */}
          <div className="bg-gray-800 text-white text-center py-2 font-bold text-sm uppercase tracking-wide sticky top-0 z-10">
            {day}
          </div>

          {/* Контейнер слотов */}
          <div className="flex-1 flex flex-col p-1 gap-1 overflow-y-auto">
            {MEALS.map((meal) => {
                // Фильтруем рецепты для текущего слота
                const itemsInSlot = plan.filter(p => p.day_of_week === day && p.meal_type === meal.id);
                
                // Логика отображения:
                // Если это "Перекус" (isSnack) И он пустой -> показываем узкую полоску (Compact Mode)
                // Иначе -> показываем полный блок
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
                        <div className="text-[10px] font-bold uppercase px-2 py-1 text-gray-600 bg-white/50 rounded-t mb-1">
                          {meal.label}
                        </div>
                    )}

                    {/* Если компактный режим - показываем только + при наведении (через CSS opacity) или мелкий текст */}
                    {isCompact && (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400 uppercase font-bold tracking-widest cursor-default">
                            + {meal.label}
                        </div>
                    )}
                    
                    {/* Список рецептов в слоте */}
                    <div className={`space-y-1 px-1 ${!isCompact ? 'pb-1' : 'hidden'}`}>
                        {itemsInSlot.map(item => (
                            <div key={item.id} className="flex justify-between items-start text-xs p-1.5 bg-white rounded border border-gray-100 shadow-sm group hover:border-blue-300 transition-colors cursor-grab active:cursor-grabbing">
                                <span className="text-gray-800 leading-tight line-clamp-2">
                                    {item.recipe.title}
                                </span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                                    className="text-gray-300 hover:text-red-500 font-bold ml-1 px-1"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeeklyGrid;