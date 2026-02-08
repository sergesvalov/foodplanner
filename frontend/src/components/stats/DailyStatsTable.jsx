import React from 'react';
import { getMacroWarnings } from '../../utils/stats';

const DailyStatsTable = ({ days, stats, dailyLimit }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                        <tr>
                            <th className="px-6 py-4">День недели</th>
                            <th className="px-6 py-4">Блюд</th>
                            <th className="px-6 py-4">Калории / Лимит</th>
                            <th className="px-2 py-4 text-center">Б</th>
                            <th className="px-2 py-4 text-center">Ж</th>
                            <th className="px-2 py-4 text-center">У</th>
                            <th className="px-6 py-4">Стоимость</th>
                            <th className="px-6 py-4 hidden md:table-cell">Инфо</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {days.map(day => {
                            const dayStat = stats.daily[day];
                            const isZero = dayStat.itemsCount === 0;

                            // Расчет процента заполнения и цвета
                            const percent = Math.min((dayStat.cals / dailyLimit.cals) * 100, 100);
                            const isOverLimit = dayStat.cals > dailyLimit.cals;

                            // Percentages for nutrients
                            const protPercent = dailyLimit.prot > 0 ? Math.min((dayStat.prot / dailyLimit.prot) * 100, 100) : 0;
                            const fatPercent = dailyLimit.fat > 0 ? Math.min((dayStat.fat / dailyLimit.fat) * 100, 100) : 0;
                            const carbPercent = dailyLimit.carb > 0 ? Math.min((dayStat.carb / dailyLimit.carb) * 100, 100) : 0;

                            // Цвета текста и полоски
                            const textColorClass = dayStat.cals > 0
                                ? (isOverLimit ? 'text-red-600' : 'text-green-600')
                                : 'text-gray-300';

                            const barColorClass = isOverLimit ? 'bg-red-500' : 'bg-green-500';

                            return (
                                <tr key={day} className={`hover:bg-gray-50 transition-colors ${isZero ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4 font-bold text-gray-700">
                                        {day}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {dayStat.itemsCount > 0 ? (
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">
                                                {dayStat.itemsCount}
                                            </span>
                                        ) : "—"}
                                    </td>
                                    <td className="px-6 py-4 w-1/3">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-end">
                                                <span className={`font-bold ${textColorClass}`}>
                                                    {dayStat.cals} ккал
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    из {dailyLimit.cals}
                                                </span>
                                            </div>
                                            {/* Visual Bar */}
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${barColorClass}`}
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-right bg-blue-50/30 align-middle">
                                        <div className="text-blue-600 font-medium text-xs whitespace-nowrap">
                                            {dayStat.prot} / <span className="text-blue-400">{dailyLimit.prot}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-blue-200/50 rounded-full overflow-hidden mt-1">
                                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${protPercent}%` }}></div>
                                        </div>
                                        <div className="text-blue-500 font-bold text-xs mt-1 text-right">
                                            {Math.round(protPercent)}%
                                        </div>
                                    </td>
                                    <td className="p-3 text-right bg-yellow-50/30 align-middle">
                                        <div className="text-yellow-600 font-medium text-xs whitespace-nowrap">
                                            {dayStat.fat} / <span className="text-yellow-400">{dailyLimit.fat}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-yellow-200/50 rounded-full overflow-hidden mt-1">
                                            <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${fatPercent}%` }}></div>
                                        </div>
                                        <div className="text-yellow-500 font-bold text-xs mt-1 text-right">
                                            {Math.round(fatPercent)}%
                                        </div>
                                    </td>
                                    <td className="p-3 text-right bg-red-50/30 align-middle">
                                        <div className="text-red-600 font-medium text-xs whitespace-nowrap">
                                            {dayStat.carb} / <span className="text-red-400">{dailyLimit.carb}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-red-200/50 rounded-full overflow-hidden mt-1">
                                            <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${carbPercent}%` }}></div>
                                        </div>
                                        <div className="text-red-500 font-bold text-xs mt-1 text-right">
                                            {Math.round(carbPercent)}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-green-700">
                                        {dayStat.cost > 0 ? `€${dayStat.cost.toFixed(2)}` : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400 hidden md:table-cell">
                                        {isOverLimit && dayStat.cals > 0 && (
                                            <div className="text-red-500 font-bold">Превышение!</div>
                                        )}

                                        {/* Macro Balance Warning: if max diff > 5% */}
                                        {(() => {
                                            if (dayStat.itemsCount === 0) return null;

                                            const warnings = getMacroWarnings(dayStat, {
                                                prot: dailyLimit.prot,
                                                fat: dailyLimit.fat,
                                                carb: dailyLimit.carb,
                                                cals: dailyLimit.cals
                                            });

                                            if (warnings.length > 0) {
                                                return (
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        {warnings.map((w, i) => (
                                                            <div key={i} className="text-orange-500 font-bold text-xs leading-tight">
                                                                {w}
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DailyStatsTable;
