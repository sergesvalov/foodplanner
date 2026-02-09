import React, { useState, useCallback } from 'react';
import UserSelectionModal from './UserSelectionModal';
import DayColumn from './DayColumn';

const WeeklyBoard = ({
    weekDays,
    mealTypes,
    plannedMeals,
    getOptionsForSlot,
    addMeal,
    removeMeal,
    removeMealByInstance,
    recipes,
    familyMembers,
    moveMeal,
    selectedUser = 'all',
    updateMealMember
}) => {
    const [pendingDrop, setPendingDrop] = useState(null);

    // DRAG HANDLERS
    // Note: handleDragStart is now inside MealItem

    // DayColumn will handle dragOver and drop to get coordinates

    const handleDrop = useCallback((e, dayIndex, typeId) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        try {
            const parsed = JSON.parse(data);

            if (parsed.isNew) {
                if (selectedUser === 'all') {
                    // Open Modal to ask "Who is this for?"
                    setPendingDrop({
                        dayIndex,
                        typeId,
                        recipeId: parsed.recipeId
                    });
                } else {
                    // Assign to specific selected user
                    const memberId = parseInt(selectedUser);
                    addMeal(dayIndex, typeId, parsed.recipeId, memberId);
                }
            } else {
                // Existing meal move
                moveMeal(parsed, dayIndex, typeId);
            }
        } catch (err) {
            console.error("Failed to parse drag data", err);
        }
    }, [selectedUser, addMeal, moveMeal]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleModalSelect = (target) => {
        if (!pendingDrop) return;
        const { dayIndex, typeId, recipeId } = pendingDrop;

        if (target === 'all') {
            if (familyMembers.length > 0) {
                familyMembers.forEach(member => {
                    addMeal(dayIndex, typeId, recipeId, member.id);
                });
            } else {
                addMeal(dayIndex, typeId, recipeId, undefined);
            }
        } else {
            addMeal(dayIndex, typeId, recipeId, target);
        }
        setPendingDrop(null);
    };

    return (
        <>
            <UserSelectionModal
                isOpen={!!pendingDrop}
                onClose={() => setPendingDrop(null)}
                onSelect={handleModalSelect}
                familyMembers={familyMembers}
            />
            <div className="flex gap-4 flex-1 overflow-auto pb-10 items-start">
                {weekDays.map((dayName, dIdx) => (
                    <DayColumn
                        key={dIdx}
                        dayIndex={dIdx}
                        dayName={dayName}
                        mealTypes={mealTypes}
                        plannedMeals={plannedMeals.filter(pm => pm.day === dIdx)}
                        getOptionsForSlot={getOptionsForSlot}
                        addMeal={addMeal}
                        removeMeal={removeMeal}
                        removeMealByInstance={removeMealByInstance}
                        recipes={recipes}
                        familyMembers={familyMembers}
                        moveMeal={moveMeal}
                        selectedUser={selectedUser}
                        updateMealMember={updateMealMember}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    />
                ))}
            </div>
        </>
    );
};

export default React.memo(WeeklyBoard);
