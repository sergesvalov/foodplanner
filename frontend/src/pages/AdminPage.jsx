import React, { useState } from 'react';

// Цвета для выбора
const COLORS = [
  { name: 'red',    bg: 'bg-red-500',    ring: 'ring-red-500' },
  { name: 'orange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { name: 'yellow', bg: 'bg-yellow-400', ring: 'ring-yellow-400' },
  { name: 'green',  bg: 'bg-green-500',  ring: 'ring-green-500' },
  { name: 'teal',   bg: 'bg-teal-500',   ring: 'ring-teal-500' },
  { name: 'blue',   bg: 'bg-blue-500',   ring: 'ring-blue-500' },
  { name: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-500' },
  { name: 'pink',   bg: 'bg-pink-500',   ring: 'ring-pink-500' },
];

const AdminPage = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Состояния Telegram
  const [botToken, setBotToken] = useState('');
  const [tgUsers, setTgUsers] = useState([]);
  const [newTgUser, setNewTgUser] = useState({ name: '', chat_id: '' });

  // Состояния Family
  const [family, setFamily] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('blue');

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
        fetchAllData();
      } else {
        setError('Неверный пароль');
      }
    } catch (err) { setError('Ошибка сети'); }
  };

  // --- ЗАГРУЗКА ДАННЫХ ---
  const fetchAllData = () => {
    fetch('/api/admin/telegram/token').then(r=>r.json()).then(d=>setBotToken(d.token)).catch(console.error);
    fetch('/api/admin/telegram/users').then(r=>r.json()).then(setTgUsers).catch(console.error);
    fetch('/api/admin/family').then(r=>r.json()).then(setFamily).catch(console.error);
  };

  // --- ЛОГИКА TELEGRAM ---
  const saveToken = async () => {
    try {
        await fetch('/api/admin/telegram/token', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({token: botToken})});
        alert("Токен сохранен");
    } catch(e) { alert("Ошибка"); }
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

  // --- ЛОГИКА СЕМЬИ ---
  const addFamilyMember = async (e) => {
    e.preventDefault();
    if (!newMemberName) return;
    await fetch('/api/admin/family', { 
        method: 'POST', headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({ name: newMemberName, color: newMemberColor })
    });
    setNewMemberName(''); setNewMemberColor('blue'); fetchAllData(); 
  };
  const deleteFamilyMember = async (id) => {
    if(window.confirm("Удалить?")) { await fetch(`/api/admin/family/${id}`, {method:'DELETE'}); fetchAllData(); }
  };

  // --- ИМПОРТ / ЭКСПОРТ ---
  const triggerExport = async (endpoint) => {
    if(!window.confirm("Сохранить?")) return;
    try {
        const res = await fetch(endpoint);
        const data = await res.json();
        alert(data.message);
    } catch(e) { alert("Ошибка сети"); }
  };
  const triggerImport = async (endpoint) => {
    if(!window.confirm("Восстановить? Текущие данные будут перезаписаны.")) return;
    try {
        const res = await fetch(endpoint, {method: 'POST'});
        const data = await res.json();
        if(res.ok) { alert("Готово"); fetchAllData(); } else alert("Ошибка: " + data.detail);
    } catch(e) { alert("Ошибка сети"); }
  };

  // --- ЭКРАН ВХОДА ---
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

  // --- ОСНОВНОЙ ЭКРАН ---
  return (
    // ГЛАВНЫЙ КОНТЕЙНЕР СО СКРОЛЛОМ
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
            
            {/* === БЛОК 1: СЕМЬЯ === */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-pink-100 lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-pink-100 p-2 rounded-lg text-2xl">👨‍👩‍👧‍👦</div>
                    <h3 className="text-xl font-bold text-gray-800">Участники питания</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Форма */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Добавить участника</label>
                        <form onSubmit={addFamilyMember} className="bg-gray-50 p-4 rounded border border-gray-200">
                            <input 
                                type="text" required placeholder="Имя" 
                                className="w-full border rounded p-2 mb-4 outline-none focus:ring-2 focus:ring-pink-200"
                                value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
                            />
                            <div className="mb-4">
                                <label className="text-xs text-gray-400 block mb-2 uppercase font-bold">Цвет</label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLORS.map(c => (
                                        <button type="button" key={c.name} onClick={() => setNewMemberColor(c.name)}
                                            className={`w-8 h-8 rounded-full ${c.bg} transition-all ${newMemberColor === c.name ? `ring-4 ${c.ring} ring-opacity-50 scale-110 shadow-md` : 'opacity-60 hover:opacity-100'}`}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button className="w-full bg-pink-500 text-white py-2 rounded hover:bg-pink-600 font-bold transition-colors">Добавить</button>
                        </form>
                    </div>
                    {/* Список */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Список ({family.length})</label>
                        <ul className="space-y-2 max-h-60 overflow-y-auto bg-white rounded pr-1 scrollbar-thin">
                            {family.length === 0 && <li className="text-gray-400 text-sm italic p-2">Список пуст</li>}
                            {family.map(member => (
                                <li key={member.id} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded shadow-sm hover:border-pink-200">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase bg-${member.color}-500 shadow-sm`}>
                                            {member.name[0]}
                                        </div>
                                        <span className="font-medium text-gray-700">{member.name}</span>
                                    </div>
                                    <button onClick={() => deleteFamilyMember(member.id)} className="text-gray-400 hover:text-red-500 font-bold px-2">✕</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* === БЛОК 2: TELEGRAM === */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 p-2 rounded-lg text-2xl">🤖</div>
                    <h3 className="text-xl font-bold text-gray-800">Настройки Telegram</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Bot Token</label>
                        <div className="flex gap-2">
                            <input className="flex-1 border rounded p-2 font-mono text-sm" value={botToken} onChange={e=>setBotToken(e.target.value)} placeholder="..." />
                            <button onClick={saveToken} className="bg-indigo-600 text-white px-4 rounded text-sm font-bold">OK</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Получатели</label>
                        <ul className="mb-3 max-h-32 overflow-y-auto border rounded p-1 text-sm bg-gray-50 scrollbar-thin">
                            {tgUsers.length === 0 && <li className="text-gray-400 text-xs p-2">Нет пользователей</li>}
                            {tgUsers.map(u => (
                                <li key={u.id} className="flex justify-between items-center p-2 border-b bg-white">
                                    <span className="truncate max-w-[150px]">{u.name} <span className="text-gray-400 text-xs">({u.chat_id})</span></span>
                                    <button onClick={() => deleteTgUser(u.id)} className="text-red-400 font-bold">×</button>
                                </li>
                            ))}
                        </ul>
                        <form onSubmit={addTgUser} className="flex gap-2">
                            <input className="w-1/3 border rounded p-2 text-sm" placeholder="Имя" value={newTgUser.name} onChange={e=>setNewTgUser({...newTgUser, name:e.target.value})} />
                            <input className="flex-1 border rounded p-2 text-sm font-mono" placeholder="ID" value={newTgUser.chat_id} onChange={e=>setNewTgUser({...newTgUser, chat_id:e.target.value})} />
                            <button className="bg-green-600 text-white px-3 rounded font-bold">+</button>
                        </form>
                    </div>
                </div>
            </div>

            {/* === БЛОК 3: БЭКАПЫ === */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-gray-800">💾 Резервное копирование</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border p-4 rounded hover:border-blue-300">
                        <div className="font-bold mb-3">📦 Продукты</div>
                        <div className="flex gap-3 text-sm">
                            <button onClick={() => triggerExport('/api/products/export')} className="text-blue-600 font-bold hover:underline">Скачать</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => triggerImport('/api/products/import')} className="text-gray-600 hover:text-black hover:underline">Загрузить</button>
                        </div>
                    </div>
                    <div className="border p-4 rounded hover:border-orange-300">
                        <div className="font-bold mb-3">🍳 Рецепты</div>
                        <div className="flex gap-3 text-sm">
                            <button onClick={() => triggerExport('/api/recipes/export')} className="text-orange-600 font-bold hover:underline">Скачать</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => triggerImport('/api/recipes/import')} className="text-gray-600 hover:text-black hover:underline">Загрузить</button>
                        </div>
                    </div>
                    <div className="border border-indigo-100 bg-indigo-50/50 p-4 rounded">
                        <div className="font-bold mb-3 text-indigo-900">⚙️ Всё (Full Backup)</div>
                        <div className="flex gap-3 text-sm">
                            <button onClick={() => triggerExport('/api/admin/settings/export')} className="text-indigo-700 font-bold hover:underline">Сохранить всё</button>
                            <span className="text-gray-300">|</span>
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