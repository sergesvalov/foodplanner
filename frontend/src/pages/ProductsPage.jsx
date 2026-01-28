import React, { useState, useEffect } from 'react';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  
  // Состояние формы
  const [form, setForm] = useState({
    name: '',
    price: '',
    unit: 'шт', // Значение по умолчанию
    calories: ''
  });

  const UNITS = ['шт', 'кг', 'г', 'л', 'мл', 'упак'];

  // Загрузка продуктов
  const fetchProducts = () => {
    fetch('/api/products/')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Создание продукта
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price),
          unit: form.unit,
          calories: form.calories ? parseFloat(form.calories) : 0
        })
      });

      if (res.ok) {
        fetchProducts(); // Обновляем таблицу
        setForm({ name: '', price: '', unit: 'шт', calories: '' }); // Сброс формы
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Удаление продукта
  const handleDelete = async (id) => {
    if (!window.confirm('Удалить продукт? Он исчезнет из рецептов!')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  return (
    <div className="container mx-auto max-w-6xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Каталог продуктов</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ФОРМА ДОБАВЛЕНИЯ (Левая колонка) */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 h-fit">
          <h3 className="font-bold text-lg mb-4 text-indigo-600">Новый продукт</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Название</label>
              <input 
                type="text" 
                required
                className="mt-1 w-full border rounded p-2"
                placeholder="Напр. Куриное филе"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Цена (€)</label>
                <input 
                  type="number" step="0.01" required
                  className="mt-1 w-full border rounded p-2"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm({...form, price: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ед. изм.</label>
                <select 
                  className="mt-1 w-full border rounded p-2 bg-white"
                  value={form.unit}
                  onChange={e => setForm({...form, unit: e.target.value})}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ккал (на 1 ед.)</label>
              <input 
                type="number" step="1"
                className="mt-1 w-full border rounded p-2"
                placeholder="Необязательно"
                value={form.calories}
                onChange={e => setForm({...form, calories: e.target.value})}
              />
              <p className="text-xs text-gray-400 mt-1">Например, калорий на 100г или на 1 шт.</p>
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 font-medium">
              Добавить в каталог
            </button>
          </form>
        </div>

        {/* СПИСОК ПРОДУКТОВ (Правая часть) */}
        <div className="md:col-span-2 bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-800 font-bold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Название</th>
                  <th className="px-6 py-3">Цена</th>
                  <th className="px-6 py-3">Ккал</th>
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
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-3">
                      €{product.price.toFixed(2)} <span className="text-gray-400 text-xs">/ {product.unit}</span>
                    </td>
                    <td className="px-6 py-3">
                      {product.calories > 0 ? `${product.calories} ккал` : '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50"
                      >
                        Удалить
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