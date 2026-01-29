import React, { useState, useEffect } from 'react';
import ProductSelect from './ProductSelect';

const RecipeBuilder = ({ onRecipeCreated, initialData, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [products, setProducts] = useState([]);

  // Загружаем продукты при монтировании компонента
  useEffect(() => {
    fetch('/api/products/')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  // Если передали initialData (режим редактирования), заполняем форму
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      // Преобразуем ингредиенты в формат формы
      const mapped = initialData.ingredients.map(i => ({
        product_id: i.product ? i.product.id : '',
        quantity: i.quantity,
        tempId: Date.now() + Math.random() // Уникальный ID для ключа в React
      }));
      setIngredients(mapped);
    } else {
      resetForm();
    }
  }, [initialData]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIngredients([]);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { product_id: '', quantity: '', tempId: Date.now() + Math.random() }]);
  };

  const removeIngredient = (index) => {
    const newList = [...ingredients];
    newList.splice(index, 1);
    setIngredients(newList);
  };

  const updateIngredient = (index, field, value) => {
    const newList = [...ingredients];
    newList[index][field] = value;
    setIngredients(newList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      title,
      description,
      ingredients: ingredients.map(i => ({
        product_id: parseInt(i.product_id),
        quantity: parseFloat(i.quantity)
      }))
    };

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
        if (!initialData) resetForm();
        if (onRecipeCreated) onRecipeCreated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Функция для расчета и отображения цены и калорий конкретного ингредиента
  const getIngredientSummary = (ing) => {
    const product = products.find(p => p.id === parseInt(ing.product_id));
    const qty = parseFloat(ing.quantity);
    
    if (!product || !qty) return null;

    const packAmount = product.amount || 1;
    
    // Цена
    const pricePerUnit = product.price / packAmount;
    const totalCost = (pricePerUnit * qty).toFixed(2);

    // Калории
    const prodCals = product.calories || 0;
    const calsPerUnit = prodCals / packAmount;
    const totalCals = Math.round(calsPerUnit * qty);

    return (
      <div className="text-xs text-gray-500 mt-1 ml-1 flex gap-3 select-none">
        <span className="bg-green-50 text-green-700 px-1 rounded border border-green-100 font-mono">
          €{totalCost}
        </span>
        <span className="bg-orange-50 text-orange-700 px-1 rounded border border-orange-100 font-mono">
          {totalCals} ккал
        </span>
        <span className="text-gray-400">
           (за {qty} {product.unit})
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h3 className="font-bold text-lg mb-4 text-indigo-700">
        {initialData ? 'Редактировать рецепт' : 'Создать рецепт'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Название блюда</label>
          <input 
            type="text" required
            className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
            placeholder="Напр. Борщ"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Способ приготовления</label>
          <textarea 
            className="mt-1 w-full border rounded p-2 h-24 focus:ring-2 focus:ring-indigo-200 outline-none"
            placeholder="Опишите процесс..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ингредиенты</label>
          {ingredients.map((ing, idx) => (
            <div key={ing.tempId} className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
              <div className="flex gap-2">
                <div className="flex-1">
                  <ProductSelect 
                    products={products}
                    value={ing.product_id}
                    onChange={(val) => updateIngredient(idx, 'product_id', val)}
                  />
                </div>
                <div className="w-24">
                  <input 
                    type="number" step="0.001" required placeholder="Кол-во"
                    className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="text-red-500 hover:text-red-700 font-bold px-2 text-xl leading-none"
                  title="Удалить ингредиент"
                >
                  ×
                </button>
              </div>
              
              {/* Вывод подсказки с ценой и калориями */}
              {getIngredientSummary(ing)}
            </div>
          ))}
          
          <button 
            type="button" onClick={addIngredient}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 mt-2"
          >
            + Добавить ингредиент
          </button>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button 
                type="submit" 
                className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition font-medium shadow-sm"
            >
                {initialData ? 'Сохранить изменения' : 'Создать рецепт'}
            </button>
            {initialData && (
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                >
                    Отмена
                </button>
            )}
        </div>
      </form>
    </div>
  );
};

export default RecipeBuilder;