import React, { useState, useEffect } from 'react';

const RecipeBuilder = ({ onRecipeCreated }) => {
  const [products, setProducts] = useState([]);
  
  // Состояния формы
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Список ингредиентов (динамические поля)
  const [ingredients, setIngredients] = useState([
    { product_id: '', quantity: '' }
  ]);

  // Загружаем список продуктов для выпадающего меню
  useEffect(() => {
    fetch('/api/products/')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Ошибка загрузки продуктов:", err));
  }, []);

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Фильтруем пустые строки и приводим типы
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

    try {
      const res = await fetch('/api/recipes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description, 
          ingredients: validIngredients 
        })
      });

      if (res.ok) {
        alert('Рецепт успешно создан!');
        // Сброс формы
        setTitle('');
        setDescription('');
        setIngredients([{ product_id: '', quantity: '' }]);
        
        // Уведомляем родительский компонент, чтобы он обновил список рецептов
        if (onRecipeCreated) onRecipeCreated();
      } else {
        alert('Ошибка при сохранении рецепта');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Обновление конкретного поля в строке ингредиента
  const updateIngredient = (index, field, value) => {
    const list = [...ingredients];
    list[index][field] = value;
    setIngredients(list);
  };

  // Добавить новую пустую строку
  const addRow = () => {
    setIngredients([...ingredients, { product_id: '', quantity: '' }]);
  };

  // Удалить строку
  const removeRow = (index) => {
    const list = [...ingredients];
    // Не даем удалить единственную строку, просто очищаем её
    if (list.length === 1) {
      setIngredients([{ product_id: '', quantity: '' }]);
    } else {
      list.splice(index, 1);
      setIngredients(list);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="font-bold text-xl mb-4 text-gray-800">Создать новый рецепт</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Название */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название блюда</label>
          <input 
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
            placeholder="Например: Борщ" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
        </div>

        {/* Описание */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Способ приготовления</label>
          <textarea 
            className="w-full border border-gray-300 rounded-md p-2 h-24 focus:ring-2 focus:ring-indigo-500 outline-none" 
            placeholder="Опишите шаги..." 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>
        
        {/* Список ингредиентов */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ингредиенты</label>
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                
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
                      {p.name} — €{p.price}/{p.unit} {p.calories > 0 ? `(${p.calories} ккал)` : ''}
                    </option>
                  ))}
                </select>

                {/* Количество */}
                <input 
                  type="number" 
                  step="0.01" 
                  className="w-20 border border-gray-300 rounded-md p-2 text-sm focus:border-indigo-500 outline-none" 
                  placeholder="Кол-во" 
                  value={ing.quantity}
                  onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                  required 
                />

                {/* Кнопка удаления строки */}
                <button 
                  type="button" 
                  onClick={() => removeRow(idx)}
                  className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                  title="Удалить строку"
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
          className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition font-semibold shadow-sm"
        >
          Сохранить рецепт
        </button>
      </form>
    </div>
  );
};

export default RecipeBuilder;