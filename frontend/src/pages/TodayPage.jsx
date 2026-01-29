import React, { useEffect, useState } from 'react';

// Массив для маппинга JS getDay() (0=Воскресенье) на названия в БД
const DAYS_MAP = [
  'Воскресенье', // 0
  'Понедельник', // 1
  'Вторник',     // 2
  'Среда',       // 3
  'Четверг',     // 4
  'Пятница',     // 5
  'Суббота'      // 6
];

const MEALS_ORDER = [
  { id: 'pre_breakfast', label: 'Ранний старт' },
  { id: 'breakfast', label: 'Завтрак' },
  { id: 'morning_snack', label: 'Второй завтрак' },
  { id: 'lunch', label: 'Обед' },
  { id: 'afternoon_snack', label: 'Полдник' },
  { id: 'dinner', label: 'Ужин' },
  { id: 'late_snack', label: 'Поздний ужин' },
];

const TodayPage = () => {
  const [todayItems, setTodayItems] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  // Определяем какой сегодня день текстом
  const todayIndex = new Date().getDay();
  const todayName = DAYS_MAP[todayIndex];

  useEffect(() => {
    fetch('/api/plan/')
      .then(res => res.json())
      .then(data => {
        // Фильтруем план: оставляем только сегодняшний день
        const filtered = data.filter(item => item.day_of_week === todayName);
        setTodayItems(filtered);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [todayName]);

  // Хелпер для поиска блюда в конкретный слот времени
  const getItemForMeal = (mealId) => {
    return todayItems.find(item => item.meal_type === mealId);
  };

  // Считаем итого за сегодня
  const totalCost = todayItems.reduce((sum, i) => sum + (i.recipe?.total_cost || 0), 0);
  
  // Для калорий нужно сложить калории всех ингредиентов (если они есть в API, 
  // но в текущем /api/plan они внутри recipe.ingredients.product)
  // Упростим: покажем только цену, так как она точно есть в recipe.total_cost.

  if (loading) return <div className="p-10 text-center text-gray-500">Загрузка...</div>;

  return (
    // Контейнер на всю высоту минус хедер
    <div className="flex h-[calc(100vh-64px)] bg-gray-100 overflow-hidden">
      
      {/* --- ЛЕВАЯ КОЛОНКА: Просмотр рецепта --- */}
      <div className="w-1/3 min-w-[320px] bg-white border-r border-gray-200 flex flex-col shadow-lg z-10">
        {selectedRecipe ? (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 block">
                Выбранное блюдо
              </span>
              <h2 className="text-2xl font-bold text-gray-800 leading-tight">
                {selectedRecipe.title}
              </h2>
              <div className="mt-3 flex gap-3">
                 <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                    €{selectedRecipe.total_cost.toFixed(2)}
                 </span>
                 <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    {selectedRecipe.ingredients.length} инг.
                 </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="font-bold text-gray-700 mb-2">Способ приготовления:</h3>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-lg">
                {selectedRecipe.description || "Описание отсутствует."}
              </p>

              <h3 className="font-bold text-gray-700 mt-8 mb-3">Ингредиенты:</h3>
              <ul className="space-y-2">
                {selectedRecipe.ingredients.map(ing => (
                    <li key={ing.id} className="flex justify-between border-b border-gray-100 pb-1 text-gray-600">
                        <span>{ing.product?.name || "Неизвестный продукт"}</span>
                        <span className="font-mono text-gray-800">{ing.quantity} {ing.product?.unit}</span>
                    </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <span className="text-6xl mb-4">👈</span>
            <h3 className="text-xl font-medium">Выберите блюдо</h3>
            <p className="mt-2 text-sm">Нажмите на карточку справа, чтобы увидеть рецепт и ингредиенты.</p>
          </div>
        )}
      </div>

      {/* --- ПРАВАЯ КОЛОНКА: Список блюд на сегодня --- */}
      <div className="flex-1 overflow-y-auto p-8">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Сегодня</h1>
            <p className="text-gray-500 text-lg mt-1 capitalize">{todayName}</p>
          </div>
          <div className="text-right">
             <div className="text-sm text-gray-400">Стоимость дня</div>
             <div className="text-3xl font-bold text-green-600">€{totalCost.toFixed(2)}</div>
          </div>
        </div>

        <div className="space-y-6 max-w-3xl">
            {MEALS_ORDER.map((meal) => {
                const item = getItemForMeal(meal.id);
                
                // Если в слоте ничего нет, можно либо не показывать, либо показывать "пусто"
                // Покажем полупрозрачный слот, если пусто
                if (!item) {
                    return (
                        <div key={meal.id} className="flex gap-6 items-center opacity-40">
                             <div className="w-32 text-right text-sm font-bold text-gray-400 uppercase tracking-wider py-2">
                                {meal.label}
                             </div>
                             <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-4 text-gray-400 text-sm italic">
                                Не запланировано
                             </div>
                        </div>
                    );
                }

                const isActive = selectedRecipe?.id === item.recipe.id;

                return (
                    <div key={meal.id} className="flex gap-6 items-stretch group">
                        {/* Время/Тип */}
                        <div className="w-32 text-right pt-5">
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
                                {meal.label}
                            </div>
                        </div>

                        {/* Карточка */}
                        <div 
                            onClick={() => setSelectedRecipe(item.recipe)}
                            className={`
                                flex-1 rounded-xl p-6 cursor-pointer border-2 transition-all duration-200 shadow-sm
                                ${isActive 
                                    ? 'bg-white border-indigo-500 ring-4 ring-indigo-50 shadow-lg scale-[1.01]' 
                                    : 'bg-white border-transparent hover:border-indigo-200 hover:shadow-md'
                                }
                            `}
                        >
                            <h3 className={`text-xl font-bold mb-2 ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>
                                {item.recipe.title}
                            </h3>
                            <div className="flex gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    💰 €{item.recipe.total_cost.toFixed(2)}
                                </span>
                                <span className="flex items-center gap-1">
                                    📦 {item.recipe.ingredients.length} ингридиентов
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}

            {todayItems.length === 0 && (
                <div className="text-center py-20">
                    <h3 className="text-2xl text-gray-400 font-bold">На сегодня планов нет 🏝</h3>
                    <p className="text-gray-500 mt-2">Перейдите в "План на неделю" и добавьте блюда.</p>
                </div>
            )}
        </div>
      </div>

    </div>
  );
};

export default TodayPage;