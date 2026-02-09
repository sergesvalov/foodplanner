import React from 'react';

const RecipeCard = ({
    recipe,
    viewMode,
    isPinned,
    toggleHighlight,
    hideRecipe,
    updatePortion,
    plannedPortion,
    defaultPortion
}) => {
    return (
        <div
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
                                {plannedPortion || defaultPortion}
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
                            {Math.round(recipe.calories_per_portion * (plannedPortion || defaultPortion))} ккал
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-100">
                            €{((recipe.total_cost / (recipe.portions || 1)) * (plannedPortion || defaultPortion)).toFixed(2)}
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                            {Math.round(recipe.calories_per_portion)} ккал
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100" title="Белки / Жиры / Углеводы на порцию">
                            Б:{Math.round((recipe.total_proteins || 0) / (recipe.portions || 1))} Ж:{Math.round((recipe.total_fats || 0) / (recipe.portions || 1))} У:{Math.round((recipe.total_carbs || 0) / (recipe.portions || 1))}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                            {plannedPortion || defaultPortion} порц.
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                            €{recipe.total_cost}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};

export default React.memo(RecipeCard);
