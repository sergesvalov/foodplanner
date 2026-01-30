import React, { useState } from 'react';

// Добавил labels для выпадающего списка
const COLORS = [
  { name: 'red',    label: 'Красный',    bg: 'bg-red-500' },
  { name: 'orange', label: 'Оранжевый',  bg: 'bg-orange-500' },
  { name: 'yellow', label: 'Желтый',     bg: 'bg-yellow-400' },
  { name: 'green',  label: 'Зеленый',    bg: 'bg-green-500' },
  { name: 'teal',   label: 'Бирюзовый',  bg: 'bg-teal-500' },
  { name: 'blue',   label: 'Синий',      bg: 'bg-blue-500' },
  { name: 'purple', label: 'Фиолетовый', bg: 'bg-purple-500' },
  { name: 'pink',   label: 'Розовый',    bg: 'bg-pink-500' },
];

const AdminPage = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const [botToken, setBotToken] = useState('');
  const [tgUsers, setTgUsers] = useState([]);
  const [newTgUser, setNewTgUser] = useState({ name: '', chat_id: '' });

  const [family, setFamily] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('blue'); // Значение по умолчанию

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password })
      });
      if (res.ok) { setIsAuthenticated(true); setError(''); fetchAllData(); } else { setError('Неверный пароль'); }
    } catch (err) { setError('Ошибка сети'); }
  };

  const fetchAllData = () => {
    fetch('/api/admin/telegram/token').then(r=>r.json()).then(d=>setBotToken(d.token)).catch(console.error);
    fetch('/api/admin/telegram/users').then(r=>r.json()).then(setTgUsers).catch(console.error);
    fetch('/api/admin/family').then(r=>r.json()).then(setFamily).catch(console.error);
  };

  const saveToken = async () => {
    await fetch('/api/admin/telegram/token', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({token: botToken})});
    alert("Токен сохранен");
  };
  const addTgUser = async (e) => {
    e.preventDefault();
    if (!newTgUser.name || !newTgUser.chat_id) return;
    await fetch('/api/admin/telegram/users', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(newTgUser)});
    setNewTgUser({ name: '', chat_id: '' }); fetchAllData();
  };
  const deleteTgUser = async (id) => {
    if(window.confirm("Удалить?")) { await fetch(`/api/admin/telegram/users/${id}`, {method:'DELETE'}); fetchAllData(); }
  };

  const addFamilyMember = async (e) => {
    e.preventDefault();
    if (!newMemberName) return;
    await fetch('/api/admin/family', { 
        method: 'POST', headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({ name: newMemberName, color: newMemberColor })
    });
    setNewMemberName(''); 
    // Цвет не сбрасываем, чтобы удобно было добавлять следующего, или можно сбросить на 'blue'
    fetchAllData(); 
  };
  const deleteFamilyMember = async (id) => {
    if(window.confirm("Удалить?")) { await fetch(`/api/admin/family/${id}`, {method:'DELETE'}); fetchAllData(); }
  };

  const triggerExport = async (endpoint) => {
    if(!window.confirm("Сохранить?")) return;
    const res = await fetch(endpoint);
    alert((await res.json()).message);
  };
  const triggerImport = async (endpoint) => {
    if(!window.confirm("Восстановить?")) return;
    const res = await fetch(endpoint, {method: 'POST'});
    if(res.ok) { alert("Готово"); fetchAllData(); } else alert("Ошибка");
  };

  // Получаем объект текущего выбранного цвета для отображения превью
  const selectedColorObj = COLORS.find(c => c.name === newMemberColor) || COLORS[0];

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96 border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center">Администратор</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="Пароль" className="w-full border p-3 rounded" value={password} onChange={e=>setPassword(e.target.value)} autoFocus />
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <button className="w-full bg-gray-800 text-white py-3 rounded hover:bg-black font-bold">Войти</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-50">
      <div className="container mx-auto max-w-5xl p-8 pb-32">
        <div className="flex justify-between items-center mb-10 border-b pb-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Панель управления</h1>
                <p className="text-gray-500">Системные настройки</p>
            </div>
            <button onClick={() => setIsAuthenticated(false)} className="text-red-600 font-medium px-4 py-2 hover:bg-red-50 rounded">Выйти</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* ПОЛЬЗОВАТЕЛИ (ОБНОВЛЕННЫЙ ДИЗАЙН) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gray-100 p-2 rounded-lg text-2xl">👤</div>
                    <h3 className="text-xl font-bold text-gray-800">Пользователи</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <form onSubmit={addFamilyMember} className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                            <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Добавить пользователя</h4>
                            
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Имя</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Например: Иван" 
                                    className="w-full border rounded p-2 bg-white focus:ring-2 focus:ring-gray-300 outline-none transition-all" 
                                    value={newMemberName} 
                                    onChange={e => setNewMemberName(e.target.value)} 
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Цвет метки</label>
                                <div className="flex gap-2 items-center">
                                    {/* Превью цвета */}
                                    <div className={`w-10 h-10 rounded shadow-sm flex-shrink-0 border border-black/5 ${selectedColorObj.bg}`} />
                                    
                                    {/* Выпадающий список */}
                                    <select 
                                        className="w-full border rounded p-2 bg-white cursor-pointer focus:ring-2 focus:ring-gray-300 outline-none transition-all"
                                        value={newMemberColor}
                                        onChange={e => setNewMemberColor(e.target.value)}
                                    >
                                        {COLORS.map(c => (
                                            <option key={c.name} value={c.name}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2.5 rounded font-bold shadow-sm transition-colors">
                                Добавить пользователя
                            </button>
                        </form>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Список семьи</h4>
                        {family.length === 0 ? (
                            <div className="text-gray-400 italic text-sm">Список пуст</div>
                        ) : (
                            <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {family.map(member => (
                                    <li key={member.id} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm bg-${member.color}-500`}>
                                                {member.name[0]}
                                            </div>
                                            <span className="font-medium text-gray-700">{member.name}</span>
                                        </div>
                                        <button onClick={() => deleteFamilyMember(member.id)} className="text-gray-300 hover:text-red-500 font-bold px-2 transition-colors">✕</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* TELEGRAM (Кнопки стали серыми) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gray-100 p-2 rounded-lg text-2xl">🤖</div>
                    <h3 className="text-xl font-bold text-gray-800">Настройки Telegram</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Bot Token</label>
                        <div className="flex gap-2">
                            <input className="flex-1 border rounded p-2 font-mono text-sm focus:ring-2 focus:ring-gray-300 outline-none" value={botToken} onChange={e=>setBotToken(e.target.value)} placeholder="..." />
                            <button onClick={saveToken} className="bg-gray-800 hover:bg-gray-900 text-white px-4 rounded text-sm font-bold transition-colors">OK</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Получатели списков</label>
                        <ul className="mb-3 max-h-40 overflow-y-auto border rounded p-1 text-sm bg-gray-50">
                            {tgUsers.length === 0 && <li className="p-2 text-gray-400 text-center italic">Нет получателей</li>}
                            {tgUsers.map(u => (
                                <li key={u.id} className="flex justify-between items-center p-2 border-b last:border-0 bg-white first:rounded-t last:rounded-b">
                                    <span>{u.name} <span className="text-gray-400 text-xs font-mono">({u.chat_id})</span></span>
                                    <button onClick={() => deleteTgUser(u.id)} className="text-red-400 hover:text-red-600 font-bold">×</button>
                                </li>
                            ))}
                        </ul>
                        <form onSubmit={addTgUser} className="flex gap-2">
                            <input className="w-1/3 border rounded p-2 text-sm focus:ring-2 focus:ring-gray-300 outline-none" placeholder="Имя" value={newTgUser.name} onChange={e=>setNewTgUser({...newTgUser, name:e.target.value})} />
                            <input className="flex-1 border rounded p-2 text-sm font-mono focus:ring-2 focus:ring-gray-300 outline-none" placeholder="Chat ID" value={newTgUser.chat_id} onChange={e=>setNewTgUser({...newTgUser, chat_id:e.target.value})} />
                            <button className="bg-gray-800 hover:bg-gray-900 text-white px-3 rounded font-bold transition-colors">+</button>
                        </form>
                    </div>
                </div>
            </div>

            {/* БЭКАПЫ */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-gray-800">💾 Резервное копирование</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border p-4 rounded hover:border-gray-400 transition-colors">
                        <div className="font-bold mb-3">📦 Продукты</div>
                        <div className="flex gap-3 text-sm">
                            <button onClick={() => triggerExport('/api/products/export')} className="text-blue-600 font-bold hover:underline">Скачать</button>
                            <button onClick={() => triggerImport('/api/products/import')} className="text-gray-600 hover:text-black hover:underline">Загрузить</button>
                        </div>
                    </div>
                    <div className="border p-4 rounded hover:border-gray-400 transition-colors">
                        <div className="font-bold mb-3">🍳 Рецепты</div>
                        <div className="flex gap-3 text-sm">
                            <button onClick={() => triggerExport('/api/recipes/export')} className="text-orange-600 font-bold hover:underline">Скачать</button>
                            <button onClick={() => triggerImport('/api/recipes/import')} className="text-gray-600 hover:text-black hover:underline">Загрузить</button>
                        </div>
                    </div>
                    <div className="border border-gray-300 bg-gray-50 p-4 rounded">
                        <div className="font-bold mb-3 text-gray-800">⚙️ Полный бэкап</div>
                        <div className="flex gap-3 text-sm">
                            <button onClick={() => triggerExport('/api/admin/settings/export')} className="text-indigo-700 font-bold hover:underline">Сохранить всё</button>
                            <button onClick={() => triggerImport('/api/admin/settings/import')} className="text-gray-600 hover:text-black hover:underline">Восстановить</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPage;