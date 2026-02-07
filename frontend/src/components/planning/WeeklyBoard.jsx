import React, { useState } from 'react';

const UserSelectionModal = ({ isOpen, onClose, onSelect, familyMembers }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Для кого добавить это блюдо?</h3>
                <div className="space-y-2">
                    <button
                        onClick={() => onSelect('all')}
                        className="w-full text-left px-4 py-3 rounded-lg border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold flex items-center gap-3 transition-colors"
                    >
                        <span className="text-xl">👨‍👩‍👧‍👦</span>
                        Для всех
                    </button>
                    <div className="my-2 border-t border-gray-100"></div>
                    {familyMembers.map(member => (
                        <button
                            key={member.id}
                            onClick={() => onSelect(member.id)}
                            className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-3 transition-colors"
                        >
                            <span className={`w-6 h-6 rounded-full bg-${member.color}-500 text-white flex items-center justify-center text-xs font-bold`}>
                                {member.name[0]}
                            </span>
                            {member.name}
                        </button>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="mt-4 w-full py-2 text-gray-400 hover:text-gray-600 text-sm"
                >
                    Отмена
                </button>
            </div>
        </div>
    );
};

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
    const handleDragStart = (e, mealInstance) => {
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
    };

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
                                                                <div
                                                                    className={`w-5 h-5 rounded-full ${colorClass} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm cursor-pointer hover:scale-110 transition-transform`}
                                                                    title={`${member?.name || 'Нет имени'} (Нажмите, чтобы сменить)`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!familyMembers.length) return;
                                                                        const currentIdx = familyMembers.findIndex(f => f.id === pm.memberId);
                                                                        const nextIdx = (currentIdx + 1) % familyMembers.length;
                                                                        const nextMember = familyMembers[nextIdx];
                                                                        updateMealMember(pm, nextMember.id);
                                                                    }}
                                                                >
                                                                    {letter}
                                                                </div>
                                                            )}
                                                            <span className="truncate" title={r.title}>{r.title}</span>
                                                        </div>

                                                        <div className="flex items-center">
                                                            {pm.portions && pm.portions !== 1 && (
                                                                <span className="text-[10px] text-gray-400 mr-1">x{pm.portions}</span>
                                                            )}

                                                            <button
                                                                onClick={() => removeMealByInstance(pm)}
                                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
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
                                                            const memberId = selectedUser === 'all' ? undefined : parseInt(selectedUser);
                                                            addMeal(dIdx, mType.id, parseInt(e.target.value), memberId);
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
        </>
    );
};

export default WeeklyBoard;
