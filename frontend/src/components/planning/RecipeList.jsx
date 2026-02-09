import React, { useMemo } from 'react';
import RecipeCard from './RecipeCard';

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
                        {section.items.map(recipe => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                viewMode={viewMode}
                                isPinned={highlightedIds.includes(recipe.id)}
                                toggleHighlight={toggleHighlight}
                                hideRecipe={hideRecipe}
                                updatePortion={updatePortion}
                                plannedPortion={plannedPortions[recipe.id]}
                                defaultPortion={getDefaultPortion(recipe)}
                            />
                        ))}

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

export default React.memo(RecipeList);
