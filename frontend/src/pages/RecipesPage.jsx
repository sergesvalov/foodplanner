import React, { useState, useEffect, useRef } from 'react';
import RecipeBuilder from '../components/RecipeBuilder';

import { CATEGORIES, getCategoryLabel, getCategoryStyle } from '../constants/categories';

// Local helpers for compatibility if needed, or replace usages directly

const RecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [tgUsers, setTgUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [sendingId, setSendingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState(""); // Search state

  const editorRef = useRef(null); // Ref for scrolling

  // Effect to scroll to editor when editingRecipe changes
  // Effect to scroll to editor when editingRecipe changes
  useEffect(() => {
    if (editingRecipe) {
      // Scroll main window to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingRecipe]);

  const fetchRecipes = () => {
    fetch('/api/recipes/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecipes(data);
        } else {
          console.error("API вернул не массив:", data);
          setRecipes([]);
        }
      })
      .catch(err => {
        console.error(err);
        setRecipes([]);
      });
  };

  useEffect(() => {
    fetchRecipes();
    fetch('/api/admin/telegram/users')
      .then(res => res.json())
      .then(data => {
        setTgUsers(data);
        if (data.length > 0) setSelectedUser(data[0].chat_id);
      })
      .catch(err => console.error(err));
  }, []);

  const handleServerExport = async () => {
    if (!window.confirm("Сохранить тексты рецептов в файл recipes.json на сервере?")) return;
    try {
      const res = await fetch('/api/recipes/export');
      const data = await res.json();
      if (res.ok) alert("✅ " + data.message);
      else alert("❌ Ошибка: " + data.detail);
    } catch (err) { alert("Ошибка сети"); }
  };

  const handleServerImport = async () => {
    if (!window.confirm("Загрузить рецепты из файла?")) return;
    try {
      const res = await fetch('/api/recipes/import', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Готово!\nСоздано: ${data.created}\nОбновлено текстов: ${data.updated}`);
        fetchRecipes();
      } else {
        alert("❌ Ошибка: " + data.detail);
      }
    } catch (err) { alert("Ошибка сети"); }
  };

  const handleRecipeSaved = () => {
    fetchRecipes();
    setEditingRecipe(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить этот рецепт?")) return;
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchRecipes();
    } catch (err) { console.error(err); }
  };

  const handleSendTelegram = async (recipe) => {
    if (!selectedUser) {
      alert("Выберите получателя");
      return;
    }

    setSendingId(recipe.id);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: selectedUser })
      });
      const data = await res.json();

      if (res.ok) alert("✅ " + data.message);
      else alert("❌ Ошибка: " + data.detail);

    } catch (e) {
      alert("Ошибка сети");
      setSendingId(null);
    }
  };

  const calculateRecipeStats = (recipe) => {
    // 2. Рассчитываем на 100г или на порцию? 
    // Обычно для рецепта полезно знать ВСЕГО или НА ПОРЦИЮ.
    // Давайте показывать НА ПОРЦИЮ, как делают диетологи.
    const portions = recipe.portions || 1;

    // Используем готовые суммы с бэкенда
    return {
      prot: Math.round((recipe.total_proteins || 0) / portions),
      fat: Math.round((recipe.total_fats || 0) / portions),
      carb: Math.round((recipe.total_carbs || 0) / portions)
    };
  };

  return (
    <div className="container mx-auto max-w-6xl h-full flex flex-col p-4 pb-6">

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 shrink-0">
        <h2 className="text-2xl font-bold text-gray-800">Управление рецептами</h2>

        <div className="flex gap-2 items-center">
          {/* Telegram Selector */}
          {tgUsers.length > 0 && (
            <select
              className="border border-gray-300 rounded px-2 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200 mr-2"
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
            >
              {tgUsers.map(u => (
                <option key={u.id} value={u.chat_id}>{u.name}</option>
              ))}
            </select>
          )}

          <button onClick={handleServerExport} className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border border-blue-200 font-medium text-sm flex items-center gap-2 transition-colors">
            💾 Сохранить тексты
          </button>
          <button onClick={handleServerImport} className="px-4 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 border border-orange-200 font-medium text-sm flex items-center gap-2 transition-colors">
            📂 Загрузить тексты
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 md:overflow-hidden overflow-y-visible min-h-0">
        {/* Editor Column: scroll-mt-24 for header clearance */}
        <div ref={editorRef} className="md:overflow-y-auto overflow-visible pr-2 scroll-mt-24">
          <RecipeBuilder
            onRecipeCreated={handleRecipeSaved}
            initialData={editingRecipe}
            onCancel={() => setEditingRecipe(null)}
          />
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden h-full">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
            <div className="font-bold text-gray-700">
              Каталог блюд ({recipes.length})
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Поиск..."
                  className="border border-gray-300 rounded px-2 py-1 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200 w-32 md:w-48"
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

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">Все категории ({recipes.length})</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {Array.isArray(recipes) && recipes
              .filter(r => {
                const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;
                const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesCategory && matchesSearch;
              })
              .sort((a, b) => a.title.localeCompare(b.title))
              .map(recipe => (
                <div
                  key={recipe.id}
                  className={`p-4 rounded-lg border transition-all ${editingRecipe?.id === recipe.id
                    ? 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-300'
                    : 'bg-white border-gray-200 hover:border-indigo-300'
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col gap-1 w-full">

                      {/* Заголовок и Категория */}
                      <div className="flex justify-between items-start">
                        <h4
                          className="font-bold text-gray-800 text-lg leading-tight cursor-pointer hover:text-indigo-600 transition-colors"
                          onClick={() => setEditingRecipe(recipe)}
                          title="Редактировать рецепт"
                        >
                          {recipe.title}
                        </h4>
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ml-2 ${getCategoryStyle(recipe.category)}`}>
                          {getCategoryLabel(recipe.category)}
                        </span>
                        {/* Rating */}
                        {recipe.rating > 0 && (
                          <span className="text-xs text-yellow-600 ml-2" title={`Оценка: ${recipe.rating}/5`}>
                            {'⭐'.repeat(recipe.rating)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                          €{(recipe.total_cost || 0).toFixed(2)}
                        </span>

                        {recipe.calories_per_100g > 0 && (
                          <span className="text-xs font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100">
                            {recipe.calories_per_100g} ккал/100г
                          </span>
                        )}

                        {recipe.portions > 0 && (
                          <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                            {recipe.calories_per_portion} ккал/порц ({recipe.weight_per_portion}г)
                          </span>
                        )}

                        {/* Nutrition Badges */}
                        {(() => {
                          const stats = calculateRecipeStats(recipe);
                          return (
                            <div className="flex gap-1 ml-1">
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-bold" title="Белки на порцию">Б:{stats.prot}</span>
                              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200 font-bold" title="Жиры на порцию">Ж:{stats.fat}</span>
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 font-bold" title="Углеводы на порцию">У:{stats.carb}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[1.25rem]">
                    {recipe.description || "Нет описания"}
                  </p>

                  <div className="flex justify-between items-center border-t pt-2 border-gray-100">
                    <span className="text-xs text-gray-400">
                      {recipe.ingredients ? recipe.ingredients.length : 0} ингредиентов
                    </span>

                    <div className="flex gap-2">
                      {/* Telegram Button */}
                      {tgUsers.length > 0 && (
                        <button
                          onClick={() => handleSendTelegram(recipe)}
                          disabled={sendingId === recipe.id}
                          className={`text-sm px-2 py-1 rounded border transition-colors flex items-center gap-1
                                ${sendingId === recipe.id ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}
                            `}
                          title="Отправить в Telegram"
                        >
                          {sendingId === recipe.id ? '...' : '✈️'}
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingRecipe(recipe); }}
                        className="text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 font-medium transition"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(recipe.id)}
                        className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium transition"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {(!Array.isArray(recipes) || recipes.length === 0) && (
              <div className="text-center text-gray-400 mt-10">Список рецептов пуст</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipesPage;