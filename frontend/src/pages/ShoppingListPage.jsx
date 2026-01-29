import React, { useEffect, useState } from 'react';

const ShoppingListPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Состояние галочек (куплено / не куплено)
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    fetch('/api/shopping-list/')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const toggleCheck = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const totalCost = items.reduce((sum, item) => {
     // Если товар отмечен как купленный, можно его не считать (или считать, по желанию)
     // Сейчас считаем общую сумму всего списка
     return sum + item.estimated_cost;
  }, 0);

  if (loading) return <div className="p-10 text-center text-gray-500">Загрузка списка...</div>;

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="flex justify-between items-end mb-6">
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
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-12">✓</th>
                <th className="px-6 py-4">Продукт</th>
                <th className="px-6 py-4 text-right">Нужно купить</th>
                <th className="px-6 py-4 text-right">Цена</th>
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

      <div className="mt-6 flex justify-end">
        <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-800 text-white rounded shadow hover:bg-black transition-colors flex items-center gap-2"
        >
            <span>🖨</span> Печать / PDF
        </button>
      </div>
    </div>
  );
};

export default ShoppingListPage;