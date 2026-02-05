import React from 'react';

const RecipeList = ({
    sections,
    viewMode,
    highlightedIds,
    toggleHighlight,
    hideRecipe,
    updatePortion,
    plannedPortions,
    getDefaultPortion
}) => {

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
            {sections.map((section, idx) => (
                <div key={idx} className={`rounded-xl border ${section.color} flex flex-col h-full overflow-hidden shadow-sm`}>
                    {/* Header */}
                    <div className="p-4 border-b border-black/5 font-bold text-lg flex items-center gap-2 bg-white/50 shrink-0">
                        <span>{section.icon}</span>
                        {section.title}
                        <span className="ml-auto text-xs opacity-60 bg-black/10 px-2 py-0.5 rounded-full">
                            {section.items.length}
                        </span>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {section.items.map(recipe => {
                            const isPinned = highlightedIds.includes(recipe.id);
                            return (
                                <div
                                    key={recipe.id}
                                    className={`p-3 rounded-lg shadow-sm border transition-all cursor-pointer group relative
                                    ${isPinned
                                            ? 'bg-green-50 border-green-300 shadow-md ring-1 ring-green-200'
                                            : 'bg-white border-black/5 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">
                                                {recipe.title}
                                            </h4>
                                            {viewMode === 'summary' && (
                                                <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        className="w-6 h-6 rounded bg-gray-100 border flex items-center justify-center hover:bg-gray-200"
                                                        onClick={() => updatePortion(recipe.id, -0.5)}
                                                    >-</button>
                                                    <span className="text-sm font-medium w-8 text-center">
                                                        {plannedPortions[recipe.id] || getDefaultPortion(recipe)}
                                                    </span>
                                                    <button
                                                        className="w-6 h-6 rounded bg-gray-100 border flex items-center justify-center hover:bg-gray-200"
                                                        onClick={() => updatePortion(recipe.id, 0.5)}
                                                    >+</button>
                                                    <span className="text-xs text-gray-500 ml-1">порций</span>
                                                </div>
                                            )}
                                        </div>

                                        {recipe.rating > 0 && (
                                            <span className="text-[10px] text-yellow-500 shrink-0 ml-1">
                                                {'⭐'.repeat(recipe.rating)}
                                            </span>
                                        )}
                                    </div>
                                    {viewMode === 'browse' && (
                                        <button
                                            onClick={(e) => hideRecipe(e, recipe.id)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                                            title="Скрыть из планирования"
                                        >
                                            ❌
                                        </button>
                                    )}

                                    {viewMode === 'browse' && (
                                        <button
                                            onClick={(e) => toggleHighlight(e, recipe.id)}
                                            className={`absolute top-2 right-8 transition-all p-1 ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 grayscale hover:grayscale-0'}`}
                                            title={isPinned ? "Открепить" : "Закрепить"}
                                        >
                                            📌
                                        </button>
                                    )}

                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {viewMode === 'summary' ? (
                                            <>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                                    {Math.round(recipe.calories_per_portion * (plannedPortions[recipe.id] || getDefaultPortion(recipe)))} ккал
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-100">
                                                    €{(recipe.total_cost * (plannedPortions[recipe.id] || getDefaultPortion(recipe))).toFixed(2)}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                                    {recipe.calories_per_portion} ккал
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                                    €{recipe.total_cost}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {section.items.length === 0 && (
                            <div className="text-center text-sm opacity-50 py-10 italic">
                                {viewMode === 'browse' ? 'Нет рецептов' : 'Ничего не выбрано'}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RecipeList;
