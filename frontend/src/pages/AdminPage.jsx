import React, { useState } from 'react';

const AdminPage = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Состояния для Telegram настроек
  const [botToken, setBotToken] = useState('');
  const [tgUsers, setTgUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', chat_id: '' });

  // --- ЛОГИН ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        setIsAuthenticated(true);
        setError('');
        fetchTelegramSettings();
      } else {
        setError('Неверный пароль');
      }
    } catch (err) {
      setError('Ошибка сети');
    }
  };

  const fetchTelegramSettings = () => {
    fetch('/api/admin/telegram/token')
      .then(res => res.json())
      .then(data => setBotToken(data.token))
      .catch(console.error);
    
    fetch('/api/admin/telegram/users')
      .then(res => res.json())
      .then(data => setTgUsers(data))
      .catch(console.error);
  };

  const saveToken = async () => {
    try {
      const res = await fetch('/api/admin/telegram/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken })
      });
      if (res.ok) alert("✅ Токен бота успешно сохранен!");
    } catch (e) { alert("Ошибка сохранения"); }
  };

  const addUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.chat_id) return;

    try {
      const res = await fetch('/api/admin/telegram/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      if (res.ok) {
        fetchTelegramSettings();
        setNewUser({ name: '', chat_id: '' });
      } else {
        const err = await res.json();
        alert("Ошибка: " + err.detail);
      }
    } catch (e) { alert("Ошибка сети"); }
  };

  const deleteUser = async (id) => {
    if(!window.confirm("Удалить этого пользователя из рассылки?")) return;
    await fetch(`/api/admin/telegram/users/${id}`, { method: 'DELETE' });
    fetchTelegramSettings();
  };

  // --- УНИВЕРСАЛЬНЫЕ ФУНКЦИИ ЭКСПОРТА/ИМПОРТА ---
  const triggerExport = async (endpoint, name) => {
    if(!window.confirm(`Сохранить ${name} в файл на сервере?`)) return;
    try {
        const res = await fetch(endpoint);
        const data = await res.json();
        if (res.ok) alert("✅ " + data.message);
        else alert("❌ " + data.detail);
    } catch(e) { alert("Ошибка сети"); }
  };

  const triggerImport = async (endpoint, name) => {
    if(!window.confirm(`Загрузить ${name}? ЭТО ПЕРЕЗАПИШЕТ ТЕКУЩИЕ ДАННЫЕ!`)) return;
    try {
        const res = await fetch(endpoint, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            alert(`✅ Импорт завершен: ${JSON.stringify(data)}`);
            // Если импортировали настройки, обновим их на экране
            if (name === 'настройки') fetchTelegramSettings();
        }
        else alert("❌ Ошибка: " + data.detail);
    } catch(e) { alert("Ошибка сети"); }
  };

  // --- ЭКРАН ВХОДА ---
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96 border border-gray-200">
          <div className="text-center mb-6">
            <span className="text-4xl">🛡️</span>
            <h2 className="text-2xl font-bold mt-2 text-gray-800">Администратор</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
                type="password" 
                placeholder="Введите пароль..." 
                className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                autoFocus 
            />
            {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
            <button type="submit" className="w-full bg-gray-800 text-white py-3 rounded hover:bg-black transition-colors font-bold shadow-md">
                Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-8 pb-20">
      <div className="flex justify-between items-center mb-10 border-b pb-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Панель управления</h1>
            <p className="text-gray-500">Системные настройки и интеграции</p>
        </div>
        <button 
            onClick={() => setIsAuthenticated(false)} 
            className="text-red-600 hover:text-red-800 font-medium px-4 py-2 hover:bg-red-50 rounded transition-colors"
        >
            Выйти
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* БЛОК TELEGRAM */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 p-2 rounded-lg text-2xl">🤖</div>
                <h3 className="text-xl font-bold text-gray-800">Настройки Telegram бота</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Токен */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Bot Token</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border border-gray-300 rounded p-2 text-sm font-mono focus:ring-2 focus:ring-indigo-200 outline-none"
                            placeholder="123456:ABC-DEF..."
                            value={botToken}
                            onChange={e => setBotToken(e.target.value)}
                        />
                        <button onClick={saveToken} className="bg-indigo-600 text-white px-4 rounded hover:bg-indigo-700 font-medium text-sm transition-colors">
                            Сохранить
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Токен от @BotFather. Пример: <code>123456789:AAG9...</code>
                    </p>
                </div>

                {/* Пользователи */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Список пользователей</label>
                    
                    <ul className="mb-4 space-y-2 max-h-40 overflow-y-auto border border-gray-100 rounded p-2 bg-gray-50">
                        {tgUsers.length === 0 && <li className="text-gray-400 text-xs italic text-center py-2">Список пуст</li>}
                        {tgUsers.map(u => (
                            <li key={u.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-gray-200 text-sm">
                                <div>
                                    <span className="font-bold text-gray-800">{u.name}</span>
                                    <span className="text-gray-400 text-xs ml-2 font-mono">ID: {u.chat_id}</span>
                                </div>
                                <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-600 font-bold px-2 text-lg leading-none">×</button>
                            </li>
                        ))}
                    </ul>

                    <form onSubmit={addUser} className="flex gap-2 bg-gray-100 p-2 rounded">
                        <input 
                            type="text" placeholder="Имя" 
                            className="w-1/3 border border-gray-300 rounded p-1 text-sm outline-none"
                            value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                        />
                        <input 
                            type="text" placeholder="Chat ID" 
                            className="flex-1 border border-gray-300 rounded p-1 text-sm font-mono outline-none"
                            value={newUser.chat_id} onChange={e => setNewUser({...newUser, chat_id: e.target.value})}
                        />
                        <button type="submit" className="bg-green-600 text-white px-3 rounded hover:bg-green-700 text-sm font-bold">+</button>
                    </form>
                    <p className="text-[10px] text-gray-400 mt-1">
                        Chat ID можно узнать у бота <b>@userinfobot</b>
                    </p>
                </div>
            </div>
        </div>

        {/* БЛОК ПРОДУКТЫ */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg text-2xl">📦</div>
            <h3 className="text-xl font-bold text-gray-800">База продуктов</h3>
          </div>
          <div className="space-y-3">
            <button onClick={() => triggerExport('/api/products/export', 'продуктов')} className="w-full py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 font-medium flex justify-center gap-2"><span>💾</span> Экспорт JSON</button>
            <button onClick={() => triggerImport('/api/products/import', 'продуктов')} className="w-full py-2 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 font-medium flex justify-center gap-2"><span>📂</span> Импорт JSON</button>
          </div>
        </div>

        {/* БЛОК РЕЦЕПТЫ */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 p-2 rounded-lg text-2xl">🍳</div>
            <h3 className="text-xl font-bold text-gray-800">База рецептов</h3>
          </div>
          <div className="space-y-3">
            <button onClick={() => triggerExport('/api/recipes/export', 'рецептов')} className="w-full py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100 font-medium flex justify-center gap-2"><span>💾</span> Экспорт JSON</button>
            <button onClick={() => triggerImport('/api/recipes/import', 'рецептов')} className="w-full py-2 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 font-medium flex justify-center gap-2"><span>📂</span> Импорт JSON</button>
          </div>
        </div>

        {/* БЛОК СИСТЕМНЫЕ НАСТРОЙКИ (Новый) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gray-200 p-2 rounded-lg text-2xl">⚙️</div>
            <h3 className="text-xl font-bold text-gray-800">Параметры и Пользователи</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4">
             Сохранение токена бота и списка пользователей в файл <code>settings.json</code>. Полезно для переноса конфигурации.
          </p>
          <div className="flex gap-4">
            <button onClick={() => triggerExport('/api/admin/settings/export', 'настройки')} className="flex-1 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 font-medium flex justify-center gap-2">
                <span>💾</span> Сохранить параметры в файл
            </button>
            <button onClick={() => triggerImport('/api/admin/settings/import', 'настройки')} className="flex-1 py-2 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 font-medium flex justify-center gap-2">
                <span>📂</span> Восстановить параметры из файла
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPage;