import React, { useState, useEffect } from 'react';
import { fetchTelegramConfig, saveBotToken, addTelegramUser, deleteTelegramUser } from '../../api/admin';

const TelegramManagement = () => {
    const [botToken, setBotToken] = useState('');
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ name: '', chat_id: '' });
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const data = await fetchTelegramConfig();
            setBotToken(data.token);
            setUsers(data.users);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSaveToken = async () => {
        try {
            await saveBotToken(botToken);
            alert("Токен сохранен");
        } catch (err) {
            alert("Ошибка сохранения токена");
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!newUser.name || !newUser.chat_id) return;
        try {
            await addTelegramUser(newUser);
            setNewUser({ name: '', chat_id: '' });
            loadData();
        } catch (err) {
            alert("Ошибка добавления пользователя");
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Удалить?")) return;
        try {
            await deleteTelegramUser(id);
            loadData();
        } catch (err) {
            alert("Ошибка удаления");
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Загрузка настроек Telegram...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-50 text-blue-500 p-2 rounded-lg text-2xl">🤖</div>
                <h3 className="text-xl font-bold text-gray-800">Настройки Telegram</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bot Token Configuration */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Bot Token</label>
                    <div className="flex gap-2">
                        <input
                            className="flex-1 border border-gray-300 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={botToken}
                            onChange={e => setBotToken(e.target.value)}
                            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                            type="password"
                        />
                        <button
                            onClick={handleSaveToken}
                            className="bg-gray-800 hover:bg-gray-900 text-white px-5 rounded-lg text-sm font-bold transition-colors"
                        >
                            OK
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Токен бота из @BotFather</p>
                </div>

                {/* Users List */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Получатели списков</label>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-3">
                        <ul className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                            {users.length === 0 && (
                                <li className="p-4 text-gray-400 text-center text-sm italic">Список пуст</li>
                            )}
                            {users.map(u => (
                                <li key={u.id} className="flex justify-between items-center p-3 hover:bg-white transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-700">{u.name}</span>
                                        <span className="text-gray-400 text-xs font-mono">{u.chat_id}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-all font-bold"
                                        title="Удалить"
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <form onSubmit={handleAddUser} className="flex gap-2">
                        <input
                            className="w-1/3 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Имя"
                            value={newUser.name}
                            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                        />
                        <input
                            className="flex-1 border border-gray-300 rounded-lg p-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Chat ID"
                            value={newUser.chat_id}
                            onChange={e => setNewUser({ ...newUser, chat_id: e.target.value })}
                        />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg font-bold transition-colors text-lg flex items-center justify-center aspect-square">
                            +
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TelegramManagement;
