import React, { useEffect, useState } from 'react';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const MEALS = [
  { id: 'breakfast', label: 'Завтрак', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'lunch', label: 'Обед', color: 'bg-green-50 border-green-200' },
  { id: 'dinner', label: 'Ужин', color: 'bg-blue-50 border-blue-200' },
  { id: 'snack', label: 'Перекус', color: 'bg-purple-50 border-purple-200' },
];

const WeeklyGrid = () => {
  const [plan, setPlan] = useState([]);

  // Загружаем план. Обрати внимание на путь /api/
  const fetchPlan = () => {
    fetch('/api/plan/')
      .then(res => res.json())
      .then(data => setPlan(data))
      .catch(err => console.error("Ошибка загрузки плана:", err));
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  // Разрешаем бросать элемент в зону
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-gray-200');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-gray-200');
  };

  // Обработка "Броска" (Drop)
  const handleDrop = async (e, day, mealType) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-200');

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

      if (res.ok) fetchPlan(); // Обновляем сетку
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (itemId) => {
    if (!window.confirm("Удалить из меню?")) return;
    await fetch(`/api/plan/${itemId}`, { method: 'DELETE' });
    fetchPlan();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {DAYS.map((day) => (
        <div key={day} className="flex flex-col border rounded-lg shadow-sm bg-white overflow-hidden min-w-[140px]">
          <div className="bg-gray-800 text-white text-center py-2 font-semibold text-sm">
            {day}
          </div>
          <div className="flex-1 flex flex-col p-1 gap-1 bg-gray-50 h-full min-h-[400px]">
            {MEALS.map((meal) => {
                const itemsInSlot = plan.filter(p => p.day_of_week === day && p.meal_type === meal.id);

                return (
                  <div 
                    key={meal.id} 
                    className={`flex-1 border border-dashed rounded p-1 transition-colors ${meal.color}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day, meal.id)}
                  >
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1 text-center">
                      {meal.label}
                    </span>
                    
                    <div className="space-y-1">
                        {itemsInSlot.map(item => (
                            <div key={item.id} className="bg-white p-1 rounded shadow-sm text-xs border border-gray-200 flex justify-between items-center group cursor-default">
                                <span className="truncate w-20" title={item.recipe.title}>{item.recipe.title}</span>
                                <button 
                                    onClick={() => handleRemove(item.id)}
                                    className="text-red-400 hover:text-red-600 font-bold px-1"
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