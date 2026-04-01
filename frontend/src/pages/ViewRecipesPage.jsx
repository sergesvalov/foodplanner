import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CATEGORIES, getCategoryById, getCategoryIcon, getCategoryStyle, getCategoryLabel } from '../constants/categories';

// ─── Utility ────────────────────────────────────────────────────────────────

const API_BASE = '/api';

const fetchRecipes = async (query = '', category = 'all') => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    const url = `${API_BASE}/recipes/?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Ошибка загрузки рецептов');
    return res.json();
};

const fetchTgUsers = async () => {
    const res = await fetch(`${API_BASE}/admin/telegram/users`);
    if (!res.ok) return [];
    return res.json();
};

const sendToTelegram = async (recipeId, chatId) => {
    const res = await fetch(`${API_BASE}/recipes/${recipeId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
    });
    return res.json();
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const CategoryPill = ({ cat, isSelected, onClick }) => (
    <button
        onClick={() => onClick(cat.id)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap
            ${isSelected
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm'
            }`}
    >
        <span>{cat.icon}</span>
        <span>{cat.label}</span>
    </button>
);

const StatBadge = ({ label, value, color }) => (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${color}`} title={label}>
        {label}: {value}
    </span>
);

const RecipeGalleryCard = ({ recipe, tgUsers, selectedUser, sendingId, onSend }) => {
    const [expanded, setExpanded] = useState(false);
    const cat = getCategoryById(recipe.category);
    const portions = recipe.portions || 1;
    const prot = Math.round((recipe.total_proteins || 0) / portions);
    const fat = Math.round((recipe.total_fats || 0) / portions);
    const carb = Math.round((recipe.total_carbs || 0) / portions);
    const isSending = sendingId === recipe.id;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden group">
            {/* Header stripe by category */}
            <div className={`h-1.5 w-full ${cat.id === 'breakfast' ? 'bg-yellow-400' : cat.id === 'soup' ? 'bg-red-400' : cat.id === 'main' ? 'bg-orange-400' : cat.id === 'side' ? 'bg-green-400' : cat.id === 'snack' ? 'bg-purple-400' : cat.id === 'yummy' ? 'bg-pink-400' : cat.id === 'drink' ? 'bg-teal-400' : 'bg-gray-400'}`} />

            <div className="p-4 flex flex-col gap-2 flex-1">
                {/* Category + Rating */}
                <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${getCategoryStyle(recipe.category)}`}>
                        {getCategoryIcon(recipe.category)} {getCategoryLabel(recipe.category)}
                    </span>
                    {recipe.rating > 0 && (
                        <span className="text-xs text-amber-500" title={`Оценка: ${recipe.rating}/5`}>
                            {'⭐'.repeat(recipe.rating)}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-gray-900 font-bold text-base leading-snug group-hover:text-indigo-700 transition-colors cursor-pointer line-clamp-2"
                    onClick={() => setExpanded(e => !e)}
                    title={recipe.title}
                >
                    {recipe.title}
                </h3>

                {/* Description */}
                {recipe.description && (
                    <p className={`text-sm text-gray-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
                        {recipe.description}
                    </p>
                )}

                {/* Ingredients (expanded) */}
                {expanded && recipe.ingredients && recipe.ingredients.length > 0 && (
                    <div className="mt-1 pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ингредиенты</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                            {recipe.ingredients.map(ing => (
                                <li key={ing.id} className="flex justify-between">
                                    <span>{ing.product?.name || '...'}</span>
                                    <span className="text-gray-400">{ing.quantity} {ing.product?.unit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Toggle */}
                {(recipe.description || (recipe.ingredients && recipe.ingredients.length > 0)) && (
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 text-left mt-auto transition-colors"
                    >
                        {expanded ? '▲ Свернуть' : '▼ Подробнее'}
                    </button>
                )}
            </div>

            {/* Stats & Actions */}
            <div className="px-4 pb-4 flex flex-col gap-3">
                {/* Stats badges */}
                <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
                        €{(recipe.total_cost || 0).toFixed(2)}
                    </span>
                    {recipe.calories_per_portion > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200">
                            🔥 {recipe.calories_per_portion} ккал
                        </span>
                    )}
                    {recipe.weight_per_portion > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                            ⚖️ {recipe.weight_per_portion}г
                        </span>
                    )}
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-blue-100 text-blue-700 border-blue-200">Б:{prot}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-yellow-100 text-yellow-700 border-yellow-200">Ж:{fat}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200">У:{carb}</span>
                </div>

                {/* Send to Telegram */}
                {tgUsers.length > 0 && (
                    <button
                        onClick={() => onSend(recipe)}
                        disabled={isSending}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200
                            ${isSending
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-400 hover:shadow-sm active:scale-95'
                            }`}
                    >
                        {isSending ? '⏳ Отправляем...' : '✈️ Отправить в Telegram'}
                    </button>
                )}
            </div>
        </div>
    );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const ViewRecipesPage = () => {
    const [recipes, setRecipes] = useState([]);
    const [tgUsers, setTgUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [sendingId, setSendingId] = useState(null);
    const debounceTimer = useRef(null);

    // Debounce search
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 350);
        return () => clearTimeout(debounceTimer.current);
    }, [searchTerm]);

    // Load recipes when debounced search term changes
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await fetchRecipes(debouncedSearch);
                setRecipes(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
                setRecipes([]);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [debouncedSearch]);

    // Load TG users
    useEffect(() => {
        fetchTgUsers().then(data => {
            setTgUsers(data);
            if (data.length > 0) setSelectedUser(data[0].chat_id);
        });
    }, []);

    // Client-side category filter
    const filteredRecipes = recipes
        .filter(r => selectedCategory === 'all' || r.category === selectedCategory)
        .sort((a, b) => a.title.localeCompare(b.title));

    const handleSend = async (recipe) => {
        if (!selectedUser) { alert('Выберите получателя'); return; }
        setSendingId(recipe.id);
        try {
            const data = await sendToTelegram(recipe.id, selectedUser);
            if (data.status === 'ok') alert(`✅ ${data.message}`);
            else alert('❌ Ошибка: ' + (data.detail || 'неизвестная ошибка'));
        } catch {
            alert('Ошибка сети');
        } finally {
            setSendingId(null);
        }
    };

    const handleCategoryClick = (id) => {
        setSelectedCategory(prev => prev === id ? 'all' : id);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-gray-50">

            {/* ─── Hero Search ──────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-10 pb-14 shadow-lg">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                        🔎 Каталог рецептов
                    </h1>
                    <p className="text-indigo-200 text-sm mb-6">Найди идеальное блюдо по названию или категории</p>

                    {/* Search Input */}
                    <div className="relative max-w-xl mx-auto">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">🔍</span>
                        <input
                            id="view-search-input"
                            type="text"
                            placeholder="Название блюда..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-12 py-3.5 rounded-2xl text-gray-800 bg-white shadow-xl border-0 outline-none text-base focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg transition-colors"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* TG user selector */}
                    {tgUsers.length > 0 && (
                        <div className="flex justify-center mt-4">
                            <select
                                id="view-tg-user-select"
                                value={selectedUser}
                                onChange={e => setSelectedUser(e.target.value)}
                                className="text-sm bg-white/20 text-white border border-white/30 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                            >
                                {tgUsers.map(u => (
                                    <option key={u.id} value={u.chat_id} className="text-gray-800">{u.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Category pills ───────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 -mt-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap
                            ${selectedCategory === 'all'
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm'
                            }`}
                    >
                        🍽️ Все
                    </button>
                    {CATEGORIES.map(cat => (
                        <CategoryPill
                            key={cat.id}
                            cat={cat}
                            isSelected={selectedCategory === cat.id}
                            onClick={handleCategoryClick}
                        />
                    ))}
                </div>
            </div>

            {/* ─── Results ─────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Counter */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        {isLoading
                            ? 'Ищем...'
                            : `${filteredRecipes.length} ${filteredRecipes.length === 1 ? 'рецепт' : filteredRecipes.length < 5 ? 'рецепта' : 'рецептов'}`
                        }
                        {(debouncedSearch || selectedCategory !== 'all') && (
                            <button
                                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                                className="ml-2 text-indigo-500 hover:text-indigo-700 underline underline-offset-2"
                            >
                                Сбросить фильтры
                            </button>
                        )}
                    </p>
                </div>

                {/* Loading skeleton */}
                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                                <div className="h-1.5 bg-gray-200" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-100 rounded w-full" />
                                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && filteredRecipes.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <div className="text-6xl mb-4">🍽️</div>
                        <p className="text-lg font-medium text-gray-500 mb-1">Ничего не найдено</p>
                        <p className="text-sm">Попробуй другой запрос или сбрось фильтры</p>
                    </div>
                )}

                {/* Recipe grid */}
                {!isLoading && filteredRecipes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRecipes.map(recipe => (
                            <RecipeGalleryCard
                                key={recipe.id}
                                recipe={recipe}
                                tgUsers={tgUsers}
                                selectedUser={selectedUser}
                                sendingId={sendingId}
                                onSend={handleSend}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewRecipesPage;
