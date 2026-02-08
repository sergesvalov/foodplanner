export const SPOON_UNITS = [
    { label: 'ст. л', value: 15 },
    { label: 'ч. л', value: 5 },
    { label: '1 кусочек', value: 35 }
];

/**
 * Normalizes quantity to the product's base unit.
 * @param {number|string} qty - The quantity to convert
 * @param {string} currentUnit - The unit of the quantity
 * @param {Object} product - The product object containing base unit
 * @returns {number} Normalized quantity
 */
export const getNormalizedQuantity = (qty, currentUnit, product) => {
    if (!product || !qty) return 0;

    // Прямое совпадение
    if (currentUnit === product.unit) return parseFloat(qty);

    // Логика перевода веса (г <-> кг, g <-> kg)
    const baseUnitLower = (product.unit || '').toLowerCase();
    const currentUnitLower = (currentUnit || '').toLowerCase();

    // Если продукт в кг, а выбрали г (или наоборот)
    if (['kg', 'кг'].includes(baseUnitLower) && ['g', 'г'].includes(currentUnitLower)) {
        return parseFloat(qty) / 1000;
    }
    if (['g', 'г'].includes(baseUnitLower) && ['kg', 'кг'].includes(currentUnitLower)) {
        return parseFloat(qty) * 1000;
    }

    // Если продукт в л, а выбрали мл (или наоборот)
    if (['l', 'л'].includes(baseUnitLower) && ['ml', 'мл'].includes(currentUnitLower)) {
        return parseFloat(qty) / 1000;
    }
    if (['ml', 'мл'].includes(baseUnitLower) && ['l', 'л'].includes(currentUnitLower)) {
        return parseFloat(qty) * 1000;
    }

    const spoon = SPOON_UNITS.find(s => s.label === currentUnit);
    if (spoon) {
        const isBigUnit = ['л', 'кг', 'l', 'kg'].includes(baseUnitLower);
        const factor = isBigUnit ? spoon.value / 1000 : spoon.value;
        return parseFloat(qty) * factor;
    }

    // Обработка "1 стакан" (150 г/мл)
    if (currentUnit === '1 стакан') {
        const isBigUnit = ['л', 'кг', 'l', 'kg'].includes(baseUnitLower);
        // Если литры/кг -> 0.15, если мл/г -> 150
        const amount = isBigUnit ? 0.150 : 150;
        return parseFloat(qty) * amount;
    }

    return parseFloat(qty);
};
