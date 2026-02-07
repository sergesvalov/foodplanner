import React from 'react';

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

export default UserSelectionModal;
