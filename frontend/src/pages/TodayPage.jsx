import React, { useState, useEffect, useMemo } from 'react';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

const MEAL_ORDER = [
  'pre_breakfast', 
  'breakfast', 
  'morning_snack', 
  'lunch', 
  'afternoon_snack', 
  'dinner', 
  'late_snack',
  'takeaway',
  'yummy'
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

  const currentDayIndex = new Date().getDay(); 
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

  const todayItems = useMemo(() => {
    return plan.filter(item => item.day_of_week === currentDayName);
  }, [plan, currentDayName]);

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

  // Общие итоги (Бюджет / Калории)
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

  // --- НОВАЯ ЛОГИКА: Статистика по пользователям ---
  const userStats = useMemo(() => {
    const statsMap = {};
    
    todayItems.forEach(item => {
        if (item.family_member && item.recipe) {
            const { id, name, color } = item.family_member;
            
            if (!statsMap[id]) {
                statsMap[id] = { name, color, cals: 0, count: 0 };
            }
            
            const ratio = (item.portions || 1) / (item.recipe.portions || 1);
            const itemCals = (item.recipe.total_calories || 0) * ratio;
            
            statsMap[id].cals += itemCals;
            statsMap[id].count += 1;
        }
    });

    return Object.values(statsMap);
  }, [todayItems]);

  if (loading) return <div className="p-8 text-center text-gray-500">Загрузка...</div>;

  return (
    <div className="container mx-auto max-w-2xl p-4 pb-20">
      
      {/* HEADER */}
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
           <span>☀️</span> 
           <span>Сегодня</span>
        </h1>
        <p className="text-gray-500 font-medium text-lg mt-1 capitalize">{currentDayName}</p>
      </div>

      {/* ОБЩИЕ ИТОГИ */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm flex flex-col items-center">
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Бюджет</span>
            <span className="text-2xl font-extrabold text-green-700">€{stats.cost.toFixed(2)}</span>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 shadow-sm flex flex-col items-center">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Всего калорий</span>
            <span className="text-2xl font-extrabold text-orange-700">{stats.cals}</span>
        </div>
      </div>

      {/* ПЕРСОНАЛЬНАЯ СТАТИСТИКА (КТО СКОЛЬКО СЪЕЛ) */}
      {userStats.length > 0 && (
          <div className="mb-8 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Персональные итоги</h3>
              <div className="space-y-3">
                  {userStats.map((u) => (
                      <div key={u.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm bg-${u.color}-500`}>
                                  {u.name[0]}
                              </div>
                              <span className="font-bold text-gray-700">{u.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">
                                 {u.count} блюд
                             </span>
                             <span className="font-mono font-bold text-orange-600 text-lg">
                                 {Math.round(u.cals)} <span className="text-xs text-orange-400">ккал</span>
                             </span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* ЛЕНТА БЛЮД */}
      <div className="space-y-8">
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
                    <div key={mealType}>
                        <h3 className="text-sm font-bold text-indigo-900/40 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                            {MEAL_LABELS[mealType] || mealType}
                            <span className="h-px bg-indigo-50 flex-1"></span>
                        </h3>
                        
                        <div className="space-y-3">
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

// Карточка блюда
const MealCard = ({ item }) => {
    const recipe = item.recipe;
    if (!recipe) return null;

    const basePortions = recipe.portions || 1;
    const targetPortions = item.portions || 1;
    const ratio = targetPortions / basePortions;
    
    const cost = (recipe.total_cost || 0) * ratio;
    const cals = Math.round((recipe.total_calories || 0) * ratio);
    
    const weightPerPortion = recipe.weight_per_portion 
        ? Math.round(recipe.weight_per_portion * targetPortions) 
        : null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 items-start relative overflow-hidden group hover:border-indigo-300 transition-all">
            {/* Цветная полоска */}
            {item.family_member && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${item.family_member.color}-500`} />
            )}

            <div className="flex-1 min-w-0 ml-2">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800 text-lg leading-tight">{recipe.title}</h4>
                    {item.family_member && (
                        <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-${item.family_member.color}-500 ml-2 whitespace-nowrap shadow-sm`}>
                            {item.family_member.name}
                        </span>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                   <span className="bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-gray-500 font-medium text-xs">
                     {targetPortions} порц.
                   </span>
                   {weightPerPortion && (
                       <span className="bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-gray-500 font-medium text-xs">
                         ~ {weightPerPortion} г
                       </span>
                   )}
                </div>

                <div className="text-xs text-gray-400 line-clamp-2">
                    {recipe.description || "Без описания"}
                </div>
            </div>

            <div className="flex flex-col items-end gap-1 self-center pl-2 border-l border-gray-50">
                <div className="font-mono font-bold text-green-700 text-sm">
                    €{cost.toFixed(2)}
                </div>
                <div className="font-mono font-bold text-orange-600 text-sm whitespace-nowrap">
                    {cals} ккал
                </div>
            </div>
        </div>
    );
};

export default TodayPage;