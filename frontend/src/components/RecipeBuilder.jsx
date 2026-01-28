import React, { useState, useEffect } from 'react';

const RecipeBuilder = ({ onRecipeCreated }) => {
  const [products, setProducts] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState([{ product_id: '', quantity: '' }]);

  // Загрузка продуктов для выпадающего списка
  useEffect(() => {
    fetch('/api/products/')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validIngredients = ingredients
      .filter(i => i.product_id && i.quantity)
      .map(i => ({ product_id: parseInt(i.product_id), quantity: parseFloat(i.quantity) }));

    const res = await fetch('/api/recipes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, ingredients: validIngredients })
    });

    if (res.ok) {
        alert('Рецепт создан!');
        setTitle('');
        setDescription('');
        setIngredients([{ product_id: '', quantity: '' }]);
        if (onRecipeCreated) onRecipeCreated(); // Обновляем список рецептов в соседнем компоненте
    }
  };

  // Управление динамическими полями
  const updateIngredient = (index, field, value) => {
    const list = [...ingredients];
    list[index][field] = value;
    setIngredients(list);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <h2 className="font-bold text-lg mb-4 text-gray-700">Новый рецепт</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input 
            className="w-full border rounded p-2 text-sm" 
            placeholder="Название (напр. Борщ)" 
            value={title} onChange={e => setTitle(e.target.value)} required 
        />
        <textarea 
            className="w-full border rounded p-2 text-sm" 
            placeholder="Описание..." 
            value={description} onChange={e => setDescription(e.target.value)} 
        />
        
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">Ингредиенты:</label>
            {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-1">
                    <select 
                        className="flex-1 border rounded p-1 text-sm bg-white"
                        value={ing.product_id}
                        onChange={e => updateIngredient(idx, 'product_id', e.target.value)}
                        required
                    >
                        <option value="">Продукт...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input 
                        type="number" step="0.1" className="w-16 border rounded p-1 text-sm" 
                        placeholder="Кол." value={ing.quantity}
                        onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                        required 
                    />
                </div>
            ))}
            <button 
                type="button" 
                onClick={() => setIngredients([...ingredients, { product_id: '', quantity: '' }])}
                className="text-xs text-blue-600 hover:underline"
            >
                + Добавить строку
            </button>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700">
            Сохранить
        </button>
      </form>
    </div>
  );
};

export default RecipeBuilder;