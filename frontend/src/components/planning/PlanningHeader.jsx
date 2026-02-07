import React from 'react';

const PlanningHeader = ({
    viewMode,
    setViewMode,
    hiddenCount,
    restoreAll,
    autoDistribute,
    totalStats,
    users = [],
    selectedUser = 'all',
    setSelectedUser = () => { },
    savePlanToNextWeek
}) => {
    return (
        <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-2xl font-bold text-gray-800">
                {viewMode === 'browse' && 'Планирование меню'}
                {viewMode === 'days' && 'По дням недели'}
            </h2>

            <div className="flex items-center gap-4">
                {viewMode === 'browse' && (
                    <>
                        {hiddenCount > 0 && (
                            <button
                                onClick={restoreAll}
                                className="text-sm text-indigo-600 hover:text-indigo-800 underline mr-4"
                            >
                                Показать скрытые ({hiddenCount})
                            </button>
                        )}
                        <button
                            onClick={() => setViewMode('days')}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                        >
                            Далее к дням →
                        </button>
                    </>
                )}

                {viewMode === 'days' && (
                    <>
                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm mr-4">
                            <span className="text-xs font-bold text-gray-400 pl-1">👤</span>
                            <select
                                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                            >
                                <option value="all">Все</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={savePlanToNextWeek}
                            className="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200 mr-4 font-medium transition-colors border border-green-200"
                            title="Сохранить текущий план на следующую неделю"
                        >
                            💾 Сохранить
                        </button>
                        <button
                            onClick={autoDistribute}
                            className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-200 mr-4 font-medium transition-colors"
                            title="Случайно распределить выбранные блюда по дням"
                        >
                            🪄 Авто-распределение
                        </button>

                        <div className="text-right mr-4 text-sm hidden md:block">
                            <span className="font-bold text-gray-900 block">€{totalStats.cost.toFixed(2)}</span>
                            <span className="text-gray-500 block">{Math.round(totalStats.calories)} ккал</span>
                        </div>
                        <button
                            onClick={() => setViewMode('browse')}
                            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                        >
                            ← Назад
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PlanningHeader;
