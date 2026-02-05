import React, { useState, useEffect, useRef } from 'react';
import RecipeBuilder from '../components/RecipeBuilder';
import { useRecipesManager } from '../hooks/useRecipesManager';
import RecipeFilters from '../components/recipes/RecipeFilters';
import RecipeCard from '../components/recipes/RecipeCard';

const RecipesPage = () => {
  const {
    recipes,
    tgUsers,
    sendingId,
    refreshRecipes,
    deleteRecipe,
    sendToTelegram,
    exportRecipes,
    importRecipes
  } = useRecipesManager();

  const [editingRecipe, setEditingRecipe] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const editorRef = useRef(null);

  // Scroll to editor when editing
  useEffect(() => {
    if (editingRecipe) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingRecipe]);

  // Set default selected user
  useEffect(() => {
    if (tgUsers.length > 0 && !selectedUser) {
      setSelectedUser(tgUsers[0].chat_id);
    }
  }, [tgUsers, selectedUser]);

  const handleRecipeSaved = () => {
    refreshRecipes();
    setEditingRecipe(null);
  };

  const filteredRecipes = recipes
    .filter(r => {
      const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;
      const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

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

          <button onClick={exportRecipes} className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border border-blue-200 font-medium text-sm flex items-center gap-2 transition-colors">
            💾 Сохранить тексты
          </button>
          <button onClick={importRecipes} className="px-4 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 border border-orange-200 font-medium text-sm flex items-center gap-2 transition-colors">
            📂 Загрузить тексты
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 md:overflow-hidden overflow-y-visible min-h-0">
        {/* Editor Column */}
        <div ref={editorRef} className="md:overflow-y-auto overflow-visible pr-2 scroll-mt-24">
          <RecipeBuilder
            onRecipeCreated={handleRecipeSaved}
            initialData={editingRecipe}
            onCancel={() => setEditingRecipe(null)}
          />
        </div>

        {/* List Column */}
        <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden h-full">
          <RecipeFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            totalCount={recipes.length}
          />

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isEditing={editingRecipe?.id === recipe.id}
                onEdit={setEditingRecipe}
                onDelete={deleteRecipe}
                onSendTelegram={(r) => sendToTelegram(r, selectedUser)}
                sendingId={sendingId}
                tgUsers={tgUsers}
              />
            ))}

            {filteredRecipes.length === 0 && (
              <div className="text-center text-gray-400 mt-10">
                {recipes.length === 0 ? "Список рецептов пуст" : "Ничего не найдено"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipesPage;