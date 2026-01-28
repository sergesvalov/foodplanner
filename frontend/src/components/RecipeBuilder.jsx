import React, { useState, useEffect } from 'react';

const RecipeBuilder = ({ onRecipeCreated, initialData, onCancel }) => {
  const [products, setProducts] = useState([]);
  
  // Состояния формы
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

  // Если пришел initialData (режим редактирования) — заполняем форму
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      
      // Преобразуем входящие ингредиенты в формат для формы
      // Иногда API возвращает { product: {id: 1} }, иногда просто product_id
      const formattedIngredients = initialData.ingredients.map(ing => ({
        product_id: ing.product_id || (ing.product ? ing.product.id : ''), 
        quantity: ing.quantity
      }));
      
      setIngredients(formattedIngredients.length > 0 ? formattedIngredients : [{ product_id: '', quantity: '' }]);
    } else {
      // Если initialData исчез (отмена) — сброс
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
        if (!initialData) resetForm(); // Очищаем только при создании нового
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
          <input 
            className="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-2 focus:ring-indigo-500" 
            placeholder="Например: Борщ" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Способ приготовления</label>
          <textarea 
            className="w-full border border-gray-300 rounded-md p-2 h-24 outline-none focus:ring-2 focus:ring-indigo-500" 
            placeholder="Опишите шаги..." 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ингредиенты</label>
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select 
                  className="flex-1 border border-gray-300 rounded-md p-2 bg-white text-sm"
                  value={ing.product_id}
                  onChange={e => updateIngredient(idx, 'product_id', e.target.value)}
                  required
                >
                  <option value="">Выберите продукт...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — €{p.price}/{p.unit} {p.calories > 0 ? `(${p.calories} ккал)` : ''}
                    </option>
                  ))}
                </select>

                <input 
                  type="number" 
                  step="0.01" 
                  className="w-20 border border-gray-300 rounded-md p-2 text-sm" 
                  placeholder="Кол-во" 
                  value={ing.quantity}
                  onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                  required 
                />

                <button 
                  type="button" 
                  onClick={() => removeRow(idx)}
                  className="text-gray-400 hover:text-red-500 p-1 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={addRow}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
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