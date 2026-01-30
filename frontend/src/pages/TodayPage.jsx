import React, { useState, useEffect, useMemo } from 'react';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// Порядок сортировки приемов пищи
const MEAL_ORDER = [
  'pre_breakfast', 
  'breakfast', 
  'morning_snack', 
  'lunch', 
  'afternoon_snack', 
  'dinner', 
  'late_snack',
  'takeaway',
  'yummy' // Вкусняшки
];

const MEAL_LABELS = {
  pre_breakfast: 'Ранний старт',
  breakfast: 'Завтрак',
  morning_snack: 'Второй завтрак',
  lunch: 'Обед',
  afternoon_snack: 'Полдник',
  dinner: 'Ужин',
  late_snack: 'Поздний ужин',
  takeaway: 'Взять с собой',
  yummy: 'Вкусняшки'
};

const TodayPage = () => {
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);

  // Определяем текущий день недели
  const currentDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon
  // JS возвращает 0 для воскресенья, а у нас массив начинается с понедельника (0)
  // Преобразуем: Mon(1)->0, Tue(2)->1 ... Sun(0)->6
  const normalizedIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
  const currentDayName = DAYS[normalizedIndex];

  useEffect(() => {
    fetch('/api/plan/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPlan(data);
        else setPlan([]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Фильтруем план только на сегодня
  const todayItems = useMemo(() => {
    return plan.filter(item => item.day_of_week === currentDayName);
  }, [plan, currentDayName]);

  // Группируем блюда по приемам пищи
  const groupedMeals = useMemo(() => {
    const groups = {};
    MEAL_ORDER.forEach(type => {
      groups[type] = [];
    });

    todayItems.forEach(item => {
      const type = item.meal_type || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    });
    return groups;
  }, [todayItems]);

  // Расчет итогов
  const stats = useMemo(() => {
    let cost = 0;
    let cals = 0;
    todayItems.forEach(item => {
        const recipe = item.recipe;
        if (recipe) {
            const ratio = (item.portions || 1) / (recipe.portions || 1);
            cost += (recipe.total_cost || 0) * ratio;
            cals += (recipe.total_calories || 0) * ratio;
        }
    });
    return { cost, cals: Math.round(cals) };
  }, [todayItems]);

  if (loading) return <div className="p-8 text-center text-gray-500">Загрузка...</div>;

  return (
    <div className="container mx-auto max-w-2xl p-4 pb-20">
      
      {/* ЗАГОЛОВОК */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
           <span>☀️</span> 
           <span>Сегодня</span>
        </h1>
        <p className="text-gray-500 font-medium text-lg mt-1">{currentDayName}</p>
      </div>

      {/* ИТОГИ ДНЯ */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm flex flex-col items-center">
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Бюджет</span>
            <span className="text-2xl font-extrabold text-green-700">€{stats.cost.toFixed(2)}</span>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 shadow-sm flex flex-col items-center">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Калории</span>
            <span className="text-2xl font-extrabold text-orange-700">{stats.cals}</span>
        </div>
      </div>

      {/* СПИСОК БЛЮД */}
      <div className="space-y-6">
        {todayItems.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <div className="text-4xl mb-3">🍽️</div>
                <p className="text-gray-500 font-medium">На сегодня ничего не запланировано</p>
                <p className="text-sm text-gray-400">Перейдите в план на неделю, чтобы добавить блюда</p>
            </div>
        ) : (
            MEAL_ORDER.map(mealType => {
                const items = groupedMeals[mealType];
                if (!items || items.length === 0) return null;

                return (
                    <div key={mealType} className="animate-fadeIn">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">
                            {MEAL_LABELS[mealType] || mealType}
                        </h3>
                        
                        <div className="space-y-3">
                            {/* ТЕПЕРЬ МЫ ИСПОЛЬЗУЕМ MAP, ЧТОБЫ ВЫВЕСТИ ВСЕ БЛЮДА */}
                            {items.map(item => (
                                <MealCard key={item.id} item={item} />
                            ))}
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

// Компонент карточки блюда
const MealCard = ({ item }) => {
    const recipe = item.recipe;
    if (!recipe) return null;

    const basePortions = recipe.portions || 1;
    const targetPortions = item.portions || 1;
    const ratio = targetPortions / basePortions;
    
    const cost = (recipe.total_cost || 0) * ratio;
    const cals = Math.round((recipe.total_calories || 0) * ratio);
    
    // Новые поля из бэкенда (если есть)
    const weightPerPortion = recipe.weight_per_portion 
        ? Math.round(recipe.weight_per_portion * targetPortions) 
        : null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 items-start relative overflow-hidden group hover:border-indigo-200 transition-colors">
            {/* Цветная полоска для пользователя */}
            {item.family_member && (
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-${item.family_member.color}-500`} />
            )}

            <div className="flex-1 min-w-0 ml-2">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-800 text-lg leading-tight mb-1">{recipe.title}</h4>
                    {item.family_member && (
                        <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded bg-${item.family_member.color}-500 ml-2 whitespace-nowrap`}>
                            {item.family_member.name}
                        </span>
                    )}
                </div>
                
                {/* Описание порций */}
                <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                   <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium text-xs">
                     {targetPortions} порц.
                   </span>
                   {weightPerPortion && (
                       <span className="text-xs text-gray-400">~ {weightPerPortion} г</span>
                   )}
                </div>

                {/* Ингредиенты (кратко) */}
                <div className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {recipe.description || "Без описания"}
                </div>
            </div>

            {/* Метрики */}
            <div className="flex flex-col items-end gap-1 self-center">
                <div className="font-mono font-bold text-green-600 bg-green-50 px-2 py-1 rounded text-sm">
                    €{cost.toFixed(2)}
                </div>
                <div className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded text-sm">
                    {cals} ккал
                </div>
            </div>
        </div>
    );
};

export default TodayPage;