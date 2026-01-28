import React, { useState, useEffect } from 'react';

const RecipeBuilder = ({ onRecipeCreated, initialData, onCancel }) => {
  const [products, setProducts] = useState([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState([
    { product_id: '', quantity: '' }
  ]);

  // Загрузка продуктов
  useEffect(() => {
    fetch('/api/products/')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Ошибка загрузки продуктов:", err));
  }, []);

  // Заполнение формы при редактировании
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      
      const formattedIngredients = initialData.ingredients.map(ing => ({
        product_id: ing.product_id || (ing.product ? ing.product.id : ''), 
        quantity: ing.quantity
      }));
      
      setIngredients(formattedIngredients.length > 0 ? formattedIngredients : [{ product_id: '', quantity: '' }]);
    } else {
      resetForm();
    }
  }, [initialData]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIngredients([{ product_id: '', quantity: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validIngredients = ingredients
      .filter(i => i.product_id && i.quantity)
      .map(i => ({ 
        product_id: parseInt(i.product_id), 
        quantity: parseFloat(i.quantity) 
      }));

    if (validIngredients.length === 0) {
      alert("Добавьте хотя бы один ингредиент!");
      return;
    }

    const payload = { title, description, ingredients: validIngredients };

    try {
      let url = '/api/recipes/';
      let method = 'POST';

      if (initialData) {
        url = `/api/recipes/${initialData.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(initialData ? 'Рецепт обновлен!' : 'Рецепт создан!');
        if (!initialData) resetForm();
        if (onRecipeCreated) onRecipeCreated();
      } else {
        alert('Ошибка при сохранении рецепта');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateIngredient = (index, field, value) => {
    const list = [...ingredients];
    list[index][field] = value;
    setIngredients(list);
  };

  const addRow = () => {
    setIngredients([...ingredients, { product_id: '', quantity: '' }]);
  };

  const removeRow = (index) => {
    const list = [...ingredients];
    if (list.length === 1) {
      setIngredients([{ product_id: '', quantity: '' }]);
    } else {
      list.splice(index, 1);
      setIngredients(list);
    }
  };

  // Вспомогательная функция для подсчета итогов по одной строке
  const getIngredientSummary = (ing) => {
    const product = products.find(p => p.id === parseInt(ing.product_id));
    const qty = parseFloat(ing.quantity);
    
    if (!product || !qty) return null;

    const totalCost = (product.price * qty).toFixed(2);
    const totalCals = product.calories ? Math.round(product.calories * qty) : 0;

    return (
      <div className="text-xs text-gray-500 mt-1 ml-1 flex gap-3">
        <span className="bg-green-50 text-green-700 px-1 rounded">
          Итого: €{totalCost}
        </span>
        {totalCals > 0 && (
          <span className="bg-orange-50 text-orange-700 px-1 rounded">
            {totalCals} ккал
          </span>
        )}
      </div>
    );
  };

  // Получить единицу измерения выбранного продукта
  const getUnitLabel = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    return product ? product.unit : '';
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow border transition-colors ${initialData ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-200'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`font-bold text-xl ${initialData ? 'text-yellow-700' : 'text-gray-800'}`}>
          {initialData ? `Редактирование: ${initialData.title}` : 'Создать новый рецепт'}
        </h2>
        {initialData && (
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-black underline">
            Отмена
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название блюда</label>
          <input className="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Например: Борщ" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Способ приготовления</label>
          <textarea className="w-full border border-gray-300 rounded-md p-2 h-24 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Опишите шаги..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ингредиенты</label>
          <div className="space-y-4">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-200">
                <div className="flex gap-2 items-start">
                  {/* Выбор продукта */}
                  <select 
                    className="flex-1 border border-gray-300 rounded-md p-2 bg-white text-sm focus:border-indigo-500 outline-none"
                    value={ing.product_id}
                    onChange={e => updateIngredient(idx, 'product_id', e.target.value)}
                    required
                  >
                    <option value="">Выберите продукт...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {/* Вывод с учетом amount: Яйца (10 шт) — €3.00 */}
                        {p.name} ({p.amount || 1} {p.unit}) — €{p.price.toFixed(2)}
                      </option>
                    ))}
                  </select>

                  {/* Ввод количества + Единица измерения */}
                  <div className="relative w-24">
                      <input 
                        type="number" 
                        step="0.001" 
                        className="w-full border border-gray-300 rounded-md p-2 text-sm pr-8 focus:border-indigo-500 outline-none" 
                        placeholder="0.00" 
                        value={ing.quantity}
                        onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                        required 
                      />
                      <span className="absolute right-2 top-2 text-xs text-gray-400 font-bold pointer-events-none">
                        {getUnitLabel(ing.product_id)}
                      </span>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => removeRow(idx)}
                    className="text-gray-400 hover:text-red-500 p-2"
                    title="Удалить строку"
                  >
                    ✕
                  </button>
                </div>

                {/* ИТОГИ по строке */}
                {getIngredientSummary(ing)}
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={addRow}
            className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить ингредиент
          </button>
        </div>

        <button 
          type="submit" 
          className={`w-full py-3 rounded-md text-white font-semibold shadow-sm transition ${initialData ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {initialData ? 'Сохранить изменения' : 'Создать рецепт'}
        </button>
      </form>
    </div>
  );
};

export default RecipeBuilder;