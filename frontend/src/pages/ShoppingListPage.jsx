import React, { useEffect, useState } from 'react';

const ShoppingListPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState({});

  const [tgUsers, setTgUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('/api/shopping-list/')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => console.error(err));

    fetch('/api/admin/telegram/users')
      .then(res => res.json())
      .then(data => {
        setTgUsers(data);
        if (data.length > 0) setSelectedUser(data[0].chat_id);
      })
      .catch(err => console.error(err));
  }, []);

  const toggleCheck = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSendTelegram = async () => {
    if (!selectedUser) {
        alert("Выберите получателя");
        return;
    }

    // UX FIX: Предупреждение если есть галочки
    const hasCheckedItems = Object.values(checkedItems).some(val => val === true);
    if (hasCheckedItems) {
        const confirmSend = window.confirm(
            "Внимание: Вы отметили некоторые товары как купленные, но в Telegram будет отправлен ПОЛНЫЙ список. Продолжить?"
        );
        if (!confirmSend) return;
    }
    
    setSending(true);
    try {
        const res = await fetch('/api/shopping-list/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: selectedUser })
        });
        const data = await res.json();
        
        if (res.ok) alert("✅ " + data.message);
        else alert("❌ Ошибка: " + data.detail);
        
    } catch (e) {
        alert("Ошибка сети");
    } finally {
        setSending(false);
    }
  };

  const totalCost = items.reduce((sum, item) => sum + item.estimated_cost, 0);

  if (loading) return <div className="p-10 text-center text-gray-500">Загрузка списка...</div>;

  return (
    // ИСПРАВЛЕНИЕ: h-full и overflow-y-auto для скролла только этого контейнера
    <div className="container mx-auto max-w-4xl p-4 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <h1 className="text-3xl font-bold text-gray-800">Список покупок</h1>
        <div className="text-right">
          <div className="text-sm text-gray-500">Примерная стоимость</div>
          <div className="text-2xl font-bold text-green-600">€{totalCost.toFixed(2)}</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow text-center text-gray-500">
          Ваше меню на неделю пусто. Добавьте рецепты в план, чтобы сформировать список покупок.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 w-12 bg-gray-50">✓</th>
                <th className="px-6 py-4 bg-gray-50">Продукт</th>
                <th className="px-6 py-4 text-right bg-gray-50">Нужно купить</th>
                <th className="px-6 py-4 text-right bg-gray-50">Цена</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => {
                const isChecked = !!checkedItems[item.id];
                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 transition-colors cursor-pointer select-none ${isChecked ? 'bg-green-50/50' : ''}`}
                    onClick={() => toggleCheck(item.id)}
                  >
                    <td className="px-6 py-4 text-center">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isChecked 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && "✓"}
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-medium transition-all ${isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {item.name}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono transition-all ${isChecked ? 'text-gray-400' : 'text-indigo-600 font-bold'}`}>
                      {item.total_quantity} {item.unit}
                    </td>
                    <td className={`px-6 py-4 text-right transition-all ${isChecked ? 'text-gray-300' : 'text-gray-600'}`}>
                      €{item.estimated_cost.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium w-full md:w-auto justify-center"
        >
            <span>🖨</span> Печать / PDF
        </button>

        <div className="flex items-center gap-2 w-full md:w-auto">
            {tgUsers.length === 0 ? (
                <span className="text-xs text-gray-400">Добавьте пользователей в Админке для отправки</span>
            ) : (
                <>
                    <select 
                        className="border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
                        value={selectedUser}
                        onChange={e => setSelectedUser(e.target.value)}
                    >
                        {tgUsers.map(u => (
                            <option key={u.id} value={u.chat_id}>{u.name}</option>
                        ))}
                    </select>

                    <button 
                        onClick={handleSendTelegram}
                        disabled={sending}
                        className={`
                            px-4 py-2 text-white rounded shadow transition-colors flex items-center gap-2 font-bold
                            ${sending ? 'bg-blue-400 cursor-wait' : 'bg-blue-500 hover:bg-blue-600'}
                        `}
                    >
                        {sending ? 'Отправка...' : (
                            <>
                                <span>✈️</span> Отправить
                            </>
                        )}
                    </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingListPage;