import React from 'react';
import { triggerExport, triggerImport } from '../../api/admin';

const BackupManagement = () => {

    const handleExport = async (url, method = 'GET') => {
        if (!window.confirm("Скачать резервную копию?")) return;
        try {
            const res = await triggerExport(url, method);
            alert(res.message || "Успешно");
        } catch (err) {
            alert("Ошибка при экспорте: " + err.message);
        }
    };

    const handleImport = async (url) => {
        if (!window.confirm("Это действие перезапишет текущие данные. Продолжить?")) return;
        try {
            await triggerImport(url);
            alert("Данные успешно восстановлены");
            // Optional: trigger a reload of data if needed contextually, 
            // but for full backups usually a page refresh is safer or just enough.
            window.location.reload();
        } catch (err) {
            alert("Ошибка при импорте: " + err.message);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg text-xl">💾</div>
                <h3 className="text-lg font-bold text-gray-800">Резервное копирование</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Products */}
                <div className="border border-gray-100 p-4 rounded-xl hover:shadow-md transition-all bg-gray-50/50">
                    <div className="font-bold mb-3 text-gray-700 flex items-center gap-2">
                        <span>🍎</span> Продукты
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExport('/api/products/export')}
                            className="flex-1 bg-white border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                        >
                            Скачать
                        </button>
                        <button
                            onClick={() => handleImport('/api/products/import')}
                            className="flex-1 bg-white border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                        >
                            Загрузить
                        </button>
                    </div>
                </div>

                {/* Recipes */}
                <div className="border border-gray-100 p-4 rounded-xl hover:shadow-md transition-all bg-gray-50/50">
                    <div className="font-bold mb-3 text-gray-700 flex items-center gap-2">
                        <span>🍳</span> Рецепты
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExport('/api/recipes/export')}
                            className="flex-1 bg-white border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                        >
                            Скачать
                        </button>
                        <button
                            onClick={() => handleImport('/api/recipes/import')}
                            className="flex-1 bg-white border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                        >
                            Загрузить
                        </button>
                    </div>
                </div>

                {/* Full Backup */}
                <div className="border border-indigo-100 p-4 rounded-xl hover:shadow-md transition-all bg-indigo-50/30">
                    <div className="font-bold mb-3 text-indigo-900 flex items-center gap-2">
                        <span>⚙️</span> Полный бэкап
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExport('/api/admin/settings/export')}
                            className="flex-1 bg-white border border-indigo-200 text-indigo-700 py-1.5 px-3 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors"
                        >
                            Сохранить всё
                        </button>
                        <button
                            onClick={() => handleImport('/api/admin/settings/import')}
                            className="flex-1 bg-white border border-indigo-200 text-indigo-700 py-1.5 px-3 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors"
                        >
                            Восстановить
                        </button>
                    </div>
                </div>
            </div>

            {/* Database Snapshot */}
            <div className="border border-green-200 bg-green-50 p-4 rounded-xl flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="font-bold text-green-900 flex items-center gap-2">🗄️ Снапшот Базы Данных</span>
                    <span className="text-xs text-green-700 mt-1">Создать локальную копию db.sqlite</span>
                </div>
                <button
                    onClick={() => handleExport('/api/admin/db/backup', 'POST')}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                    Создать копию
                </button>
            </div>
        </div>
    );
};

export default BackupManagement;
