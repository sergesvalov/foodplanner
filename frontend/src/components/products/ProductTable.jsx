import React from 'react';

const ProductTable = ({
    products,
    searchTerm,
    setSearchTerm,
    requestSort,
    getSortIndicator,
    editingId,
    handleEditClick,
    handleDelete
}) => {
    return (
        <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col">
            {/* Поиск внутри карточки */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="🔍 Поиск продукта..."
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-shadow bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-800 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('name')}>
                                Название {getSortIndicator('name')}
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('price')}>
                                Цена {getSortIndicator('price')}
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('calories')}>
                                Ккал {getSortIndicator('calories')}
                            </th>
                            <th className="px-2 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => requestSort('proteins')} title="Белки">Б</th>
                            <th className="px-2 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => requestSort('fats')} title="Жиры">Ж</th>
                            <th className="px-2 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => requestSort('carbs')} title="Углеводы">У</th>
                            <th className="px-4 py-3 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="7" className="text-center py-8 text-gray-400">Каталог пуст</td>
                            </tr>
                        )}
                        {products.map((product) => (
                            <tr
                                key={product.id}
                                className={`hover:bg-gray-50 cursor-pointer transition-colors ${editingId === product.id ? 'bg-yellow-50' : ''}`}
                                onClick={() => handleEditClick(product)}
                            >
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    <div>{product.name}</div>
                                    <div className="text-xs text-gray-400 font-normal">{product.amount} {product.unit}</div>
                                </td>
                                <td className="px-4 py-3">€{product.price.toFixed(2)}</td>
                                <td className="px-4 py-3">
                                    {product.calories > 0 ? product.calories : '—'}
                                </td>

                                <td className="px-2 py-3 text-center text-xs">{product.proteins ?? '—'}</td>
                                <td className="px-2 py-3 text-center text-xs">{product.fats ?? '—'}</td>
                                <td className="px-2 py-3 text-center text-xs">{product.carbs ?? '—'}</td>

                                <td className="px-4 py-3 text-right flex justify-end gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEditClick(product); }}
                                        className="text-indigo-600 hover:text-indigo-900 font-semibold px-2 py-1"
                                    >
                                        ✎
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(product.id);
                                        }}
                                        className="text-red-500 hover:text-red-700 font-bold px-2 py-1"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductTable;
