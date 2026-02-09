import React from 'react';
import MealItem from './MealItem';

const MealSlot = ({
    dayIndex,
    type,
    meals,
    getOptionsForSlot,
    addMeal,
    removeMealByInstance,
    recipes,
    familyMembers,
    updateMealMember,
    onDragOver,
    onDrop,
    selectedUser
}) => {

    const options = getOptionsForSlot(type.categories);

    return (
        <div
            className="space-y-1 min-h-[60px]"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, dayIndex, type.id)}
        >
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{type.title}</div>
            <div className="space-y-1">
                {meals.map((pm, pmIdx) => (
                    <MealItem
                        key={pmIdx} // Ideally use unique ID, but pmIdx works if list is stable-ish
                        mealInstance={pm}
                        recipe={recipes.find(x => x.id === pm.recipeId)}
                        familyMembers={familyMembers}
                        updateMealMember={updateMealMember}
                        removeMealByInstance={removeMealByInstance}
                    />
                ))}

                {/* Add Helper */}
                <div className="relative group">
                    <select
                        className="w-full text-xs border border-dashed border-gray-300 rounded p-1.5 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent cursor-pointer"
                        value=""
                        onChange={(e) => {
                            if (e.target.value) {
                                const memberId = selectedUser === 'all' ? undefined : parseInt(selectedUser);
                                addMeal(dayIndex, type.id, parseInt(e.target.value), memberId);
                            }
                        }}
                    >
                        <option value="">+ Добавить</option>
                        {options.map(opt => (
                            <option key={opt.id} value={opt.id}>
                                {opt.title} ({Math.round(opt.calories_per_portion)} ккал)
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default React.memo(MealSlot);
