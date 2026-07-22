import React, { useState, useEffect } from 'react';
import { fetchPostgresConfig, savePostgresConfig, checkPostgresConnection } from '../../api/admin';

const PostgresManagement = () => {
    const [pgUrl, setPgUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState(null);

    const loadData = async () => {
        try {
            const data = await fetchPostgresConfig();
            setPgUrl(data.url);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async () => {
        try {
            await savePostgresConfig(pgUrl);
            setStatusMsg({ type: 'success', text: "Настройки сохранены" });
        } catch (err) {
            setStatusMsg({ type: 'error', text: "Ошибка сохранения" });
        }
    };

    const handleCheck = async () => {
        setStatusMsg({ type: 'info', text: "Проверка соединения..." });
        try {
            const res = await checkPostgresConnection();
            if (res.status === 'ok') {
                setStatusMsg({ type: 'success', text: res.message });
            } else {
                setStatusMsg({ type: 'error', text: res.message });
            }
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.message });
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Загрузка настроек Postgres...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-50 text-indigo-500 p-2 rounded-lg text-2xl">🐘</div>
                <h3 className="text-xl font-bold text-gray-800">Настройки PostgreSQL</h3>
            </div>

            <div className="flex flex-col gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">DATABASE URL</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            className="flex-1 border border-gray-300 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={pgUrl}
                            onChange={e => setPgUrl(e.target.value)}
                            placeholder="postgresql://user:pass@host:5432/db"
                            type="text"
                        />
                        <button
                            onClick={handleSave}
                            className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
                        >
                            Сохранить
                        </button>
                        <button
                            onClick={handleCheck}
                            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
                        >
                            Проверить связь
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Оставьте пустым для использования URL по умолчанию (из ENV).</p>
                </div>
                
                {statusMsg && (
                    <div className={`p-3 rounded-lg text-sm font-medium ${
                        statusMsg.type === 'error' ? 'bg-red-50 text-red-600' :
                        statusMsg.type === 'success' ? 'bg-green-50 text-green-600' :
                        'bg-blue-50 text-blue-600'
                    }`}>
                        {statusMsg.text}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostgresManagement;
