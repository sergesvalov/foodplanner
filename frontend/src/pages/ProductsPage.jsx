import React, { useState, useEffect, useMemo } from 'react';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Сортировка
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  // Форма с новыми полями
  const [form, setForm] = useState({
    name: '', price: '', amount: '1', unit: 'г', calories: '',
    proteins: '', fats: '', carbs: '', weight_per_piece: ''
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

  const [searchTerm, setSearchTerm] = useState('');

  // --- ЛОГИКА СОРТИРОВКИ И ПОИСКА ---
  const sortedProducts = useMemo(() => {
    let items = [...products];

    // Фильтрация
    if (searchTerm) {
      items = items.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (sortConfig.key !== null) {
      items.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Обработка null значений
        if (aValue === null || aValue === undefined) aValue = -1;
        if (bValue === null || bValue === undefined) bValue = -1;

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [products, sortConfig, searchTerm]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (name) => {
    if (sortConfig.key === name) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  };
  // -------------------------

  const handleServerExport = async () => {
    if (!window.confirm("Сохранить текущую базу в файл на сервере?")) return;
    try {
      const res = await fetch('/api/products/export');
      const data = await res.json();
      if (res.ok) alert("✅ " + data.message);
      else alert("❌ Ошибка: " + data.detail);
    } catch (err) { alert("Ошибка сети"); }
  };

  const handleServerImport = async () => {
    if (!window.confirm("Загрузить данные из файла на сервере?")) return;
    try {
      const res = await fetch('/api/products/import', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Успешно!\nСоздано: ${data.created}\nОбновлено: ${data.updated}`);
        fetchProducts();
      } else {
        alert("❌ Ошибка: " + data.detail);
      }
    } catch (err) { alert("Ошибка сети"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      amount: parseFloat(form.amount),
      unit: form.unit,
      calories: form.calories !== '' ? parseFloat(form.calories) : 0,
      // Отправляем null, только если строка пустая (''). Ноль (0 или "0") отправляем как число.
      proteins: form.proteins !== '' && form.proteins !== null ? parseFloat(form.proteins) : null,
      fats: form.fats !== '' && form.fats !== null ? parseFloat(form.fats) : null,
      carbs: form.carbs !== '' && form.carbs !== null ? parseFloat(form.carbs) : null,
      weight_per_piece: form.weight_per_piece !== '' && form.weight_per_piece !== null ? parseFloat(form.weight_per_piece) : null
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
        alert("Продукт сохранен!");
        // resetForm(); // Убрали очистку по просьбе пользователя
      }
    } catch (err) { console.error(err); }
  };

  const handleCreateRecipe = async (e) => {
    e.preventDefault();
    if (!window.confirm("Сохранить продукт и создать из него рецепт?")) return;

    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      amount: parseFloat(form.amount),
      unit: form.unit,
      calories: form.calories ? parseFloat(form.calories) : 0,
      proteins: form.proteins ? parseFloat(form.proteins) : null,
      fats: form.fats ? parseFloat(form.fats) : null,
      carbs: form.carbs ? parseFloat(form.carbs) : null,
      weight_per_piece: form.weight_per_piece ? parseFloat(form.weight_per_piece) : null
    };

    try {
      // 1. Save/Update Product
      let url = '/api/products/';
      let method = 'POST';

      if (editingId) {
        url = `/api/products/${editingId}`;
        method = 'PUT';
      }

      const resProduct = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const productData = await resProduct.json();

      if (!resProduct.ok) {
        alert("Ошибка при сохранении продукта: " + productData.detail);
        return;
      }

      // 2. Create Recipe
      // If we created a new product, use the returned ID. 
      // If we updated, use editingId or returned ID (safer to use returned if available, or editingId)
      const productId = productData.id || editingId;

      const recipePayload = {
        title: payload.name,
        description: "Автоматически создано из продукта",
        category: "other", // Default category
        portions: 1,
        ingredients: [
          {
            product_id: productId,
            quantity: payload.amount // Use full package amount by default
          }
        ]
      };

      const resRecipe = await fetch('/api/recipes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipePayload)
      });

      const recipeData = await resRecipe.json();

      if (resRecipe.ok) {
        alert(`✅ Продукт сохранен и рецепт "${recipeData.title}" создан!`);
        fetchProducts();
        // resetForm(); // Убрали очистку
      } else {
        alert("Продукт сохранен, но ошибка создания рецепта: " + recipeData.detail);
        fetchProducts(); // Refresh anyway
      }

    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    }
  };

  const resetForm = () => {
    setForm({ name: '', price: '', amount: '1', unit: 'г', calories: '', proteins: '', fats: '', carbs: '', weight_per_piece: '' });
    setEditingId(null);
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: product.price,
      amount: product.amount || 1,
      unit: product.unit,
      calories: product.calories || '',
      proteins: product.proteins !== null ? product.proteins : '',
      fats: product.fats !== null ? product.fats : '',
      carbs: product.carbs !== null ? product.carbs : '',
      weight_per_piece: product.weight_per_piece !== null ? product.weight_per_piece : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить продукт?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    fetchProducts();
  };

  return (
    <div className="container mx-auto max-w-7xl p-4">

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Каталог продуктов</h2>

        <div className="flex gap-2">
          <button
            onClick={handleServerExport}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border border-blue-200 font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
          >
            💾 Сохранить на сервер
          </button>

          <button
            onClick={handleServerImport}
            className="px-4 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 border border-orange-200 font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
          >
            📂 Загрузить с сервера
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ФОРМА (Слева) */}
        <div className={`bg-white p-6 rounded-lg shadow border h-fit transition-colors ${editingId ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-200'}`}>
          <h3 className="font-bold text-lg mb-4 flex justify-between items-center">
            <span className={editingId ? "text-yellow-600" : "text-indigo-600"}>
              {editingId ? 'Редактирование' : 'Новый продукт'}
            </span>
            {(editingId || form.name) && (
              <button onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-800 underline">
                {editingId ? 'Отмена' : 'Очистить'}
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
                onChange={e => setForm({ ...form, name: e.target.value })}
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
                  onChange={e => setForm({ ...form, price: e.target.value })}
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
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                  />
                  <select
                    className="w-1/2 border rounded-r p-2 bg-gray-50 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer text-sm"
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Дополнительное поле: Вес за штуку (только для шт) */}
            {['шт', 'шт.', 'pcs', 'piece'].includes(form.unit) && (
              <div className="mt-2 text-sm col-span-2">
                <label className="block font-medium text-gray-700 mb-1">
                  Вес одной штуки (г) <span className="text-gray-400 font-normal">(необязательно)</span>
                </label>
                <input
                  type="number" step="0.1" min="0"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                  placeholder="Напр. 50 (для одного яйца)"
                  value={form.weight_per_piece}
                  onChange={e => setForm({ ...form, weight_per_piece: e.target.value })}
                />
              </div>
            )}

            <hr className="border-gray-100" />
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">На 100г продукта</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Калории (ккал)</label>
                <input
                  type="number" step="1" min="0"
                  className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                  placeholder="0"
                  value={form.calories}
                  onChange={e => setForm({ ...form, calories: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Белки (г)</label>
                <input
                  type="number" step="0.1" min="0"
                  className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                  placeholder="—"
                  value={form.proteins}
                  onChange={e => setForm({ ...form, proteins: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Жиры (г)</label>
                <input
                  type="number" step="0.1" min="0"
                  className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                  placeholder="—"
                  value={form.fats}
                  onChange={e => setForm({ ...form, fats: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Углеводы (г)</label>
                <input
                  type="number" step="0.1" min="0"
                  className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                  placeholder="—"
                  value={form.carbs}
                  onChange={e => setForm({ ...form, carbs: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className={`w-full py-2 rounded text-white font-medium shadow-sm transition-colors ${editingId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
              >
                {editingId ? 'Сохранить' : 'Добавить'}
              </button>

              <button
                type="button"
                onClick={handleCreateRecipe}
                className="w-full py-2 rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 font-medium shadow-sm transition-colors text-sm"
                title="Сохранить продукт и создать рецепт с таким же именем"
              >
                + Рецепт
              </button>
            </div>
          </form>
        </div>

        {/* ТАБЛИЦА (Справа) */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col">
          {/* Поиск внутри карточки */}
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="🔍 Поиск продукта..."
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-shadow bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-800 font-bold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('name')}>
                    Название {getSortIndicator('name')}
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('price')}>
                    Цена {getSortIndicator('price')}
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('calories')}>
                    Ккал {getSortIndicator('calories')}
                  </th>
                  {/* Новые колонки */}
                  <th className="px-2 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => requestSort('proteins')} title="Белки">Б</th>
                  <th className="px-2 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => requestSort('fats')} title="Жиры">Ж</th>
                  <th className="px-2 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => requestSort('carbs')} title="Углеводы">У</th>

                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-400">Каталог пуст</td>
                  </tr>
                )}
                {sortedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${editingId === product.id ? 'bg-yellow-50' : ''}`}
                    onClick={() => handleEditClick(product)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div>{product.name}</div>
                      <div className="text-xs text-gray-400 font-normal">{product.amount} {product.unit}</div>
                    </td>
                    <td className="px-4 py-3">€{product.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {product.calories > 0 ? product.calories : '—'}
                    </td>

                    <td className="px-2 py-3 text-center text-xs">{product.proteins ?? '—'}</td>
                    <td className="px-2 py-3 text-center text-xs">{product.fats ?? '—'}</td>
                    <td className="px-2 py-3 text-center text-xs">{product.carbs ?? '—'}</td>

                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditClick(product); }}
                        className="text-indigo-600 hover:text-indigo-900 font-semibold px-2 py-1"
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id);
                        }}
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