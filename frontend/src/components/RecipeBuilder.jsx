import React, { useState, useEffect } from 'react';
import ProductSelect from './ProductSelect';

const RecipeBuilder = ({ onRecipeCreated, initialData, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [products, setProducts] = useState([]);
  const [portions, setPortions] = useState(1);

  // Константы для ложек (в мл/г)
  const SPOON_UNITS = [
    { label: 'ст. л', value: 15 },
    { label: 'ч. л', value: 5 }
  ];

  useEffect(() => {
    fetch('/api/products/')
      .then(res => res.json())
      .then(data => {
          if(Array.isArray(data)) setProducts(data);
          else setProducts([]);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setPortions(initialData.portions || 1);
      
      const mapped = (initialData.ingredients || []).map(i => {
        // При редактировании мы не знаем, была ли это ложка изначально, 
        // поэтому устанавливаем базовую единицу измерения продукта (если продукт найден)
        // или оставляем пустой, если продукта нет (редкий кейс).
        // Логика восстановления "ложек" сложна без изменения БД, поэтому показываем в базовых единицах.
        const prod = i.product; 
        return {
            product_id: prod ? prod.id : '',
            quantity: i.quantity,
            unit: prod ? prod.unit : '', // Используем базовую единицу
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
        // При смене продукта сбрасываем единицу измерения на "родную"
        const prod = products.find(p => p.id === parseInt(value));
        item.unit = prod ? prod.unit : '';
        item.product_id = value;
    } else {
        item[field] = value;
    }
    
    setIngredients(newList);
  };

  // Функция нормализации: переводит введенное кол-во (в ложках или базе) в базовые единицы продукта
  const getNormalizedQuantity = (qty, currentUnit, product) => {
    if (!product || !qty) return 0;
    
    // Если единица совпадает с родной - конвертация не нужна
    if (currentUnit === product.unit) return parseFloat(qty);

    const spoon = SPOON_UNITS.find(s => s.label === currentUnit);
    if (spoon) {
        // Определяем, "большая" ли единица измерения у продукта (л, кг)
        const baseUnitLower = (product.unit || '').toLowerCase();
        const isBigUnit = ['л', 'кг', 'l', 'kg'].includes(baseUnitLower);
        
        // Если продукт в Литрах/КГ, то ложки (15мл) делим на 1000 -> 0.015
        // Если продукт в Мл/Г, то ложки (15мл) остаются 15
        const factor = isBigUnit ? spoon.value / 1000 : spoon.value;
        return parseFloat(qty) * factor;
    }

    return parseFloat(qty);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Подготавливаем данные: конвертируем всё в базовые единицы
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
    
    // Используем нормализованное значение для расчетов
    const normalizedQty = getNormalizedQuantity(ing.quantity, ing.unit, product);
    
    if (!product || !normalizedQty) return null;

    // 1. Цена
    const packAmount = product.amount || 1;
    const pricePerUnit = product.price / packAmount;
    const totalCost = (pricePerUnit * normalizedQty).toFixed(2);

    // 2. Калории (Штуки vs Вес)
    const prodCals = product.calories || 0;
    const isPieces = ['шт', 'шт.', 'pcs', 'piece'].includes((product.unit || '').toLowerCase());
    
    let totalCals = 0;
    if (isPieces) {
        totalCals = Math.round(prodCals * normalizedQty);
    } else {
        totalCals = Math.round((prodCals / 100) * normalizedQty);
    }

    // Форматирование отображения количества (убираем лишние нули)
    // Например, 0.0150000 -> 0.015
    const displayQty = parseFloat(normalizedQty.toFixed(4));

    return (
      <div className="text-xs text-gray-500 mt-1 ml-1 flex flex-wrap gap-2 select-none items-center">
        <span className="bg-green-50 text-green-700 px-1 rounded border border-green-100 font-mono">
          €{totalCost}
        </span>
        <span className="bg-orange-50 text-orange-700 px-1 rounded border border-orange-100 font-mono">
          {totalCals} ккал
        </span>
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
          {ingredients.map((ing, idx) => {
            const product = products.find(p => p.id === parseInt(ing.product_id));
            const baseUnit = product ? product.unit : '';

            // Список доступных единиц: Базовая + Ложки (если не штучный товар)
            // Для штучных (яйца) ложки обычно не применяют, но можно и оставить
            const availableUnits = [baseUnit, ...SPOON_UNITS.map(s => s.label)].filter(Boolean);
            // Удаляем дубликаты (если базовая вдруг "ст. л")
            const uniqueUnits = [...new Set(availableUnits)];

            return (
                <div key={ing.tempId} className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex gap-2">
                    <div className="flex-1">
                    <ProductSelect 
                        products={products}
                        value={ing.product_id}
                        onChange={(val) => updateIngredient(idx, 'product_id', val)}
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