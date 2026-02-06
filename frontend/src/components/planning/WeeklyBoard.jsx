import React from 'react';

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
    moveMeal
}) => {

    // DRAG HANDLERS
    const handleDragStart = (e, mealInstance) => {
        // We serialize the meal instance to move
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(mealInstance));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dayIndex, typeId) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        try {
            const mealInstance = JSON.parse(data);
            // Call moveMeal
            moveMeal(mealInstance, dayIndex, typeId);
        } catch (err) {
            console.error("Failed to parse drag data", err);
        }
    };

    return (
        <div className="flex gap-4 flex-1 overflow-auto pb-10 items-start">
            {weekDays.map((dayName, dIdx) => (
                <div key={dIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden min-w-[300px] w-[300px] shrink-0">
                    <div className="bg-gray-50 sticky top-0 z-10 p-3 border-b text-center font-bold text-gray-700">
                        {dayName}
                    </div>
                    <div className="flex-1 p-3 space-y-4">
                        {mealTypes.map(mType => {
                            // Get meals planned for this day & type
                            const mealsInSlot = plannedMeals.filter(pm => pm.day === dIdx && pm.type === mType.id);
                            const options = getOptionsForSlot(mType.categories);

                            return (
                                <div
                                    key={mType.id}
                                    className="space-y-1 min-h-[60px]"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, dIdx, mType.id)}
                                >
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{mType.title}</div>
                                    <div className="space-y-1">
                                        {mealsInSlot.map((pm, pmIdx) => {
                                            const r = recipes.find(x => x.id === pm.recipeId);
                                            if (!r) return null;

                                            // Find member info if present
                                            const member = familyMembers.find(f => f.id === pm.memberId);
                                            const colorClass = member ? `bg-${member.color}-500` : 'bg-gray-400';
                                            const letter = member ? member.name[0] : (pm.memberId ? '?' : '');

                                            return (
                                                <div
                                                    key={pmIdx}
                                                    className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-2 rounded text-sm relative group cursor-grab active:cursor-grabbing hover:bg-indigo-100 transition-colors"
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, pm)}
                                                >
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {letter && (
                                                            <div className={`w-5 h-5 rounded-full ${colorClass} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm`} title={member?.name}>
                                                                {letter}
                                                            </div>
                                                        )}
                                                        <span className="truncate" title={r.title}>{r.title}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeMealByInstance(pm)}
                                                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 ml-1"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        {/* Add Helper */}
                                        <div className="relative group">
                                            <select
                                                className="w-full text-xs border border-dashed border-gray-300 rounded p-1.5 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent cursor-pointer"
                                                value=""
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        addMeal(dIdx, mType.id, parseInt(e.target.value));
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
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WeeklyBoard;
