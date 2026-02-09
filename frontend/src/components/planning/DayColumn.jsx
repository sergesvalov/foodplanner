import React, { useMemo } from 'react';
import { calculateItemStats } from '../../utils/stats';
import MealSlot from './MealSlot';

const DayColumn = ({
    dayIndex,
    dayName,
    mealTypes,
    plannedMeals,
    getOptionsForSlot,
    addMeal,
    removeMeal,
    removeMealByInstance,
    recipes,
    familyMembers,
    moveMeal,
    selectedUser,
    updateMealMember,
    onDragOver,
    onDrop
}) => {

    const dayStats = useMemo(() => {
        return plannedMeals.reduce((acc, pm) => {
            const r = recipes.find(x => x.id === pm.recipeId);
            if (!r) return acc;
            const item = { recipe: r, portions: pm.portions || 1 };
            const s = calculateItemStats(item);
            return {
                cals: acc.cals + s.cals,
                cost: acc.cost + s.cost
            };
        }, { cals: 0, cost: 0 });
    }, [plannedMeals, recipes]);

    const isToday = useMemo(() => {
        const today = new Date().getDay(); // 0-Sun
        const currentIdx = today === 0 ? 6 : today - 1;
        return dayIndex === currentIdx;
    }, [dayIndex]);

    return (
        <div className={`bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden min-w-[300px] w-[300px] shrink-0 ${isToday ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}>
            <div className={`sticky top-0 z-10 p-3 border-b text-center font-bold flex justify-between items-center ${isToday ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-700'}`}>
                <span>{dayName}</span>
                <div className="flex flex-col text-right text-[10px] items-end leading-tight opacity-70">
                    <span>{Math.round(dayStats.cals)} ккал</span>
                    <span>€{dayStats.cost.toFixed(2)}</span>
                </div>
            </div>
            <div className="flex-1 p-3 space-y-4">
                {mealTypes.map(mType => (
                    <MealSlot
                        key={mType.id}
                        dayIndex={dayIndex}
                        type={mType}
                        meals={plannedMeals.filter(pm => pm.type === mType.id)}
                        getOptionsForSlot={getOptionsForSlot}
                        addMeal={addMeal}
                        removeMealByInstance={removeMealByInstance}
                        recipes={recipes}
                        familyMembers={familyMembers}
                        updateMealMember={updateMealMember}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        selectedUser={selectedUser}
                    />
                ))}
            </div>
        </div>
    );
};

export default React.memo(DayColumn);
