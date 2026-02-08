import React from 'react';

const ProductForm = ({ form, setForm, handleSubmit, handleCreateRecipe, resetForm, editingId, UNITS }) => {
    return (
        <div className={`bg-white p-6 rounded-lg shadow border h-fit transition-colors ${editingId ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-200'}`}>
            <h3 className="font-bold text-lg mb-4 flex justify-between items-center">
                <span className={editingId ? "text-yellow-600" : "text-indigo-600"}>
                    {editingId ? 'Редактирование' : 'Новый продукт'}
                </span>
                {(editingId || form.name) && (
                    <button onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-800 underline">
                        {editingId ? 'Отмена' : 'Очистить'}
                    </button>
                )}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Название</label>
                    <input
                        type="text" required
                        className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                        placeholder="Напр. Сливочное масло"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Цена (€)</label>
                        <input
                            type="number" step="0.01" required min="0"
                            className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                            placeholder="0.00"
                            value={form.price}
                            onChange={e => setForm({ ...form, price: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Вес / Кол-во</label>
                        <div className="flex mt-1">
                            <input
                                type="number" step="0.001" required min="0.001"
                                className="w-1/2 border rounded-l p-2 focus:ring-2 focus:ring-indigo-200 outline-none border-r-0"
                                placeholder="1"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                            />
                            <select
                                className="w-1/2 border rounded-r p-2 bg-gray-50 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer text-sm"
                                value={form.unit}
                                onChange={e => setForm({ ...form, unit: e.target.value })}
                            >
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Дополнительное поле: Вес за штуку (только для шт) */}
                {['шт', 'шт.', 'pcs', 'piece'].includes(form.unit) && (
                    <div className="mt-2 text-sm col-span-2">
                        <label className="block font-medium text-gray-700 mb-1">
                            Вес одной штуки (г) <span className="text-gray-400 font-normal">(необязательно)</span>
                        </label>
                        <input
                            type="number" step="0.1" min="0"
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                            placeholder="Напр. 50 (для одного яйца)"
                            value={form.weight_per_piece}
                            onChange={e => setForm({ ...form, weight_per_piece: e.target.value })}
                        />
                    </div>
                )}

                <hr className="border-gray-100" />
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">На 100г продукта</div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Калории (ккал)</label>
                        <input
                            type="number" step="1" min="0"
                            className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                            placeholder="0"
                            value={form.calories}
                            onChange={e => setForm({ ...form, calories: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Белки (г)</label>
                        <input
                            type="number" step="0.1" min="0"
                            className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                            placeholder="—"
                            value={form.proteins}
                            onChange={e => setForm({ ...form, proteins: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Жиры (г)</label>
                        <input
                            type="number" step="0.1" min="0"
                            className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                            placeholder="—"
                            value={form.fats}
                            onChange={e => setForm({ ...form, fats: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Углеводы (г)</label>
                        <input
                            type="number" step="0.1" min="0"
                            className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                            placeholder="—"
                            value={form.carbs}
                            onChange={e => setForm({ ...form, carbs: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <button
                        type="submit"
                        className={`w-full py-2 rounded text-white font-medium shadow-sm transition-colors ${editingId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {editingId ? 'Сохранить' : 'Добавить'}
                    </button>

                    <button
                        type="button"
                        onClick={handleCreateRecipe}
                        className="w-full py-2 rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 font-medium shadow-sm transition-colors text-sm"
                        title="Сохранить продукт и создать рецепт с таким же именем"
                    >
                        + Рецепт
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
