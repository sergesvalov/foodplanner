import React, { useEffect, useState } from 'react';

const DAYS_MAP = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

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

  const todayIndex = new Date().getDay();
  const todayName = DAYS_MAP[todayIndex];

  useEffect(() => {
    fetch('/api/plan/')
      .then(res => res.json())
      .then(data => {
        const filtered = (Array.isArray(data) ? data : []).filter(item => item.day_of_week === todayName);
        setTodayItems(filtered);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [todayName]);

  const getItemForMeal = (mealId) => todayItems.find(item => item.meal_type === mealId);
  const totalCost = todayItems.reduce((sum, i) => sum + (i.recipe?.total_cost || 0), 0);
  const totalCalories = todayItems.reduce((sum, i) => sum + (i.recipe?.total_calories || 0), 0);

  if (loading) return <div className="p-10 text-center text-gray-500">Загрузка плана...</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100 overflow-hidden">
      
      {/* ЛЕВАЯ КОЛОНКА */}
      <div className="w-1/3 min-w-[350px] bg-white border-r border-gray-200 flex flex-col shadow-xl z-10">
        {selectedRecipe ? (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50 shrink-0">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 block">
                Выбранное блюдо
              </span>
              <h2 className="text-3xl font-bold text-gray-800 leading-tight mb-4">
                {selectedRecipe.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                 <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-200">
                    €{(selectedRecipe.total_cost || 0).toFixed(2)}
                 </span>
                 <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold border border-orange-200">
                    {selectedRecipe.total_calories || 0} ккал
                 </span>
                 <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold border border-blue-200">
                    {selectedRecipe.ingredients ? selectedRecipe.ingredients.length : 0} инг.
                 </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300">
              <h3 className="font-bold text-gray-800 text-lg mb-3 border-b pb-2">Способ приготовления</h3>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-base mb-8">
                {selectedRecipe.description || "Описание приготовления отсутствует."}
              </p>

              <h3 className="font-bold text-gray-800 text-lg mb-3 border-b pb-2">Ингредиенты</h3>
              <ul className="space-y-3">
                {(selectedRecipe.ingredients || []).map(ing => {
                    // Расчет для отображения в списке
                    const calsPer100g = ing.product?.calories || 0;
                    const itemCals = Math.round((calsPer100g / 100) * ing.quantity);

                    return (
                        <li key={ing.id} className="flex justify-between items-center text-gray-700 bg-gray-50 p-2 rounded">
                            <div className="flex flex-col">
                                <span className="font-medium">{ing.product?.name || "Неизвестный продукт"}</span>
                                <span className="text-[10px] text-gray-400 font-bold">
                                    {itemCals} ккал
                                    {/* Подсказка, сколько ккал в 100г продукта */}
                                    <span className="font-normal opacity-70 ml-1">({calsPer100g}/100г)</span>
                                </span>
                            </div>
                            <span className="font-mono bg-white px-2 py-0.5 rounded border text-sm">
                                {ing.quantity} {ing.product?.unit}
                            </span>
                        </li>
                    );
                })}
              </ul>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
            <span className="text-6xl mb-6 opacity-50">👈</span>
            <h3 className="text-xl font-bold text-gray-500">Блюдо не выбрано</h3>
            <p className="mt-2 text-sm max-w-xs">Нажмите на любую карточку в меню справа, чтобы увидеть рецепт и список продуктов.</p>
          </div>
        )}
      </div>

      {/* ПРАВАЯ КОЛОНКА */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
        <div className="flex justify-between items-end mb-8 max-w-4xl">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Сегодня</h1>
            <p className="text-gray-500 text-lg mt-1 font-medium">{todayName}</p>
          </div>
          <div className="flex gap-4">
              <div className="text-right bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Калории</div>
                <div className="text-2xl font-bold text-orange-600">{totalCalories} ккал</div>
              </div>
              <div className="text-right bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Бюджет</div>
                <div className="text-2xl font-bold text-green-600">€{totalCost.toFixed(2)}</div>
              </div>
          </div>
        </div>

        <div className="space-y-6 max-w-4xl pb-10">
            {MEALS_ORDER.map((meal) => {
                const item = getItemForMeal(meal.id);
                if (!item) {
                    return (
                        <div key={meal.id} className="flex gap-6 items-center opacity-30 hover:opacity-60 transition-opacity select-none">
                             <div className="w-36 text-right text-sm font-bold text-gray-500 uppercase tracking-wider py-2">{meal.label}</div>
                             <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-400 text-sm font-medium">— Нет планов —</div>
                        </div>
                    );
                }

                const isActive = selectedRecipe?.id === item.recipe.id;

                return (
                    <div key={meal.id} className="flex gap-6 items-stretch group">
                        <div className="w-36 text-right pt-6">
                            <div className={`text-sm font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                {meal.label}
                            </div>
                        </div>

                        <div 
                            onClick={() => setSelectedRecipe(item.recipe)}
                            className={`flex-1 rounded-xl p-5 cursor-pointer border-2 transition-all duration-200 ${isActive ? 'bg-white border-indigo-500 ring-4 ring-indigo-50 shadow-xl scale-[1.01]' : 'bg-white border-transparent hover:border-indigo-200 hover:shadow-md shadow-sm'}`}
                        >
                            <div className="flex justify-between items-start">
                                <h3 className={`text-xl font-bold mb-2 ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>{item.recipe.title}</h3>
                                {isActive && <span className="text-indigo-500 text-2xl animate-pulse">●</span>}
                            </div>
                            
                            <div className="flex gap-4 text-sm text-gray-500 mt-2">
                                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">💶 €{(item.recipe.total_cost || 0).toFixed(2)}</span>
                                <span className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded text-orange-700 font-medium">🔥 {item.recipe.total_calories || 0} ккал</span>
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {todayItems.length === 0 && (
                <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="text-6xl mb-4">☕️</div>
                    <h3 className="text-2xl text-gray-800 font-bold">День свободен</h3>
                    <p className="text-gray-500 mt-2">На сегодня пока ничего не запланировано.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TodayPage;