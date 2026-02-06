import React from 'react';

const PlanningHeader = ({
    viewMode,
    setViewMode,
    hiddenCount,
    restoreAll,
    autoDistribute,
    totalStats
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
