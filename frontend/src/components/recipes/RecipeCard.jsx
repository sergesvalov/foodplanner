import React from 'react';
import { getCategoryLabel, getCategoryStyle } from '../../constants/categories';

const calculateRecipeStats = (recipe) => {
    const portions = recipe.portions || 1;
    return {
        prot: Math.round((recipe.total_proteins || 0) / portions),
        fat: Math.round((recipe.total_fats || 0) / portions),
        carb: Math.round((recipe.total_carbs || 0) / portions)
    };
};

const RecipeCard = ({
    recipe,
    isEditing,
    onEdit,
    onDelete,
    onSendTelegram,
    sendingId,
    tgUsers
}) => {
    return (
        <div
            className={`p-4 rounded-lg border transition-all ${isEditing
                ? 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-300'
                : 'bg-white border-gray-200 hover:border-indigo-300'
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-1 w-full">

                    {/* Заголовок и Категория */}
                    <div className="flex justify-between items-start">
                        <h4
                            className="font-bold text-gray-800 text-lg leading-tight cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => onEdit(recipe)}
                            title="Редактировать рецепт"
                        >
                            {recipe.title}
                        </h4>
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ml-2 ${getCategoryStyle(recipe.category)}`}>
                            {getCategoryLabel(recipe.category)}
                        </span>
                        {/* Rating */}
                        {recipe.rating > 0 && (
                            <span className="text-xs text-yellow-600 ml-2" title={`Оценка: ${recipe.rating}/5`}>
                                {'⭐'.repeat(recipe.rating)}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                            €{(recipe.total_cost || 0).toFixed(2)}
                        </span>

                        {recipe.calories_per_100g > 0 && (
                            <span className="text-xs font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100">
                                {recipe.calories_per_100g} ккал/100г
                            </span>
                        )}

                        {recipe.portions > 0 && (
                            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                {recipe.calories_per_portion} ккал/порц ({recipe.weight_per_portion}г)
                            </span>
                        )}

                        {/* Nutrition Badges */}
                        {(() => {
                            const stats = calculateRecipeStats(recipe);
                            return (
                                <div className="flex gap-1 ml-1">
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-bold" title="Белки на порцию">Б:{stats.prot}</span>
                                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200 font-bold" title="Жиры на порцию">Ж:{stats.fat}</span>
                                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 font-bold" title="Углеводы на порцию">У:{stats.carb}</span>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[1.25rem]">
                {recipe.description || "Нет описания"}
            </p>

            <div className="flex justify-between items-center border-t pt-2 border-gray-100">
                <span className="text-xs text-gray-400">
                    {recipe.ingredients ? recipe.ingredients.length : 0} ингредиентов
                </span>

                <div className="flex gap-2">
                    {/* Telegram Button */}
                    {tgUsers.length > 0 && (
                        <button
                            onClick={() => onSendTelegram(recipe)}
                            disabled={sendingId === recipe.id}
                            className={`text-sm px-2 py-1 rounded border transition-colors flex items-center gap-1
                                ${sendingId === recipe.id ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}
                            `}
                            title="Отправить в Telegram"
                        >
                            {sendingId === recipe.id ? '...' : '✈️'}
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(recipe)}
                        className="text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 font-medium transition"
                    >
                        Изменить
                    </button>
                    <button
                        onClick={() => onDelete(recipe.id)}
                        className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium transition"
                    >
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
