import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const EXTRA_KEY = 'Вкусняшки';
const EXTRA_MEAL_TYPE = 'yummy';

const MEALS = [
    { id: 'takeaway', label: '🎒 Взять с собой', color: 'bg-teal-50 border-teal-100', isSnack: true },
    { id: 'pre_breakfast', label: 'Ранний старт', color: 'bg-orange-50 border-orange-100', isSnack: true },
    { id: 'breakfast', label: 'Завтрак', color: 'bg-yellow-50 border-yellow-100', isSnack: false },
    { id: 'morning_snack', label: '2-й завтрак', color: 'bg-purple-50 border-purple-100', isSnack: true },
    { id: 'lunch', label: 'Обед', color: 'bg-green-50 border-green-100', isSnack: false },
    { id: 'afternoon_snack', label: 'Полдник', color: 'bg-pink-50 border-pink-100', isSnack: true },
    { id: 'dinner', label: 'Ужин', color: 'bg-blue-50 border-blue-100', isSnack: false },
    { id: 'late_snack', label: 'Поздний ужин', color: 'bg-indigo-50 border-indigo-100', isSnack: true },
];

const VIEW_MODES = [
    { id: 'week', label: 'Вся неделя' },
    { id: 'work', label: 'Рабочие дни' },
    { id: 'weekend', label: 'Выходные' },
    { id: 'today', label: 'Сегодня' },
    { id: 'extra', label: '🍪 Вкусняшки' },
];

const WeeklyGrid = ({ selectedUser, onUserChange }) => {
    const [plan, setPlan] = useState([]);
    const [users, setUsers] = useState([]);
    const [pendingDrop, setPendingDrop] = useState(null);

    const [currentDate, setCurrentDate] = useState(new Date());

    const [viewMode, setViewMode] = useState('week');
    // const [selectedUser, setSelectedUser] = useState('all'); // Moved to parent

    // --- ХЕЛПЕР ДЛЯ ДАТ ---
    const getWeekDays = (baseDate) => {
        const currentDay = baseDate.getDay(); // 0-Sun, 1-Mon...
        // Корректировка: если воскресенье (0), считаем его 7-м днем, чтобы неделя начиналась с Пн
        const dayIndex = currentDay === 0 ? 6 : currentDay - 1;

        // Понедельник текущей недели
        const monday = new Date(baseDate);
        monday.setDate(baseDate.getDate() - dayIndex);

        return DAYS.map((d, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yyyy = date.getFullYear();
            return {
                name: d,
                dateObj: date,
                dateStr: `${yyyy}-${mm}-${dd}`,
                display: `${dd}.${mm}`
            };
        });
    };

    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

    const fetchPlan = () => {
        const start = weekDays[0].dateStr;
        const end = weekDays[6].dateStr;

        fetch(`/api/plan/?start_date=${start}&end_date=${end}`)
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setPlan(data); else setPlan([]); })
            .catch(err => { console.error(err); setPlan([]); });
    };

    const fetchUsers = () => {
        fetch('/api/admin/family').then(res => res.json()).then(setUsers).catch(console.error);
    };

    const filteredPlan = useMemo(() => {
        if (selectedUser === 'all') return plan;
        return plan.filter(p => p.family_member_id === parseInt(selectedUser));
    }, [plan, selectedUser]);

    const visibleColumns = useMemo(() => {
        switch (viewMode) {
            case 'work': return DAYS.slice(0, 5);
            case 'weekend': return DAYS.slice(5, 7);
            case 'today':
                const dayIndex = new Date().getDay();
                const mapIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                return [DAYS[mapIndex]];
            case 'extra': return [EXTRA_KEY];
            case 'week':
            default: return [...DAYS];
        }
    }, [viewMode]);

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleGoToday = () => {
        setCurrentDate(new Date());
    };

    const handleDateChange = (e) => {
        const date = new Date(e.target.value);
        if (!isNaN(date.getTime())) {
            setCurrentDate(date);
        }
    };

    useEffect(() => {
        fetchPlan();
        fetchUsers();
    }, [currentDate]);
    // -----------------------


    // -----------------------

    const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-indigo-300', 'bg-white'); };
    const handleDragLeave = (e) => { e.currentTarget.classList.remove('ring-2', 'ring-indigo-300', 'bg-white'); };

    const handleDrop = (e, dayObj, mealType) => {
        e.preventDefault();
        e.currentTarget.classList.remove('ring-2', 'ring-indigo-300', 'bg-white');
        const data = e.dataTransfer.getData('recipeData');
        if (!data) return;

        try {
            const recipe = JSON.parse(data);
            console.log("Drop:", { dayObj, mealType, recipe });

            // dayObj - это объект { name, dateObj, dateStr, display }
            // Если dropped on Extra key (string), use monday or today
            let dateToUse, dayName;

            if (typeof dayObj === 'string') {
                // Это случай EXTRA_KEY ("Вкусняшки")
                dateToUse = weekDays[0]?.dateStr || new Date().toISOString().split('T')[0];
                dayName = dayObj;
            } else if (dayObj) {
                // Нормальный случай
                dateToUse = dayObj.dateStr;
                dayName = dayObj.name;
            } else {
                // Fallback (не должно случаться, но если dayObj undefined)
                console.error("dayObj is undefined");
                alert("Ошибка: не удалось определить дату.");
                return;
            }

            if (selectedUser !== 'all') {
                confirmAdd(dayName, dateToUse, mealType, recipe.id, parseInt(selectedUser));
            } else {
                if (users.length === 0) confirmAdd(dayName, dateToUse, mealType, recipe.id, null);
                else setPendingDrop({ dayName, date: dateToUse, mealType, recipeId: recipe.id });
            }
        } catch (err) {
            console.error("Error in handleDrop:", err);
            alert("Ошибка при добавлении: " + err.message);
        }
    };

    const confirmAdd = async (day, date, mealType, recipeId, userId) => {
        try {
            const res = await fetch('/api/plan/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    day_of_week: day,
                    meal_type: mealType,
                    recipe_id: recipeId,
                    portions: 1,
                    family_member_id: userId,
                    date: date // Передаем дату!
                })
            });
            if (res.ok) fetchPlan();
        } catch (err) { console.error(err); }
        setPendingDrop(null);
    };

    const handleRemove = async (itemId) => {
        if (!window.confirm("Удалить?")) return;
        await fetch(`/api/plan/${itemId}`, { method: 'DELETE' }); fetchPlan();
    };

    const debounceTimers = useRef({});

    const handlePortionChange = (itemId, newPortions, save = true) => {
        if (newPortions < 1 || newPortions > 9) return;
        const val = parseInt(newPortions);

        // Update local state immediately
        setPlan(prevPlan => prevPlan.map(item => item.id === itemId ? { ...item, portions: val } : item));

        if (save) {
            // Clear previous timer for this item
            if (debounceTimers.current[itemId]) {
                clearTimeout(debounceTimers.current[itemId]);
            }

            // Set new timer
            debounceTimers.current[itemId] = setTimeout(async () => {
                try {
                    console.log(`Saving new portions ${val} for item ${itemId}...`);
                    const res = await fetch(`/api/plan/${itemId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ portions: val })
                    });

                    if (!res.ok) {
                        console.error("Save failed", res.status);
                        fetchPlan();
                    }
                    delete debounceTimers.current[itemId];
                } catch (e) {
                    console.error(e);
                    fetchPlan();
                }
            }, 500); // 500ms delay
        }
    };


    const handleUserChange = async (itemId, userId) => {
        const parsedId = parseInt(userId);
        // Optimistic update
        setPlan(plan.map(item => {
            if (item.id === itemId) {
                const user = users.find(u => u.id === parsedId);
                return { ...item, family_member_id: parsedId, family_member: user };
            }
            return item;
        }));

        try {
            const res = await fetch(`/api/plan/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ family_member_id: parsedId })
            });
            if (!res.ok) { console.error("Save failed", res.status); fetchPlan(); }
        } catch (e) { console.error(e); fetchPlan(); }
    };

    const calculateItemStats = (item) => {
        const recipe = item.recipe;
        if (!recipe) return { cost: 0, cals: 0, prot: 0, fat: 0, carb: 0 };
        const ratio = (item.portions || 1) / (recipe.portions || 1);

        // Используем готовые суммы с бэкенда (там уже учтен вес штук и т.д.)
        return {
            cost: (recipe.total_cost || 0) * ratio,
            cals: Math.round((recipe.total_calories || 0) * ratio),
            prot: Math.round((recipe.total_proteins || 0) * ratio),
            fat: Math.round((recipe.total_fats || 0) * ratio),
            carb: Math.round((recipe.total_carbs || 0) * ratio)
        };
    };

    // --- ИЗМЕНЕНИЕ: Статистика считается только по видимым колонкам ---
    const viewStats = useMemo(() => {
        return filteredPlan.reduce((acc, item) => {
            // Проверяем, отображается ли день недели этого блюда сейчас
            if (visibleColumns.includes(item.day_of_week)) {
                const s = calculateItemStats(item);
                return { cost: acc.cost + s.cost, cals: acc.cals + s.cals };
            }
            return acc;
        }, { cost: 0, cals: 0 });
    }, [filteredPlan, visibleColumns]); // Зависит от плана и текущего режима просмотра

    return (
        <div className="w-full flex flex-col bg-gray-100 rounded-lg border border-gray-300 relative h-auto shadow-sm">

            {pendingDrop && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Кто будет это есть?</h3>
                        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                            {users.map(u => (
                                <button key={u.id} onClick={() => confirmAdd(pendingDrop.dayName, pendingDrop.date, pendingDrop.mealType, pendingDrop.recipeId, u.id)}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left group">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase bg-${u.color}-500 shadow-sm`}>{u.name[0]}</div>
                                    <span className="font-medium text-gray-700">{u.name}</span>
                                </button>
                            ))}
                            <button onClick={() => confirmAdd(pendingDrop.dayName, pendingDrop.date, pendingDrop.mealType, pendingDrop.recipeId, null)}
                                className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 hover:bg-gray-50 text-left">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">?</div>
                                <span className="font-medium text-gray-500">Общее (Без имени)</span>
                            </button>
                        </div>
                        <button onClick={() => setPendingDrop(null)} className="mt-4 w-full py-2 text-gray-500 hover:bg-gray-100 rounded text-sm font-medium">Отмена</button>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-white p-3 border-b border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center shadow-sm z-20 rounded-t-lg gap-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
                    <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2 whitespace-nowrap">
                        📅 План
                        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                            <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors">←</button>
                            <button onClick={handleGoToday} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded font-medium text-sm hover:bg-indigo-100 transition-colors">Сегодня</button>
                            {/* Выбор даты */}
                            <input
                                type="date"
                                className="p-1 border border-gray-200 rounded text-sm text-gray-600 focus:ring-2 focus:ring-indigo-100 outline-none"
                                value={currentDate.toISOString().split('T')[0]}
                                onChange={handleDateChange}
                            />
                            <button onClick={handleNextWeek} className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors">→</button>
                        </div>
                        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            {filteredPlan.length} блюд
                        </span>
                    </h2>

                    <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                        <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
                            {VIEW_MODES.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setViewMode(mode.id)}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${viewMode === mode.id
                                        ? 'bg-white text-gray-800 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                            <span className="text-xs font-bold text-gray-400">Для:</span>
                            <select
                                className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer w-full md:w-auto min-w-[100px]"
                                value={selectedUser}
                                onChange={(e) => onUserChange(e.target.value)}
                            >
                                <option value="all">👨‍👩‍👧‍👦 Всех</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 self-end xl:self-auto">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Бюджет</span>
                        {/* Используем viewStats вместо weeklyStats */}
                        <span className="text-lg font-bold text-green-600 leading-none">€{viewStats.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Калории</span>
                        {/* Используем viewStats вместо weeklyStats */}
                        <span className="text-lg font-bold text-orange-600 leading-none">{viewStats.cals}</span>
                    </div>
                </div>
            </div>

            {/* GRID */}
            <div className="overflow-x-auto overflow-y-visible pb-12">
                <div
                    className="grid divide-x divide-gray-300 min-w-full"
                    style={{
                        gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(${viewMode === 'week' ? '150px' : '0'}, 1fr))`
                    }}
                >
                    {visibleColumns.map((colName) => {
                        const isExtra = colName === EXTRA_KEY;
                        // Находим объект дня из weekDays. Если это EXTRA_KEY, то дня нет.
                        const dayObj = isExtra ? null : weekDays.find(d => d.name === colName);

                        // Фильтруем элементы: совпадают по дню недели И по дате (если дата есть в плане)
                        const items = filteredPlan.filter(p => {
                            if (isExtra) return p.day_of_week === EXTRA_KEY;
                            // Если у элемента есть дата, сравниваем её. Если нет (старые записи), фолбек на день недели
                            if (p.date) return p.date === dayObj?.dateStr;
                            return p.day_of_week === colName;
                        });

                        const stats = items.reduce((acc, i) => { const s = calculateItemStats(i); return { cost: acc.cost + s.cost, cals: acc.cals + s.cals }; }, { cost: 0, cals: 0 });

                        return (
                            <div key={colName} className={`flex flex-col h-auto relative group min-w-0 ${isExtra ? 'bg-indigo-50/30' : 'bg-white'}`}>

                                <div className={`py-2 flex flex-col items-center justify-center border-b border-gray-600 gap-1 ${isExtra ? 'bg-indigo-700' : 'bg-gray-800'}`}>
                                    <span className="font-bold text-xs uppercase tracking-wider text-white">
                                        {isExtra ? '🍪 Вкусняшки' : (
                                            <>
                                                {colName} <span className="opacity-70 text-[10px] ml-1">{dayObj?.display}</span>
                                            </>
                                        )}
                                    </span>
                                    <div className="flex gap-1">
                                        <div className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${items.length > 0 ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>€{stats.cost.toFixed(2)}</div>
                                        <div className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${items.length > 0 ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}`}>{stats.cals}</div>
                                    </div>
                                </div>

                                <div className="p-1 space-y-1 h-full">
                                    {isExtra ? (
                                        <div className="min-h-[300px] h-full border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/50 flex flex-col p-2 gap-2 hover:bg-indigo-100/50"
                                            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, colName, EXTRA_MEAL_TYPE)}>
                                            {items.map(item => <PlanItemCard key={item.id} item={item} onRemove={handleRemove} onPortionChange={handlePortionChange} onUserChange={handleUserChange} calculateStats={calculateItemStats} users={users} />)}
                                        </div>
                                    ) : (
                                        MEALS.map((meal) => {
                                            const slotItems = items.filter(p => p.meal_type === meal.id);
                                            const isCompact = meal.isSnack && slotItems.length === 0;
                                            return (
                                                <div key={meal.id} className={`relative rounded border ${meal.color} ${isCompact ? 'h-8 opacity-50 hover:opacity-100 hover:h-auto border-dashed flex items-center justify-center' : 'min-h-[80px] pb-1 shadow-sm'}`}
                                                    onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, dayObj, meal.id)}>
                                                    {isCompact ? <span className="text-[9px] text-gray-400 uppercase font-bold">+ {meal.label}</span> : <div className="text-[9px] font-bold uppercase px-1.5 py-1 text-gray-500/80 mb-0.5">{meal.label}</div>}
                                                    {!isCompact && <div className="px-1 space-y-1">{slotItems.map(item => <PlanItemCard key={item.id} item={item} onRemove={handleRemove} onPortionChange={handlePortionChange} onUserChange={handleUserChange} calculateStats={calculateItemStats} users={users} />)}</div>}
                                                </div>
                                            );
                                        })
                                    )}
                                    <div className="h-10"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const PlanItemCard = ({ item, onRemove, onPortionChange, onUserChange, calculateStats, users }) => {
    if (!item.recipe) return null;
    const stats = calculateStats(item);
    const base = item.recipe.portions || 1;
    const u = item.family_member;

    return (
        <div className={`relative flex flex-col bg-white rounded border border-gray-200 shadow-sm p-1.5 group/item hover:border-indigo-300 ${u ? `border-l-4 border-l-${u.color}-500` : ''}`}>
            <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover/item:opacity-100 shadow-sm hover:bg-red-500 hover:text-white z-20">×</button>
            <span className="text-[11px] text-gray-800 font-medium leading-tight line-clamp-2" title={item.recipe.title}>{item.recipe.title}</span>
            {u ? (
                <div className={`text-[9px] px-1 rounded-sm inline-block mt-0.5 font-bold text-white bg-${u.color}-500 self-start`}>{u.name}</div>
            ) : (
                <select
                    className="text-[9px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5 mt-0.5 outline-none cursor-pointer max-w-full text-gray-500 hover:bg-white focus:ring-1 focus:ring-indigo-100"
                    onChange={(e) => onUserChange(item.id, e.target.value)}
                    defaultValue=""
                    onClick={(e) => e.stopPropagation()}
                    title="Назначить кому"
                >
                    <option value="" disabled>Кому?</option>
                    {users && users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
            )}
            <div className="flex items-center gap-1 mt-1 bg-gray-50 rounded px-1 py-0.5 justify-between">
                <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-400">Порц:</span>
                    <input
                        type="number"
                        min="1"
                        max="9"
                        className="w-8 h-4 text-[10px] font-bold text-center border rounded focus:ring-1 focus:ring-indigo-300 outline-none p-0"
                        value={item.portions || 1}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            // Validates 1-9 and saves immediately
                            if (val >= 1 && val <= 9) onPortionChange(item.id, val, true);
                        }}
                    />
                </div>
                {base > 1 && <span className="text-[8px] text-gray-400">(из {base})</span>}
            </div>
            <div className="flex justify-between items-end mt-1">
                <span className="text-[9px] text-green-600 font-bold">€{stats.cost.toFixed(2)}</span>
                <div className="flex gap-1">
                    <span className="text-[8px] text-blue-600 bg-blue-50 px-0.5 rounded" title="Белки">Б{stats.prot}</span>
                    <span className="text-[8px] text-yellow-600 bg-yellow-50 px-0.5 rounded" title="Жиры">Ж{stats.fat}</span>
                    <span className="text-[8px] text-red-600 bg-red-50 px-0.5 rounded" title="Углеводы">У{stats.carb}</span>
                    <span className="text-[9px] text-orange-600 ml-1">{stats.cals}</span>
                </div>
            </div>
        </div>
    );
};

export default WeeklyGrid;