import React from 'react';

const NutritionCard = ({ title, value, limit, unit = 'г', color = 'blue', icon }) => {
    const colorClasses = {
        blue: {
            text: 'text-blue-600',
            bg: 'border-blue-100',
            iconColor: 'text-blue-50',
            barBg: 'bg-blue-100',
            barFill: 'bg-blue-500'
        },
        yellow: {
            text: 'text-yellow-600',
            bg: 'border-yellow-100',
            iconColor: 'text-yellow-50',
            barBg: 'bg-yellow-100',
            barFill: 'bg-yellow-500'
        },
        red: {
            text: 'text-red-600',
            bg: 'border-red-100',
            iconColor: 'text-red-50',
            barBg: 'bg-red-100',
            barFill: 'bg-red-500'
        },
        green: {
            text: 'text-green-600',
            bg: 'border-green-100',
            iconColor: 'text-green-50',
            barBg: 'bg-green-100',
            barFill: 'bg-green-500'
        },
        orange: {
            text: 'text-orange-600',
            bg: 'border-orange-100',
            iconColor: 'text-orange-50',
            barBg: 'bg-orange-100',
            barFill: 'bg-orange-500'
        }
    };

    const styles = colorClasses[color] || colorClasses.blue;

    // Calculate percentage if limit exists
    const percent = limit > 0 ? Math.min((value / limit) * 100, 100) : 0;

    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border ${styles.bg} flex items-center justify-between relative overflow-hidden`}>
            <div className="z-10 w-full relative">
                <div className={`text-sm font-bold ${styles.text} uppercase tracking-wider mb-1`}>{title}</div>
                <div className="text-3xl font-extrabold text-gray-800">
                    {value}
                    {limit && <span className="text-lg text-gray-500 font-medium">/ {limit}{unit}</span>}
                </div>
                {limit && <div className="text-xs text-gray-500 font-medium mt-1">Факт / Лимит</div>}

                {limit && (
                    <div className="mt-3 w-full pr-16 bg-transparent">
                        <div className={`w-full h-1.5 ${styles.barBg} rounded-full overflow-hidden`}>
                            <div className={`h-full ${styles.barFill} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                        </div>
                        <div className={`text-xs font-bold mt-1 ${styles.text}`}>
                            {Math.round(percent)}%
                        </div>
                    </div>
                )}

                {!limit && unit === '€' && <div className="text-xs text-gray-400 mt-2">за текущую неделю</div>}
                {!limit && unit !== '€' && <div className="text-xs text-gray-400 mt-2">за текущую неделю</div>}
            </div>
            <div className={`absolute -right-4 -bottom-4 text-8xl ${styles.iconColor} opacity-20 grayscale select-none pointer-events-none`}>
                {icon}
            </div>
        </div>
    );
};

export default React.memo(NutritionCard);
