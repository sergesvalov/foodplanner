import React, { useEffect, useState } from 'react';

const ShoppingListPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState({});

  const [tgUsers, setTgUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [sending, setSending] = useState(false);

  // --- Date Logic (copied from StatisticsPage) ---
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Всегда следующая неделя
    return d;
  });

  const getWeekRange = (baseDate) => {
    const currentDay = baseDate.getDay();
    const dayIndex = currentDay === 0 ? 6 : currentDay - 1; // 0=Mon, 6=Sun

    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - dayIndex);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const fmt = (d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${yyyy}-${mm}-${dd}`;
    };

    const fmtDisplay = (d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}.${mm}`;
    };

    return {
      start: fmt(start),
      end: fmt(end),
      display: `${fmtDisplay(start)} - ${fmtDisplay(end)}`
    };
  };

  const changeWeek = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentDate(newDate);
  };
  // ----------------------------------------

  useEffect(() => {
    setLoading(true);
    const { start, end } = getWeekRange(currentDate);

    // Pass date range to API
    fetch(`/api/shopping-list/?start_date=${start}&end_date=${end}`)
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Telegram users only need to be fetched once
    if (tgUsers.length === 0) {
      fetch('/api/admin/telegram/users')
        .then(res => res.json())
        .then(data => {
          setTgUsers(data);
          if (data.length > 0) setSelectedUser(data[0].chat_id);
        })
        .catch(err => console.error(err));
    }
  }, [currentDate]);

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

    const hasCheckedItems = Object.values(checkedItems).some(val => val === true);
    if (hasCheckedItems) {
      const confirmSend = window.confirm(
        "Внимание: Вы отметили некоторые товары как купленные, но в Telegram будет отправлен ПОЛНЫЙ список. Продолжить?"
      );
      if (!confirmSend) return;
    }

    setSending(true);
    try {
      const { start, end } = getWeekRange(currentDate);
      // Pass dates to Telegram endpoint too so it sends the CORRECT list
      const res = await fetch(`/api/shopping-list/send?start_date=${start}&end_date=${end}`, {
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
    <div className="container mx-auto max-w-4xl p-4 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Список покупок</h1>
          <div className="flex items-center gap-3 mt-2 text-gray-600 font-medium">
            <button
              onClick={() => changeWeek(-1)}
              className="hover:text-gray-900 hover:bg-gray-100 p-1 rounded transition-colors text-lg"
              title="Предыдущая неделя"
            >
              ◀
            </button>
            <span className="bg-gray-100 px-3 py-1 rounded text-sm whitespace-nowrap">
              {getWeekRange(currentDate).display}
            </span>
            <button
              onClick={() => changeWeek(1)}
              className="hover:text-gray-900 hover:bg-gray-100 p-1 rounded transition-colors text-lg"
              title="Следующая неделя"
            >
              ▶
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs text-blue-600 hover:underline ml-2"
            >
              Сегодня
            </button>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">Примерная стоимость</div>
          <div className="text-2xl font-bold text-green-600">€{totalCost.toFixed(2)}</div>
        </div>
      </div>

      <div className="mb-4 text-sm text-blue-600 bg-blue-50 border border-blue-100 p-3 rounded">
        📝 Список формируется на основе плана питания за выбранную неделю.
        Товары суммируются.
      </div>

      {items.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow text-center text-gray-500">
          План питания на этот период пуст.
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
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked
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