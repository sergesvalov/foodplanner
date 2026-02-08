import React, { useState, useEffect } from 'react';
import IngredientRow from './recipes/IngredientRow';
import { getNormalizedQuantity } from '../utils/unitConversion';

const RecipeBuilder = ({ onRecipeCreated, initialData, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [products, setProducts] = useState([]);
  const [portions, setPortions] = useState(1);
  const [category, setCategory] = useState('other');
  const [rating, setRating] = useState(0);

  const CATEGORIES = [
    { id: 'breakfast', label: 'Завтрак' },
    { id: 'snack', label: 'Перекус' },
    { id: 'main', label: 'Второе' },
    { id: 'soup', label: 'Первое' },
    { id: 'side', label: 'Гарнир' },
    { id: 'yummy', label: 'Вкусняшки' },
    { id: 'drink', label: 'Напитки' },
    { id: 'other', label: 'Другое' },
  ];

  const fetchProducts = () => {
    fetch('/api/products/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
        else setProducts([]);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setPortions(initialData.portions || 1);
      setCategory(initialData.category || 'other');
      setRating(initialData.rating || 0);

      const mapped = (initialData.ingredients || []).map(i => {
        const prod = i.product;
        return {
          product_id: prod ? prod.id : '',
          quantity: i.quantity,
          unit: prod ? prod.unit : '',
          tempId: Date.now() + Math.random()
        };
      });
      setIngredients(mapped);
    } else {
      resetForm();
    }
  }, [initialData]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIngredients([]);
    setPortions(1);
    setCategory('other');
    setRating(0);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { product_id: '', quantity: '', unit: '', tempId: Date.now() + Math.random() }]);
  };

  const removeIngredient = (index) => {
    const newList = [...ingredients];
    newList.splice(index, 1);
    setIngredients(newList);
  };

  const updateIngredient = (index, field, value) => {
    const newList = [...ingredients];
    const item = newList[index];

    if (field === 'product_id') {
      const prod = products.find(p => p.id === parseInt(value));
      item.unit = prod ? prod.unit : '';
      item.product_id = value;
    } else {
      item[field] = value;
    }

    setIngredients(newList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validIngredients = ingredients
      .map(i => {
        const product = products.find(p => p.id === parseInt(i.product_id));
        const normalizedQty = getNormalizedQuantity(i.quantity, i.unit, product);

        return {
          product_id: parseInt(i.product_id),
          quantity: normalizedQty
        };
      })
      .filter(i => i.product_id && i.quantity > 0);

    const payload = {
      title,
      description,
      portions: parseInt(portions),
      category,
      rating: parseInt(rating),
      ingredients: validIngredients
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
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h3 className="font-bold text-lg mb-4 text-indigo-700">
        {initialData ? 'Редактировать рецепт' : 'Создать рецепт'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="recipe-title" className="block text-sm font-medium text-gray-700">Название блюда</label>
            <input
              id="recipe-title"
              type="text" required
              className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
              placeholder="Напр. Овсянка"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="recipe-category" className="block text-sm font-medium text-gray-700">Категория</label>
            <select
              id="recipe-category"
              className="mt-1 w-full border rounded p-2 bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label htmlFor="recipe-portions" className="block text-sm font-medium text-gray-700">Порций</label>
            <input
              id="recipe-portions"
              type="number" min="1" required
              className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-200 outline-none text-center"
              value={portions}
              onChange={e => setPortions(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Оценка</label>
          <div className="flex gap-1 mt-1">
            {[0, 1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setRating(val)}
                className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${rating === val
                  ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
              >
                {val === 0 ? 'Без оценки' : '⭐'.repeat(val)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="recipe-description" className="block text-sm font-medium text-gray-700">Способ приготовления</label>
          <textarea
            id="recipe-description"
            className="mt-1 w-full border rounded p-2 h-48 focus:ring-2 focus:ring-indigo-200 outline-none"
            placeholder="Опишите процесс..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-medium text-gray-700">Ингредиенты</label>
          </div>

          {ingredients.map((ing, idx) => (
            <IngredientRow
              key={ing.tempId}
              ingredient={ing}
              products={products}
              onChange={(field, val) => updateIngredient(idx, field, val)}
              onRemove={() => removeIngredient(idx)}
              fetchProducts={fetchProducts}
            />
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
