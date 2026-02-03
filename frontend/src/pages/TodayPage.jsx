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
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, [todayName]);

    const calculateItemStats = (item) => {
        const recipe = item?.recipe;
        if (!recipe) return { cost: 0, cals: 0, ratio: 1 };

        const basePortions = recipe.portions || 1;
        const targetPortions = item.portions || 1;
        const ratio = targetPortions / basePortions;

        let totalCost = 0;
        let totalCals = 0;
        let totalProt = 0;
        let totalFat = 0;
        let totalCarb = 0;

        if (recipe.ingredients) {
            recipe.ingredients.forEach(ing => {
                const qty = ing.quantity * ratio;
                const isPieces = ['шт', 'шт.', 'pcs'].includes((ing.product?.unit || '').toLowerCase());
                const p = ing.product || {};

                const factor = isPieces ? qty : (qty / 100);

                if (Number.isFinite(factor)) {
                    totalCost += (p.price || 0) * (isPieces ? qty : (qty / (p.amount || 1) * (p.price_per_unit || 1)));

                    const safeVal = (v) => {
                        const n = parseFloat(v);
                        return Number.isFinite(n) ? n : 0;
                    };

                    totalCals += safeVal(p.calories) * factor;
                    totalProt += safeVal(p.proteins) * factor;
                    totalFat += safeVal(p.fats) * factor;
                    totalCarb += safeVal(p.carbs) * factor;
                }
            });
        }

        // Fallback if recipe has total_calories pre-calculated on backend but not ingredients? 
        // The current code used `recipe.total_calories * ratio`. Let's stick to that for calories if possible, 
        // or switch to summing ingredients if we trust them more?
        // The user wants P/F/C which are NOT pre-calculated. So we MUST sum ingredients for them.
        // For consistency let's use calculated cals from ingredients too? Or keep using recipe.total_calories for cals?
        // Let's keep using recipe.total_calories for legacy reasons mostly, but calculate P/F/C.

        return {
            cost: (recipe.total_cost || 0) * ratio,
            cals: Math.round((recipe.total_calories || 0) * ratio),
            prot: Math.round(totalProt),
            fat: Math.round(totalFat),
            carb: Math.round(totalCarb),
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

            {/* ЛЕВАЯ ПАНЕЛЬ: СТАТИСТИКА + ДЕТАЛИ */}
            <div className="w-1/3 min-w-[350px] bg-white border-r border-gray-200 flex flex-col shadow-xl z-10">

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

                {/* ДЕТАЛИ ВЫБРАННОГО БЛЮДА */}
                <div className="flex-1 overflow-y-auto relative bg-white">
                    {selectedPlanItem ? (
                        (() => {
                            const recipe = selectedPlanItem.recipe;
                            const stats = calculateItemStats(selectedPlanItem);
                            const ratio = stats.ratio;
                            const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
                            const member = selectedPlanItem.family_member;

                            return (
                                <div className="h-full flex flex-col">
                                    <div className="p-6 border-b border-gray-100 shrink-0">
                                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 block">
                                            Выбранное блюдо
                                        </span>
                                        <h2 className="text-2xl font-bold text-gray-800 leading-tight mb-2">
                                            {recipe.title}
                                        </h2>

                                        {member && (
                                            <div className={`inline-block mb-3 px-2 py-0.5 rounded text-xs font-bold text-white bg-${member.color}-500`}>
                                                Для: {member.name}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                                                €{stats.cost.toFixed(2)}
                                            </span>
                                            <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold border border-orange-200">
                                                {stats.cals} ккал
                                            </span>
                                            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200" title="Белки">
                                                Б: {stats.prot}г
                                            </span>
                                            <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200" title="Жиры">
                                                Ж: {stats.fat}г
                                            </span>
                                            <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200" title="Углеводы">
                                                У: {stats.carb}г
                                            </span>
                                            <span className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200">
                                                {selectedPlanItem.portions} порц.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6">
                                        <h3 className="font-bold text-gray-800 text-sm mb-2 border-b pb-1">Способ приготовления</h3>
                                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm mb-6">
                                            {recipe.description || "Описание приготовления отсутствует."}
                                        </p>

                                        <h3 className="font-bold text-gray-800 text-sm mb-2 border-b pb-1">
                                            Ингредиенты (на {selectedPlanItem.portions} порц.)
                                        </h3>

                                        {!hasIngredients ? (
                                            <div className="text-gray-400 italic text-sm">В этом рецепте нет ингредиентов.</div>
                                        ) : (
                                            <ul className="space-y-2">
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
                                                        <li key={ing.id} className="flex justify-between items-center text-gray-700 bg-gray-50 p-2 rounded text-sm">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{ing.product?.name}</span>
                                                                <span className="text-[10px] text-gray-400 font-bold">
                                                                    {itemCals} ккал
                                                                </span>
                                                            </div>
                                                            <span className="font-mono bg-white px-2 py-0.5 rounded border text-xs">
                                                                {parseFloat(scaledQty.toFixed(2))} {ing.product?.unit}
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            <span className="text-4xl mb-4 opacity-30">👈</span>
                            <p className="text-sm max-w-xs">Выберите блюдо справа, чтобы увидеть рецепт.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ПРАВАЯ ПАНЕЛЬ: ЛЕНТА БЛЮД */}
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

                <div className="space-y-4 max-w-4xl pb-10">
                    {MEALS_ORDER.map((meal) => {
                        // ИЗМЕНЕНИЕ: Теперь мы ищем ВСЕ блюда этого типа, а не одно
                        const items = todayItems.filter(item => item.meal_type === meal.id);

                        if (items.length === 0) {
                            return (
                                <div key={meal.id} className="flex gap-4 items-center opacity-30 hover:opacity-60 transition-opacity select-none group">
                                    <div className="w-32 text-right text-xs font-bold text-gray-500 uppercase tracking-wider py-2 group-hover:text-gray-700">{meal.label}</div>
                                    <div className="flex-1 border-t-2 border-dashed border-gray-300 h-0"></div>
                                </div>
                            );
                        }

                        return (
                            <div key={meal.id} className="flex gap-6 items-stretch group">
                                <div className="w-32 text-right pt-6 shrink-0">
                                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 scale-105">
                                        {meal.label}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col gap-3">
                                    {items.map(item => {
                                        const isActive = selectedItemId === item.id;
                                        const stats = calculateItemStats(item);
                                        const member = item.family_member;

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedItemId(item.id)}
                                                className={`rounded-xl p-5 cursor-pointer border-2 transition-all duration-200 ${isActive ? 'bg-white border-indigo-500 ring-4 ring-indigo-50 shadow-xl scale-[1.01]' : 'bg-white border-transparent hover:border-indigo-200 hover:shadow-md shadow-sm'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <h3 className={`text-xl font-bold mb-2 ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>{item.recipe.title}</h3>
                                                    {isActive && <span className="text-indigo-500 text-xl animate-pulse">●</span>}
                                                </div>

                                                {member && (
                                                    <div className={`inline-block mb-2 px-2 py-0.5 rounded text-xs font-bold text-white bg-${member.color}-500`}>
                                                        {member.name}
                                                    </div>
                                                )}

                                                <div className="flex gap-3 text-sm text-gray-500 mt-2">
                                                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">💶 €{stats.cost.toFixed(2)}</span>
                                                    <span className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded text-orange-700 font-medium">🔥 {stats.cals} ккал</span>
                                                    <span className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded text-indigo-700 text-xs">🍽 {item.portions} порц.</span>
                                                </div>
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
    );
};

export default TodayPage;