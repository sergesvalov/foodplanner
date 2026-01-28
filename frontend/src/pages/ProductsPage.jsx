import React, { useState, useEffect } from 'react';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    price: '',
    amount: '1',
    unit: 'шт',
    calories: ''
  });

  const UNITS = ['шт', 'кг', 'г', 'л', 'мл', 'упак'];

  const fetchProducts = () => {
    fetch('/api/products/')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- ЛОГИКА ЭКСПОРТА / ИМПОРТА ---
  const handleServerExport = async () => {
    if(!window.confirm("Сохранить текущий каталог в файл products.json на сервере?")) return;
    try {
      const res = await fetch('/api/products/export');
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      } else {
        alert("Ошибка: " + data.detail);
      }
    } catch (err) {
      alert("Ошибка сети");
    }
  };

  const handleServerImport = async () => {
    if(!window.confirm("Загрузить каталог из файла на сервере? \nНовые товары будут добавлены. \nСуществующие товары обновятся, если цена/вес в файле отличаются.")) return;
    try {
      const res = await fetch('/api/products/import', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Импорт завершен!\nДобавлено: ${data.created}\nОбновлено: ${data.updated}`);
        fetchProducts(); // Обновляем таблицу
      } else {
        alert("Ошибка: " + data.detail);
      }
    } catch (err) {
      alert("Ошибка сети");
    }
  };
  // ---------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      amount: parseFloat(form.amount),
      unit: form.unit,
      calories: form.calories ? parseFloat(form.calories) : 0
    };

    try {
      let url = '/api/products/';
      let method = 'POST';

      if (editingId) {
        url = `/api/products/${editingId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchProducts();
        resetForm();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setForm({ name: '', price: '', amount: '1', unit: 'шт', calories: '' });
    setEditingId(null);
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: product.price,
      amount: product.amount || 1,
      unit: product.unit,
      calories: product.calories || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить продукт? Он исчезнет из рецептов!')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    fetchProducts();
  };

  return (
    <div className="container mx-auto max-w-6xl">
      
      {/* ЗАГОЛОВОК И КНОПКИ УПРАВЛЕНИЯ ФАЙЛОМ */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Каталог продуктов</h2>
        
        <div className="flex gap-2">
          <button 
            onClick={handleServerExport}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 font-medium text-sm flex items-center gap-2 border border-indigo-200 transition-colors"
            title="Сохранить базу в JSON файл на сервере"
          >
            💾 Сохранить в файл
          </button>
          <button 
            onClick={handleServerImport}
            className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium text-sm flex items-center gap-2 border border-green-200 transition-colors"
            title="Загрузить из JSON файла (обновит цены)"
          >
            📂 Загрузить из файла
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ФОРМА (Слева) */}
        <div className={`bg-white p-6 rounded-lg shadow border h-fit transition-colors ${editingId ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-200'}`}>
          <h3 className="font-bold text-lg mb-4 flex justify-between items-center">
            <span className={editingId ? "text-yellow-600" : "text-indigo-600"}>
              {editingId ? 'Редактирование' : 'Новый продукт'}
            </span>
            {editingId && (
              <button onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-800 underline">
                Отмена
              </button>
            )}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Название</label>
              <input 
                type="text" required
                className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                placeholder="Напр. Сливочное масло"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Цена (€)</label>
                <input 
                  type="number" step="0.01" required min="0"
                  className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm({...form, price: e.target.value})}
                />
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-gray-700">Вес / Кол-во</label>
                 <div className="flex mt-1">
                    <input 
                        type="number" step="0.001" required min="0.001"
                        className="w-1/2 border rounded-l p-2 focus:ring-2 focus:ring-indigo-200 outline-none border-r-0"
                        placeholder="1"
                        value={form.amount}
                        onChange={e => setForm({...form, amount: e.target.value})}
                    />
                    <select 
                        className="w-1/2 border rounded-r p-2 bg-gray-50 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer"
                        value={form.unit}
                        onChange={e => setForm({...form, unit: e.target.value})}
                    >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                 </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ккал (на всю упаковку/шт)</label>
              <input 
                type="number" step="1" min="0"
                className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                placeholder="Необязательно"
                value={form.calories}
                onChange={e => setForm({...form, calories: e.target.value})}
              />
            </div>

            <div className="flex gap-2">
                <button 
                    type="submit" 
                    className={`w-full py-2 rounded text-white font-medium shadow-sm transition-colors ${
                        editingId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                    {editingId ? 'Сохранить' : 'Добавить'}
                </button>
            </div>
          </form>
        </div>

        {/* СПИСОК (Справа) */}
        <div className="md:col-span-2 bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-800 font-bold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Название</th>
                  <th className="px-6 py-3">Цена</th>
                  <th className="px-6 py-3">Вес/Кол-во</th>
                  <th className="px-6 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-400">Каталог пуст</td>
                  </tr>
                )}
                {products.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 ${editingId === product.id ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-3">€{product.price.toFixed(2)}</td>
                    <td className="px-6 py-3 font-mono">
                      {product.amount} {product.unit}
                    </td>
                    <td className="px-6 py-3 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(product)}
                        className="text-indigo-600 hover:text-indigo-900 font-semibold px-2 py-1"
                      >
                        ✎
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:text-red-700 font-bold px-2 py-1"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductsPage;