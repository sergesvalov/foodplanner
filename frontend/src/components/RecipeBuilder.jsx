import React, { useState, useEffect } from 'react';
import ProductSelect from './ProductSelect';

const RecipeBuilder = ({ onRecipeCreated, initialData, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [products, setProducts] = useState([]);
  const [portions, setPortions] = useState(1);
  // ИЗМЕНЕНИЕ: По умолчанию 'other'
  const [category, setCategory] = useState('other');
  const [rating, setRating] = useState(0);

  // ИЗМЕНЕНИЕ: Добавлена категория 'Другое'
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

  const SPOON_UNITS = [
    { label: 'ст. л', value: 15 },
    { label: 'ч. л', value: 5 }
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
      // Если у редактируемого рецепта нет категории, ставим 'other'
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
    // Сброс на 'other'
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

  const getNormalizedQuantity = (qty, currentUnit, product) => {
    if (!product || !qty) return 0;

    // Прямое совпадение
    if (currentUnit === product.unit) return parseFloat(qty);

    // Логика перевода веса (г <-> кг, g <-> kg)
    const baseUnitLower = (product.unit || '').toLowerCase();
    const currentUnitLower = (currentUnit || '').toLowerCase();

    // Если продукт в кг, а выбрали г (или наоборот)
    if (['kg', 'кг'].includes(baseUnitLower) && ['g', 'г'].includes(currentUnitLower)) {
      return parseFloat(qty) / 1000;
    }
    if (['g', 'г'].includes(baseUnitLower) && ['kg', 'кг'].includes(currentUnitLower)) {
      return parseFloat(qty) * 1000;
    }

    // Если продукт в л, а выбрали мл (или наоборот)
    if (['l', 'л'].includes(baseUnitLower) && ['ml', 'мл'].includes(currentUnitLower)) {
      return parseFloat(qty) / 1000;
    }
    if (['ml', 'мл'].includes(baseUnitLower) && ['l', 'л'].includes(currentUnitLower)) {
      return parseFloat(qty) * 1000;
    }

    const spoon = SPOON_UNITS.find(s => s.label === currentUnit);
    if (spoon) {
      const isBigUnit = ['л', 'кг', 'l', 'kg'].includes(baseUnitLower);
      const factor = isBigUnit ? spoon.value / 1000 : spoon.value;
      return parseFloat(qty) * factor;
    }

    // Обработка "1 стакан" (150 г/мл)
    if (currentUnit === '1 стакан') {
      const isBigUnit = ['л', 'кг', 'l', 'kg'].includes(baseUnitLower);
      // Если литры/кг -> 0.15, если мл/г -> 150
      const amount = isBigUnit ? 0.150 : 150;
      return parseFloat(qty) * amount;
    }

    return parseFloat(qty);
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

  const getIngredientSummary = (ing) => {
    if (!products || products.length === 0) return null;
    const product = products.find(p => p.id === parseInt(ing.product_id));

    const normalizedQty = getNormalizedQuantity(ing.quantity, ing.unit, product);

    if (!product || !normalizedQty) return null;

    const packAmount = product.amount || 1;
    const pricePerUnit = product.price / packAmount;
    const totalCost = (pricePerUnit * normalizedQty).toFixed(2);

    const prodCals = product.calories || 0;
    const prodProt = product.proteins || 0;
    const prodFat = product.fats || 0;
    const prodCarb = product.carbs || 0;

    const isPieces = ['шт', 'шт.', 'pcs', 'piece'].includes((product.unit || '').toLowerCase());
    const weightPerPiece = product.weight_per_piece || 0;

    let totalCals = 0;
    let totalProt = 0;
    let totalFat = 0;
    let totalCarb = 0;

    // ЛОГИКА РАСЧЕТА
    // Если это штуки И у продукта задан вес за штуку -> считаем как граммы
    if (isPieces && weightPerPiece > 0) {
      const totalGrams = normalizedQty * weightPerPiece;
      totalCals = Math.round((prodCals / 100) * totalGrams);
      totalProt = Math.round((prodProt / 100) * totalGrams);
      totalFat = Math.round((prodFat / 100) * totalGrams);
      totalCarb = Math.round((prodCarb / 100) * totalGrams);
    }
    // Если это штуки, но веса нет -> считаем что БЖУ задано НА ШТУКУ
    else if (isPieces) {
      totalCals = Math.round(prodCals * normalizedQty);
      totalProt = Math.round(prodProt * normalizedQty);
      totalFat = Math.round(prodFat * normalizedQty);
      totalCarb = Math.round(prodCarb * normalizedQty);
    }
    // Иначе (граммы/мл/кг/л) -> считаем от 100
    else {
      // КОРРЕКЦИЯ: Если база в КГ или Л, переводим в Г/МЛ для формулы
      let calcQty = normalizedQty;
      const u = (product.unit || '').toLowerCase();
      if (['kg', 'кг', 'l', 'л'].includes(u)) {
        calcQty = normalizedQty * 1000;
      }

      totalCals = Math.round((prodCals / 100) * calcQty);
      totalProt = Math.round((prodProt / 100) * calcQty);
      totalFat = Math.round((prodFat / 100) * calcQty);
      totalCarb = Math.round((prodCarb / 100) * calcQty);
    }

    const displayQty = parseFloat(normalizedQty.toFixed(4));

    return (
      <div className="text-xs text-gray-500 mt-1 ml-1 flex flex-wrap gap-2 select-none items-center">
        <span className="bg-green-50 text-green-700 px-1 rounded border border-green-100 font-mono">
          €{totalCost}
        </span>
        <span className="bg-orange-50 text-orange-700 px-1 rounded border border-orange-100 font-mono">
          {totalCals} ккал
        </span>
        <div className="flex gap-1">
          <span className="bg-blue-50 text-blue-700 px-1 rounded border border-blue-100 font-mono" title="Белки">
            Б:{totalProt}
          </span>
          <span className="bg-yellow-50 text-yellow-700 px-1 rounded border border-yellow-100 font-mono" title="Жиры">
            Ж:{totalFat}
          </span>
          <span className="bg-red-50 text-red-700 px-1 rounded border border-red-100 font-mono" title="Углеводы">
            У:{totalCarb}
          </span>
        </div>
        <span className="text-gray-400">
          (за {displayQty} {product.unit})
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

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Название блюда</label>
            <input
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
            <label className="block text-sm font-medium text-gray-700">Категория</label>
            <select
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
            <label className="block text-sm font-medium text-gray-700">Порций</label>
            <input
              type="number" min="1" max="20" required
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
          <label className="block text-sm font-medium text-gray-700">Способ приготовления</label>
          <textarea
            className="mt-1 w-full border rounded p-2 h-24 focus:ring-2 focus:ring-indigo-200 outline-none"
            placeholder="Опишите процесс..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-medium text-gray-700">Ингредиенты</label>
            {/* Auto-refresh enabled on dropdown open */}
          </div>
          {ingredients.map((ing, idx) => {
            const product = products.find(p => p.id === parseInt(ing.product_id));
            const baseUnit = product ? product.unit : '';
            const baseUnitLower = (baseUnit || '').toLowerCase();
            const isPieces = ['шт', 'шт.', 'pcs', 'piece', 'stk'].includes(baseUnitLower);

            let availableUnits = [baseUnit];

            // Если продукт весовой (кг или г), добавляем альтернативу
            if (['kg', 'кг'].includes(baseUnitLower)) availableUnits.push('г');
            if (['g', 'г'].includes(baseUnitLower)) availableUnits.push('кг');
            if (['l', 'л'].includes(baseUnitLower)) availableUnits.push('мл');
            if (['ml', 'мл'].includes(baseUnitLower)) availableUnits.push('л');

            // Добавляем опцию "1 стакан" для жидких/сыпучих (по весу)
            if (['l', 'л', 'ml', 'мл', 'g', 'г', 'kg', 'кг'].includes(baseUnitLower)) {
              availableUnits.push('1 стакан');
            }

            if (!isPieces) {
              availableUnits = [...availableUnits, ...SPOON_UNITS.map(s => s.label)];
            }
            const uniqueUnits = [...new Set(availableUnits.filter(Boolean))];

            return (
              <div key={ing.tempId} className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <ProductSelect
                      products={products}
                      value={ing.product_id}
                      onChange={(val) => updateIngredient(idx, 'product_id', val)}
                      onOpen={fetchProducts}
                    />
                  </div>

                  <div className="flex w-36 border rounded bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-200">
                    <input
                      type="number" step="0.001" min="0" required placeholder="0"
                      className="w-full p-2 text-sm outline-none border-r"
                      value={ing.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val < 0) return;
                        updateIngredient(idx, 'quantity', e.target.value)
                      }}
                    />
                    <select
                      className="bg-gray-50 text-xs font-medium text-gray-600 outline-none px-1 cursor-pointer hover:bg-gray-100 max-w-[4rem]"
                      value={ing.unit || baseUnit}
                      onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    >
                      {uniqueUnits.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="text-red-500 hover:text-red-700 font-bold px-2 text-xl leading-none"
                  >
                    ×
                  </button>
                </div>
                {getIngredientSummary(ing)}
              </div>
            );
          })}

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