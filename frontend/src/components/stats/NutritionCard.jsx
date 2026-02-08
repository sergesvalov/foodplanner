import React from 'react';

const NutritionCard = ({ title, value, limit, unit = 'г', color = 'blue', icon }) => {
    const colorClasses = {
        blue: {
            text: 'text-blue-600',
            bg: 'border-blue-100',
            iconColor: 'text-blue-50'
        },
        yellow: {
            text: 'text-yellow-600',
            bg: 'border-yellow-100',
            iconColor: 'text-yellow-50'
        },
        red: {
            text: 'text-red-600',
            bg: 'border-red-100',
            iconColor: 'text-red-50'
        },
        green: {
            text: 'text-green-600',
            bg: 'border-green-100',
            iconColor: 'text-green-50'
        },
        orange: {
            text: 'text-orange-600',
            bg: 'border-orange-100',
            iconColor: 'text-orange-50'
        }
    };

    const styles = colorClasses[color] || colorClasses.blue;

    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border ${styles.bg} flex items-center justify-between relative overflow-hidden`}>
            <div className="z-10">
                <div className={`text-sm font-bold ${styles.text} uppercase tracking-wider mb-1`}>{title}</div>
                <div className="text-3xl font-extrabold text-gray-800">
                    {value}
                    {limit && <span className="text-lg text-gray-500 font-medium">/ {limit}{unit}</span>}
                </div>
                {limit && <div className="text-xs text-gray-500 font-medium mt-1">Факт / Лимит</div>}
                {!limit && unit === '€' && <div className="text-xs text-gray-400 mt-2">за текущую неделю</div>}
                {!limit && unit !== '€' && <div className="text-xs text-gray-400 mt-2">за текущую неделю</div>}
            </div>
            <div className={`absolute -right-4 -bottom-4 text-8xl ${styles.iconColor} opacity-20 grayscale select-none`}>
                {icon}
            </div>
        </div>
    );
};

export default NutritionCard;
