import React from 'react';

const MealItem = ({
    mealInstance,
    recipe,
    familyMembers,
    updateMealMember,
    removeMealByInstance
}) => {

    if (!recipe) return null;

    const member = familyMembers.find(f => f.id === mealInstance.memberId);
    const colorClass = member ? `bg-${member.color}-500` : 'bg-gray-400';
    const letter = member ? member.name[0] : (mealInstance.memberId ? '?' : '');

    const handleDragStart = (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(mealInstance));
    };

    return (
        <div
            className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-2 rounded text-sm relative group cursor-grab active:cursor-grabbing hover:bg-indigo-100 transition-colors"
            draggable
            onDragStart={handleDragStart}
        >
            <div className="flex items-center gap-2 overflow-hidden">
                {letter && (
                    <div
                        className={`w-5 h-5 rounded-full ${colorClass} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm cursor-pointer hover:scale-110 transition-transform`}
                        title={`${member?.name || 'Нет имени'} (Нажмите, чтобы сменить)`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!familyMembers.length) return;
                            const currentIdx = familyMembers.findIndex(f => f.id === mealInstance.memberId);
                            const nextIdx = (currentIdx + 1) % familyMembers.length;
                            const nextMember = familyMembers[nextIdx];
                            updateMealMember(mealInstance, nextMember.id);
                        }}
                    >
                        {letter}
                    </div>
                )}
                <span className="truncate" title={recipe.title}>{recipe.title}</span>
            </div>

            <div className="flex items-center">
                {mealInstance.portions && mealInstance.portions !== 1 && (
                    <span className="text-[10px] text-gray-400 mr-1">x{mealInstance.portions}</span>
                )}

                <button
                    onClick={() => removeMealByInstance(mealInstance)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default React.memo(MealItem);
