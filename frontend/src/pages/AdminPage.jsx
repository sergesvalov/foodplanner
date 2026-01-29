import React, { useState } from 'react';

const AdminPage = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Логика входа
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
      } else {
        setError('Неверный пароль');
      }
    } catch (err) {
      setError('Ошибка сети');
    }
  };

  // Универсальная функция для вызова экспорта (GET)
  const triggerExport = async (endpoint, name) => {
    if(!window.confirm(`Вы уверены, что хотите сохранить ${name} в файл на сервере?`)) return;
    try {
        const res = await fetch(endpoint);
        const data = await res.json();
        if (res.ok) alert("✅ " + data.message);
        else alert("❌ Ошибка: " + data.detail);
    } catch(e) { 
        alert("Ошибка сети"); 
    }
  };

  // Универсальная функция для вызова импорта (POST)
  const triggerImport = async (endpoint, name) => {
    if(!window.confirm(`ВНИМАНИЕ! Загрузка ${name} из файла перезапишет текущие данные. Продолжить?`)) return;
    try {
        const res = await fetch(endpoint, { method: 'POST' });
        const data = await res.json();
        if (res.ok) alert(`✅ Импорт завершен: ${JSON.stringify(data)}`);
        else alert("❌ Ошибка: " + data.detail);
    } catch(e) { 
        alert("Ошибка сети"); 
    }
  };

  // --- ЭКРАН ВХОДА (Если не авторизован) ---
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96 border border-gray-200">
          <div className="text-center mb-6">
            <span className="text-4xl">🛡️</span>
            <h2 className="text-2xl font-bold mt-2 text-gray-800">Администратор</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Введите пароль..."
                className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>}
            <button
              type="submit"
              className="w-full bg-gray-800 text-white py-3 rounded hover:bg-black transition-colors font-bold shadow-md"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- ПАНЕЛЬ УПРАВЛЕНИЯ (Если авторизован) ---
  return (
    <div className="container mx-auto max-w-5xl p-8">
      <div className="flex justify-between items-center mb-10 border-b pb-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Панель управления</h1>
            <p className="text-gray-500">Системные настройки и резервное копирование</p>
        </div>
        <button 
          onClick={() => { setIsAuthenticated(false); setPassword(''); }}
          className="text-red-600 hover:text-red-800 font-medium hover:bg-red-50 px-4 py-2 rounded transition-colors"
        >
          Выйти
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* БЛОК 1: Продукты */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg text-2xl">📦</div>
            <h3 className="text-xl font-bold text-gray-800">База продуктов</h3>
          </div>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Управление файлом <code>products.json</code>. Используйте для переноса базы товаров или ручного редактирования цен через файл.
          </p>
          <div className="space-y-3">
            <button 
                onClick={() => triggerExport('/api/products/export', 'продуктов')}
                className="w-full py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium transition-colors flex justify-center items-center gap-2"
            >
                <span>💾</span> Сохранить в JSON
            </button>
            <button 
                onClick={() => triggerImport('/api/products/import', 'продуктов')}
                className="w-full py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors flex justify-center items-center gap-2"
            >
                <span>📂</span> Загрузить из JSON
            </button>
          </div>
        </div>

        {/* БЛОК 2: Рецепты */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 p-2 rounded-lg text-2xl">🍳</div>
            <h3 className="text-xl font-bold text-gray-800">База рецептов</h3>
          </div>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Управление файлом <code>recipes.json</code>. Сохраняет заголовки и описания. Ингредиенты привязываются по именам продуктов.
          </p>
          <div className="space-y-3">
            <button 
                onClick={() => triggerExport('/api/recipes/export', 'рецептов')}
                className="w-full py-2.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 font-medium transition-colors flex justify-center items-center gap-2"
            >
                <span>💾</span> Сохранить в JSON
            </button>
            <button 
                onClick={() => triggerImport('/api/recipes/import', 'рецептов')}
                className="w-full py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors flex justify-center items-center gap-2"
            >
                <span>📂</span> Загрузить из JSON
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPage;