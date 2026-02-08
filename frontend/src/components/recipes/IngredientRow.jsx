import React, { useMemo } from 'react';
import ProductSelect from '../ProductSelect';
import { calculateIngredientStats } from '../../utils/recipeStats';
import { SPOON_UNITS } from '../../utils/unitConversion';

const IngredientRow = ({
    ingredient,
    products,
    onChange,
    onRemove,
    fetchProducts
}) => {
    const product = products.find(p => p.id === parseInt(ingredient.product_id));

    const stats = useMemo(() => {
        return calculateIngredientStats(ingredient, product);
    }, [ingredient, product]);

    // Available Units Logic
    const availableUnits = useMemo(() => {
        if (!product) return [];
        const baseUnit = product.unit || '';
        const baseUnitLower = baseUnit.toLowerCase();
        const isPieces = ['шт', 'шт.', 'pcs', 'piece', 'stk'].includes(baseUnitLower);

        let units = [baseUnit];

        if (['kg', 'кг'].includes(baseUnitLower)) units.push('г');
        if (['g', 'г'].includes(baseUnitLower)) units.push('кг');
        if (['l', 'л'].includes(baseUnitLower)) units.push('мл');
        if (['ml', 'мл'].includes(baseUnitLower)) units.push('л');

        if (['l', 'л', 'ml', 'мл', 'g', 'г', 'kg', 'кг'].includes(baseUnitLower)) {
            units.push('1 стакан');
        }

        if (!isPieces) {
            units = [...units, ...SPOON_UNITS.map(s => s.label)];
        }
        return [...new Set(units.filter(Boolean))];
    }, [product]);

    // Derived from Product logic
    const isPieces = product && ['шт', 'шт.', 'pcs', 'piece', 'stk'].includes((product.unit || '').toLowerCase());

    return (
        <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
            <div className="flex gap-2">
                <div className="flex-1">
                    <ProductSelect
                        products={products}
                        value={ingredient.product_id}
                        onChange={(val) => onChange('product_id', val)}
                        onOpen={fetchProducts}
                    />
                </div>

                <div className="flex w-36 border rounded bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-200">
                    <input
                        type="number"
                        step={isPieces ? "0.5" : "0.001"}
                        min="0" required placeholder="0"
                        className="w-full p-2 text-sm outline-none border-r"
                        value={ingredient.quantity}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (val < 0) return;
                            onChange('quantity', e.target.value);
                        }}
                    />
                    <select
                        className="bg-gray-50 text-xs font-medium text-gray-600 outline-none px-1 cursor-pointer hover:bg-gray-100 max-w-[4rem]"
                        value={ingredient.unit || (product ? product.unit : '')}
                        onChange={(e) => onChange('unit', e.target.value)}
                    >
                        {availableUnits.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700 font-bold px-2 text-xl leading-none"
                    title="Удалить ингредиент"
                >
                    ×
                </button>
            </div>

            {stats && (
                <div className="text-xs text-gray-500 mt-1 ml-1 flex flex-wrap gap-2 select-none items-center">
                    <span className="bg-green-50 text-green-700 px-1 rounded border border-green-100 font-mono">
                        €{stats.totalCost}
                    </span>
                    <span className="bg-orange-50 text-orange-700 px-1 rounded border border-orange-100 font-mono">
                        {stats.totalCals} ккал
                    </span>
                    <div className="flex gap-1">
                        <span className="bg-blue-50 text-blue-700 px-1 rounded border border-blue-100 font-mono" title="Белки">
                            Б:{stats.totalProt}
                        </span>
                        <span className="bg-yellow-50 text-yellow-700 px-1 rounded border border-yellow-100 font-mono" title="Жиры">
                            Ж:{stats.totalFat}
                        </span>
                        <span className="bg-red-50 text-red-700 px-1 rounded border border-red-100 font-mono" title="Углеводы">
                            У:{stats.totalCarb}
                        </span>
                    </div>
                    <span className="text-gray-400">
                        (за {stats.displayQty} {product.unit})
                    </span>
                </div>
            )}
        </div>
    );
};

export default IngredientRow;
