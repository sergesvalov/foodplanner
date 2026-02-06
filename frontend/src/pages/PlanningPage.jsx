import React, { useState } from 'react';
import { usePlanning } from '../hooks/usePlanning';
import { WEEK_DAYS, MEAL_TYPES } from '../constants/planning';
import PlanningHeader from '../components/planning/PlanningHeader';
import RecipeList from '../components/planning/RecipeList';
import WeeklyBoard from '../components/planning/WeeklyBoard';

const PlanningPage = () => {
    const {
        hiddenIds,
        highlightedIds,
        plannedPortions,
        plannedMeals,
        visibleRecipes,
        recipes,
        familyMembers,
        updatePortion,
        toggleHighlight,
        hideRecipe,
        restoreAll,
        addMeal,
        removeMeal,
        removeMealByInstance,
        getRecipesByCategories,
        getTotalStats,
        getScheduledStats,
        getDefaultPortion,
        autoDistribute,
        moveMeal
    } = usePlanning();

    // View Mode: 'browse' | 'summary' | 'days'
    const [viewMode, setViewMode] = useState('browse');

    // Prepare data for UI
    const recipesToShow = visibleRecipes;

    // Define columns dynamically
    const sections = [
        {
            title: 'Завтрак',
            icon: '🍳',
            items: getRecipesByCategories(['breakfast', 'snack'], 'Завтрак', recipesToShow),
            color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        },
        {
            title: 'Обед',
            icon: '🍲',
            items: getRecipesByCategories(['soup', 'main'], 'Обед', recipesToShow),
            color: 'bg-orange-50 border-orange-200 text-orange-800'
        },
        {
            title: 'Ужин',
            icon: '🍽️',
            items: getRecipesByCategories(['main', 'side'], 'Ужин', recipesToShow),
            color: 'bg-blue-50 border-blue-200 text-blue-800'
        }
    ];

    const totalStats = viewMode === 'days'
        ? getScheduledStats()
        : getTotalStats(recipesToShow);

    // Helper for slots
    const getOptionsForSlot = (typeCategories) => {
        // Here we filter 'plannedRecipes' which in original code was 'recipes.filter(!hidden)'.
        // 'visibleRecipes' is exactly that from the hook.
        return visibleRecipes.filter(r => typeCategories.includes(r.category));
    };

    return (
        <div className="container mx-auto max-w-7xl p-4 h-[calc(100vh-4rem)] flex flex-col">
            <PlanningHeader
                viewMode={viewMode}
                setViewMode={setViewMode}
                hiddenCount={hiddenIds.length}
                restoreAll={restoreAll}
                autoDistribute={autoDistribute}
                totalStats={totalStats}
            />

            {viewMode !== 'days' ? (
                <RecipeList
                    sections={sections}
                    viewMode={viewMode}
                    highlightedIds={highlightedIds}
                    toggleHighlight={toggleHighlight}
                    hideRecipe={hideRecipe}
                    updatePortion={updatePortion}
                    plannedPortions={plannedPortions}
                    getDefaultPortion={getDefaultPortion}
                />
            ) : (
                <WeeklyBoard
                    weekDays={WEEK_DAYS}
                    mealTypes={MEAL_TYPES}
                    plannedMeals={plannedMeals}
                    getOptionsForSlot={getOptionsForSlot}
                    addMeal={addMeal}
                    removeMeal={removeMeal}
                    removeMealByInstance={removeMealByInstance}
                    recipes={recipes} // Need full list to find by ID
                    familyMembers={familyMembers}
                    moveMeal={moveMeal}
                />
            )}
        </div>
    );
};

export default PlanningPage;
