import React, { useState, useEffect } from 'react';

const COLORS = [
    { name: 'red', label: 'Красный', bg: 'bg-red-500' },
    { name: 'orange', label: 'Оранжевый', bg: 'bg-orange-500' },
    { name: 'yellow', label: 'Желтый', bg: 'bg-yellow-400' },
    { name: 'green', label: 'Зеленый', bg: 'bg-green-500' },
    { name: 'teal', label: 'Бирюзовый', bg: 'bg-teal-500' },
    { name: 'blue', label: 'Синий', bg: 'bg-blue-500' },
    { name: 'purple', label: 'Фиолетовый', bg: 'bg-purple-500' },
    { name: 'pink', label: 'Розовый', bg: 'bg-pink-500' },
];

const INITIAL_STATE = {
    name: '',
    color: 'blue',
    max_calories: 2000,
    max_proteins: 135,
    max_fats: 100,
    max_carbs: 300
};

const FamilyForm = ({ onSubmit, editingMember, onCancel }) => {
    const [formData, setFormData] = useState(INITIAL_STATE);

    useEffect(() => {
        if (editingMember) {
            setFormData({
                name: editingMember.name,
                color: editingMember.color,
                max_calories: editingMember.max_calories || 2000,
                max_proteins: editingMember.max_proteins || 135,
                max_fats: editingMember.max_fats || 100,
                max_carbs: editingMember.max_carbs || 300
            });
        } else {
            setFormData(INITIAL_STATE);
        }
    }, [editingMember]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            id: editingMember?.id // pass ID if editing
        });
        if (!editingMember) setFormData(INITIAL_STATE);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const selectedColorObj = COLORS.find(c => c.name === formData.color) || COLORS[0];

    return (
        <form
            onSubmit={handleSubmit}
            className={`
                bg-white p-5 rounded-xl border transition-all shadow-sm
                ${editingMember ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-gray-200'}
            `}
        >
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                <h4 className={`font-bold text-sm uppercase tracking-wide flex items-center gap-2 ${editingMember ? 'text-yellow-700' : 'text-gray-700'}`}>
                    {editingMember ? (
                        <><span>✏️</span> Редактирование</>
                    ) : (
                        <><span>➕</span> Новый пользователь</>
                    )}
                </h4>
                {editingMember && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-xs text-gray-400 hover:text-gray-800 hover:underline transition-colors"
                    >
                        Отмена
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Имя</label>
                    <input
                        type="text"
                        required
                        placeholder="Например: Иван"
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                    />
                </div>

                {/* Macros Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Макс. калорий</label>
                        <div className="relative">
                            <input
                                type="number" min="0" step="50" required
                                className="w-full border border-gray-300 rounded-lg p-2.5 pr-12 font-mono font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.max_calories}
                                onChange={e => handleChange('max_calories', parseInt(e.target.value) || 0)}
                            />
                            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold pointer-events-none">kcal</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase text-center">Белки</label>
                        <input
                            type="number" min="0" step="1" required
                            className="w-full border border-gray-300 rounded-lg p-2 text-center font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.max_proteins}
                            onChange={e => handleChange('max_proteins', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase text-center">Жиры</label>
                        <input
                            type="number" min="0" step="1" required
                            className="w-full border border-gray-300 rounded-lg p-2 text-center font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.max_fats}
                            onChange={e => handleChange('max_fats', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase text-center">Углеводы</label>
                        <input
                            type="number" min="0" step="1" required
                            className="w-full border border-gray-300 rounded-lg p-2 text-center font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.max_carbs}
                            onChange={e => handleChange('max_carbs', parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>

                {/* Color Picker */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Цвет метки</label>
                    <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                        <div className={`w-10 h-10 rounded-lg shadow-sm flex-shrink-0 border border-black/5 transition-colors ${selectedColorObj.bg}`} />
                        <select
                            className="w-full bg-transparent font-medium text-gray-700 cursor-pointer focus:outline-none"
                            value={formData.color}
                            onChange={e => handleChange('color', e.target.value)}
                        >
                            {COLORS.map(c => (
                                <option key={c.name} value={c.name}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    className={`
                        w-full text-white py-3 rounded-lg font-bold shadow-sm transition-all transform active:scale-[0.98]
                        ${editingMember
                            ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200'
                            : 'bg-gray-800 hover:bg-black shadow-gray-200'
                        }
                    `}
                >
                    {editingMember ? 'Сохранить изменения' : 'Добавить пользователя'}
                </button>
            </div>
        </form>
    );
};

export default FamilyForm;
