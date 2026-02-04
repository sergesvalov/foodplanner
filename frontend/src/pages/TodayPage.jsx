import React, { useEffect, useState, useMemo } from 'react';

const DAYS_MAP = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const MEALS_ORDER = [
    { id: 'takeaway', label: '🎒 Взять с собой' },
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
    // Изменили логику: храним ID конкретной записи плана, а не рецепта
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [loading, setLoading] = useState(true);

    const todayIndex = new Date().getDay();
    const todayName = DAYS_MAP[todayIndex];

    useEffect(() => {
        fetch('/api/plan/')
            .then(res => res.json())
            .then(data => {
                const filtered = (Array.isArray(data) ? data : [])
                    .filter(item => item.day_of_week === todayName && item.recipe);
                setTodayItems(filtered);

                // Auto-select first item
                // Auto-select logic
                let defaultId = null;
                const currentHour = new Date().getHours();
                const isMorning = currentHour >= 0 && currentHour < 9;

                if (isMorning) {
                    const breakfastItem = filtered.find(item => item.meal_type === 'breakfast');
                    if (breakfastItem) {
                        defaultId = breakfastItem.id;
                    }
                }

                if (!defaultId) {
                    for (const meal of MEALS_ORDER) {
                        const mealItem = filtered.find(item => item.meal_type === meal.id);
                        if (mealItem) {
                            defaultId = mealItem.id;
                            break;
                        }
                    }
                }

                if (defaultId) setSelectedItemId(defaultId);

                setLoading(false);
            })
            .catch(err => console.error(err));
    }, [todayName]);

    const calculateItemStats = (item) => {
        const recipe = item?.recipe;
        if (!recipe) return { cost: 0, cals: 0, prot: 0, fat: 0, carb: 0, ratio: 1 };

        const basePortions = recipe.portions || 1;
        const targetPortions = item.portions || 1;
        const ratio = targetPortions / basePortions;

        return {
            cost: (recipe.total_cost || 0) * ratio,
            cals: Math.round((recipe.total_calories || 0) * ratio),
            prot: Math.round((recipe.total_proteins || 0) * ratio),
            fat: Math.round((recipe.total_fats || 0) * ratio),
            carb: Math.round((recipe.total_carbs || 0) * ratio),
            ratio: ratio
        };
    };

    const totalCost = todayItems.reduce((sum, i) => sum + calculateItemStats(i).cost, 0);
    const totalCalories = todayItems.reduce((sum, i) => sum + calculateItemStats(i).cals, 0);

    // Статистика по пользователям
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

    // Находим выбранный элемент плана для отображения слева
    const selectedPlanItem = useMemo(() => {
        return todayItems.find(i => i.id === selectedItemId) || null;
    }, [todayItems, selectedItemId]);

    if (loading) return <div className="p-10 text-center text-gray-500">Загрузка плана...</div>;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-100 overflow-hidden">

            {/* ЛЕВАЯ ПАНЕЛЬ: СТАТИСТИКА + РАСПИСАНИЕ (СПИСОК) */}
            <div className="w-1/4 min-w-[320px] bg-white border-r border-gray-200 flex flex-col shadow-xl z-10">

                {/* СТАТИСТИКА СЕМЬИ (Фиксирована сверху) */}
                <div className="p-4 bg-gray-50 border-b border-gray-200 shrink-0">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Статистика по семье</h3>
                    {userStats.length === 0 ? (
                        <div className="text-sm text-gray-400 italic">Пока никто ничего не ест</div>
                    ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300">
                            {userStats.map((u) => (
                                <div key={u.name} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold uppercase bg-${u.color}-500`}>
                                            {u.name[0]}
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">{u.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-orange-600 text-sm">
                                            {Math.round(u.cals)} ккал
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* РАСПИСАНИЕ (ЛЕНТА БЛЮД) - Moved here */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="mb-6">
                        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Сегодня</h1>
                        <p className="text-gray-500 text-sm mt-1 font-medium">{todayName}</p>
                        {/* Totals - compact view */}
                        <div className="flex gap-2 mt-2">
                            <div className="text-xs bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
                                <span className="text-gray-400 font-bold">CAL:</span> <span className="text-orange-600 font-bold">{totalCalories}</span>
                            </div>
                            <div className="text-xs bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
                                <span className="text-gray-400 font-bold">BUD:</span> <span className="text-green-600 font-bold">€{totalCost.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pb-10">
                        {MEALS_ORDER.map((meal) => {
                            const items = todayItems.filter(item => item.meal_type === meal.id);

                            if (items.length === 0) {
                                return (
                                    <div key={meal.id} className="flex gap-2 items-center opacity-30 select-none">
                                        <div className="w-20 text-xs font-bold text-gray-500 uppercase tracking-wider">{meal.label}</div>
                                        <div className="flex-1 border-t border-dashed border-gray-300"></div>
                                    </div>
                                );
                            }

                            return (
                                <div key={meal.id} className="flex flex-col gap-2 group">
                                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                                        {meal.label}
                                    </div>

                                    <div className="flex flex-col gap-2 pl-2 border-l-2 border-indigo-100">
                                        {items.map(item => {
                                            const isActive = selectedItemId === item.id;
                                            const stats = calculateItemStats(item);
                                            const member = item.family_member;

                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => setSelectedItemId(item.id)}
                                                    className={`rounded-lg p-3 cursor-pointer border transition-all duration-200 ${isActive ? 'bg-white border-indigo-500 ring-2 ring-indigo-50 shadow-md' : 'bg-white border-gray-200 hover:border-indigo-300 shadow-sm'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <h3 className={`text-sm font-bold mb-1 ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>{item.recipe.title}</h3>
                                                        {isActive && <span className="text-indigo-500 text-xs animate-pulse">●</span>}
                                                    </div>

                                                    {member && (
                                                        <div className={`inline-block mb-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-${member.color}-500`}>
                                                            {member.name}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* ПРАВАЯ ПАНЕЛЬ: РЕЦЕПТ (ДЕТАЛИ) */}
            <div className="flex-1 overflow-y-auto relative bg-white h-full p-8">
                {selectedPlanItem ? (
                    (() => {
                        const recipe = selectedPlanItem.recipe;
                        const stats = calculateItemStats(selectedPlanItem);
                        const ratio = stats.ratio;
                        const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
                        const member = selectedPlanItem.family_member;

                        return (
                            <div className="w-full h-full">

                                {/* Morning Takeaway List */}
                                {(() => {
                                    const currentHour = new Date().getHours();
                                    const isMorning = currentHour >= 0 && currentHour < 9;
                                    const takeawayItems = todayItems.filter(item => item.meal_type === 'takeaway');

                                    if (isMorning && takeawayItems.length > 0) {
                                        return (
                                            <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm">
                                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <span>🎒</span> Не забыть взять с собой!
                                                </h3>
                                                <div className="space-y-3">
                                                    {takeawayItems.map(tItem => {
                                                        const tRecipe = tItem.recipe;
                                                        const tMember = tItem.family_member;
                                                        return (
                                                            <div key={tItem.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100">
                                                                <div className="flex items-center gap-3">
                                                                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                                                                    <div>
                                                                        <span className="font-bold text-gray-800 block text-sm">{tRecipe.title}</span>
                                                                        {tMember && (
                                                                            <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded bg-${tMember.color}-500`}>
                                                                                {tMember.name}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                                                    {tItem.portions} шт.
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}


                                <div className="mb-8 border-b border-gray-100 pb-6">
                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 block">
                                        Детали рецепта
                                    </span>
                                    <h2 className="text-4xl font-extrabold text-gray-800 leading-tight mb-4">
                                        {recipe.title}
                                    </h2>

                                    {member && (
                                        <div className={`inline-block mb-4 px-3 py-1 rounded text-sm font-bold text-white bg-${member.color}-500`}>
                                            Для: {member.name}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-3">
                                        <span className="inline-flex items-center px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-200">
                                            €{stats.cost.toFixed(2)}
                                        </span>
                                        <span className="inline-flex items-center px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-bold border border-orange-200">
                                            {stats.cals} ккал
                                        </span>
                                        <span className="inline-flex items-center px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold border border-indigo-200">
                                            {selectedPlanItem.portions} порц.
                                        </span>
                                        <div className="flex gap-1">
                                            <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">B: {stats.prot}</span>
                                            <span className="inline-flex items-center px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs font-bold border border-yellow-100">J: {stats.fat}</span>
                                            <span className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold border border-red-100">U: {stats.carb}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-10 items-start">
                                    {/* Ingredients - Fixed width sidebar */}
                                    <div className="w-full md:w-80 shrink-0">
                                        <h3 className="font-bold text-gray-800 text-lg mb-4 border-b pb-2">Ингредиенты</h3>
                                        {!hasIngredients ? (
                                            <div className="text-gray-400 italic">В этом рецепте нет ингредиентов.</div>
                                        ) : (
                                            <ul className="space-y-3">
                                                {recipe.ingredients.map(ing => {
                                                    const scaledQty = ing.quantity * ratio;
                                                    const calsRaw = ing.product?.calories || 0;
                                                    const isPieces = ['шт', 'шт.', 'pcs'].includes((ing.product?.unit || '').toLowerCase());

                                                    let itemCals = 0;
                                                    if (isPieces) {
                                                        itemCals = Math.round(calsRaw * scaledQty);
                                                    } else {
                                                        itemCals = Math.round((calsRaw / 100) * scaledQty);
                                                    }

                                                    return (
                                                        <li key={ing.id} className="flex justify-between items-center text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{ing.product?.name}</span>
                                                                <span className="text-xs text-gray-400 font-bold">{itemCals} ккал</span>
                                                            </div>
                                                            <span className="font-mono bg-white px-2 py-1 rounded border shadow-sm text-sm">
                                                                {parseFloat(scaledQty.toFixed(2))} {ing.product?.unit}
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Instructions - Takes remaining space */}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-lg mb-4 border-b pb-2">Способ приготовления</h3>
                                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                                            {recipe.description || "Описание приготовления отсутствует."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <span className="text-6xl mb-6 opacity-20">👈</span>
                        <h2 className="text-2xl font-bold text-gray-300 mb-2">Ничего не выбрано</h2>
                        <p className="max-w-md text-gray-400">Выберите блюдо в меню слева, чтобы увидеть подробный рецепт, ингредиенты и способ приготовления.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default TodayPage;