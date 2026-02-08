import { getNormalizedQuantity } from './unitConversion';

/**
 * Calculates cost and macros for a single ingredient occurrence.
 * @param {Object} ingredient - { product_id, quantity, unit }
 * @param {Object} product - The full product object
 * @returns {Object|null} Stats object { totalCost, totalCals, totalProt, totalFat, totalCarb, displayQty }
 */
export const calculateIngredientStats = (ingredient, product) => {
    if (!product) return null;

    const normalizedQty = getNormalizedQuantity(ingredient.quantity, ingredient.unit, product);

    if (!normalizedQty) return null;

    const packAmount = product.amount || 1;
    const pricePerUnit = product.price / packAmount;
    const totalCost = (pricePerUnit * normalizedQty).toFixed(2);

    const prodCals = product.calories || 0;
    const prodProt = product.proteins || 0;
    const prodFat = product.fats || 0;
    const prodCarb = product.carbs || 0;

    const isPieces = ['шт', 'шт.', 'pcs', 'piece'].includes((product.unit || '').toLowerCase());
    const weightPerPiece = product.weight_per_piece || 0;

    let totalCals = 0;
    let totalProt = 0;
    let totalFat = 0;
    let totalCarb = 0;

    // ЛОГИКА РАСЧЕТА
    // Если это штуки И у продукта задан вес за штуку -> считаем как граммы
    if (isPieces && weightPerPiece > 0) {
        const totalGrams = normalizedQty * weightPerPiece;
        totalCals = Math.round((prodCals / 100) * totalGrams);
        totalProt = Math.round((prodProt / 100) * totalGrams);
        totalFat = Math.round((prodFat / 100) * totalGrams);
        totalCarb = Math.round((prodCarb / 100) * totalGrams);
    }
    // Если это штуки, но веса нет -> считаем что БЖУ задано НА ШТУКУ
    else if (isPieces) {
        totalCals = Math.round(prodCals * normalizedQty);
        totalProt = Math.round(prodProt * normalizedQty);
        totalFat = Math.round(prodFat * normalizedQty);
        totalCarb = Math.round(prodCarb * normalizedQty);
    }
    // Иначе (граммы/мл/кг/л) -> считаем от 100
    else {
        // КОРРЕКЦИЯ: Если база в КГ или Л, переводим в Г/МЛ для формулы
        let calcQty = normalizedQty;
        const u = (product.unit || '').toLowerCase();
        if (['kg', 'кг', 'l', 'л'].includes(u)) {
            calcQty = normalizedQty * 1000;
        }

        totalCals = Math.round((prodCals / 100) * calcQty);
        totalProt = Math.round((prodProt / 100) * calcQty);
        totalFat = Math.round((prodFat / 100) * calcQty);
        totalCarb = Math.round((prodCarb / 100) * calcQty);
    }

    const displayQty = parseFloat(normalizedQty.toFixed(4));

    return {
        totalCost,
        totalCals,
        totalProt,
        totalFat,
        totalCarb,
        displayQty
    };
};
