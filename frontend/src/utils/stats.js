/**
 * Calculates nutritional stats and cost for a plan item or recipe based on portions.
 * @param {Object} item - The plan item or recipe object.
 * @param {Object} recipe - The recipe object (if item is a plan item). If item IS the recipe, pass it here too or let it default.
 * @returns {Object} { cost, cals, prot, fat, carb }
 */
export const calculateItemStats = (item, recipe = null) => {
    const targetRecipe = recipe || item.recipe || item;
    if (!targetRecipe) return { cost: 0, cals: 0, prot: 0, fat: 0, carb: 0 };

    const basePortions = targetRecipe.portions || 1;
    // If item has 'portions' property, use it (plan item). If not, default to base (recipe view).
    const targetPortions = item.portions !== undefined ? item.portions : basePortions;



    const ratio = targetPortions / basePortions;

    return {
        cost: (targetRecipe.total_cost || 0) * ratio,
        cals: Math.round((targetRecipe.total_calories || 0) * ratio),
        prot: Math.round((targetRecipe.total_proteins || 0) * ratio),
        fat: Math.round((targetRecipe.total_fats || 0) * ratio),
        carb: Math.round((targetRecipe.total_carbs || 0) * ratio)
    };
};

/**
 * Aggregates stats for a list of items.
 * @param {Array} items - List of plan items or objects compatible with calculateItemStats.
 * @returns {Object} { cost, cals, prot, fat, carb }
 */
export const calculateTotalStats = (items) => {
    return items.reduce((acc, item) => {
        const s = calculateItemStats(item);
        return {
            cost: acc.cost + s.cost,
            cals: acc.cals + s.cals,
            prot: acc.prot + s.prot,
            fat: acc.fat + s.fat,
            carb: acc.carb + s.carb
        };
    }, { cost: 0, cals: 0, prot: 0, fat: 0, carb: 0 });
};

/**
 * Returns macro warnings based on daily limits.
 * @param {Object} dayStats - { prot, fat, carb } (grams)
 * @param {Object} dailyLimit - { prot, fat, carb, cals } (grams, kcals)
 * @returns {Array<string>} - Array of warning strings
 */
export const getMacroWarnings = (dayStats, dailyLimit) => {
    if (!dayStats || !dailyLimit) return [];

    // Calculate calories from each macro based on standard conversion
    const pCal = dayStats.prot * 4;
    const fCal = dayStats.fat * 9;
    const cCal = dayStats.carb * 4;
    const totalCalcCals = pCal + fCal + cCal;

    if (totalCalcCals === 0) return [];

    const pPct = (pCal / totalCalcCals) * 100;
    const fPct = (fCal / totalCalcCals) * 100;
    const cPct = (cCal / totalCalcCals) * 100;

    const warnings = [];

    // 1. Proteins: 15-20%
    if (pPct < 15) warnings.push("Мало белков");
    // if (pPct > 20) warnings.push("Много белков"); 

    // 2. Fats: 25-35%
    if (fPct < 25) warnings.push("Мало жиров");
    if (fPct > 35) warnings.push("Много жиров");

    // 3. Carbs: 50-55% (Standard balanced diet)
    if (cPct < 50) warnings.push("Мало углеводов");
    if (cPct > 55) warnings.push("Много углеводов");

    return warnings;
};
