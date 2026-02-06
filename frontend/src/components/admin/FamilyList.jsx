import React from 'react';

const FamilyList = ({ members, onEdit, onDelete, editingId }) => {
    if (members.length === 0) {
        return <div className="text-gray-400 italic text-sm text-center p-4">Список семьи пуст</div>;
    }

    return (
        <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {members.map(member => (
                <li
                    key={member.id}
                    className={`
                        flex justify-between items-center p-3 rounded-xl shadow-sm border transition-all
                        ${editingId === member.id
                            ? 'border-yellow-400 bg-yellow-50'
                            : 'border-gray-100 bg-white hover:border-gray-300'
                        }
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold uppercase shadow-sm bg-${member.color}-500 ring-2 ring-white`}>
                            {member.name[0]}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-800">{member.name}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-2">
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono font-bold">{member.max_calories} kcal</span>
                                <span className="text-gray-300">|</span>
                                <span>Б: <span className="font-medium text-gray-700">{member.max_proteins}</span></span>
                                <span>Ж: <span className="font-medium text-gray-700">{member.max_fats}</span></span>
                                <span>У: <span className="font-medium text-gray-700">{member.max_carbs}</span></span>
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-1">
                        <button
                            onClick={() => onEdit(member)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Редактировать"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button
                            onClick={() => onDelete(member.id)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Удалить"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default FamilyList;
