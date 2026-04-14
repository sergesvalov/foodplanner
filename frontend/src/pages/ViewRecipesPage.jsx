import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIES, getCategoryById, getCategoryIcon, getCategoryStyle, getCategoryLabel } from '../constants/categories';
import RecipeBuilder from '../components/RecipeBuilder';
import ProductForm from '../components/products/ProductForm';

// ─── Utility ────────────────────────────────────────────────────────────────

const API_BASE = '/api';

const fetchRecipes = async (query = '') => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    const url = `${API_BASE}/recipes/?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Ошибка загрузки рецептов');
    return res.json();
};

const fetchProducts = async (query = '') => {
    const params = new URLSearchParams();
    if (query) params.append('name', query);
    const url = `${API_BASE}/products/?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Ошибка загрузки продуктов');
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

// ─── Edit Modal ──────────────────────────────────────────────────────────────

const EditModal = ({ recipe, onClose, onSaved }) => {
    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // Prevent body scroll while open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,15,30,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-lg font-bold text-indigo-700">✏️ Редактирование рецепта</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg"
                        title="Закрыть"
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable builder */}
                <div className="overflow-y-auto flex-1 p-6">
                    <RecipeBuilder
                        initialData={recipe}
                        onRecipeCreated={onSaved}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    );
};

// ─── Product Edit Modal ──────────────────────────────────────────────────────

const ProductEditModal = ({ product, onClose, onSaved }) => {
    const UNITS = ['шт', 'кг', 'г', 'л', 'мл', 'упак'];
    const [form, setForm] = useState({
        name: product.name || '',
        price: product.price || '',
        amount: product.amount || 1,
        unit: product.unit || 'г',
        calories: product.calories || '',
        proteins: product.proteins !== null ? product.proteins : '',
        fats: product.fats !== null ? product.fats : '',
        carbs: product.carbs !== null ? product.carbs : '',
        weight_per_piece: product.weight_per_piece !== null ? product.weight_per_piece : ''
    });

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: form.name,
            price: parseFloat(form.price),
            amount: parseFloat(form.amount),
            unit: form.unit,
            calories: form.calories !== '' ? parseFloat(form.calories) : 0,
            proteins: form.proteins !== '' && form.proteins !== null ? parseFloat(form.proteins) : null,
            fats: form.fats !== '' && form.fats !== null ? parseFloat(form.fats) : null,
            carbs: form.carbs !== '' && form.carbs !== null ? parseFloat(form.carbs) : null,
            weight_per_piece: form.weight_per_piece !== '' && form.weight_per_piece !== null ? parseFloat(form.weight_per_piece) : null
        };

        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onSaved();
            } else {
                const data = await res.json();
                alert("Ошибка: " + data.detail);
            }
        } catch (err) {
            console.error(err);
            alert("Ошибка сети");
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            style={{ background: 'rgba(15,15,30,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-lg font-bold text-indigo-700">✏️ Редактирование продукта</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg"
                        title="Закрыть"
                    >
                        ✕
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    <ProductForm
                        form={form}
                        setForm={setForm}
                        handleSubmit={handleSubmit}
                        handleCreateRecipe={() => {}} // Disabled in this modal
                        resetForm={onClose}
                        editingId={product.id}
                        UNITS={UNITS}
                    />
                </div>
            </div>
        </div>
    );
};

// ─── Category Pill ───────────────────────────────────────────────────────────

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

// ─── View Item Modal ──────────────────────────────────────────────────────────

const ViewItemModal = ({ item, type, onClose, tgUsers, sendingId, onSend, onEdit }) => {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const isRecipe = type === 'recipe';
    const cat = isRecipe ? getCategoryById(item.category) : null;
    const portions = isRecipe ? (item.portions || 1) : 1;
    const prot = isRecipe ? Math.round((item.total_proteins || 0) / portions) : (item.proteins ?? 0);
    const fat = isRecipe ? Math.round((item.total_fats || 0) / portions) : (item.fats ?? 0);
    const carb = isRecipe ? Math.round((item.total_carbs || 0) / portions) : (item.carbs ?? 0);
    
    const isSending = sendingId === item.id;

    const stripeColor = isRecipe ? ({
        breakfast: 'bg-yellow-400', soup: 'bg-red-400', main: 'bg-orange-400',
        side: 'bg-green-400', snack: 'bg-purple-400', yummy: 'bg-pink-400',
        drink: 'bg-teal-400',
    }[cat.id] || 'bg-gray-400') : 'bg-cyan-400';

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
            style={{ background: 'rgba(15,15,30,0.6)', backdropFilter: 'blur(5px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-full flex flex-col overflow-hidden relative">
                <div className={`h-3 w-full ${stripeColor}`} />
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors text-xl font-bold"
                >
                    ✕
                </button>

                <div className="overflow-y-auto p-6 sm:p-8 flex-1">
                    <div className="mb-4 pr-12">
                        {isRecipe ? (
                            <span className={`inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded border mb-3 ${getCategoryStyle(item.category)}`}>
                                {getCategoryIcon(item.category)} {getCategoryLabel(item.category)}
                            </span>
                        ) : (
                            <span className="inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded border border-cyan-200 text-cyan-700 bg-cyan-50 mb-3">
                                🛒 Продукт
                            </span>
                        )}
                        <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">
                            {isRecipe ? item.title : item.name}
                        </h2>
                        {isRecipe && item.rating > 0 && (
                            <div className="mt-2 text-lg text-amber-500">
                                {'⭐'.repeat(item.rating)}
                            </div>
                        )}
                    </div>

                    {isRecipe && item.description && (
                        <p className="text-gray-600 text-lg leading-relaxed mb-6">
                            {item.description}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        {isRecipe ? (
                            <>
                                <span className="px-3 py-1.5 rounded-full border bg-green-50 text-green-700 border-green-200 font-bold">€{(item.total_cost || 0).toFixed(2)} / всего</span>
                                {item.calories_per_portion > 0 && (
                                    <span className="px-3 py-1.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200 font-bold">🔥 {item.calories_per_portion} ккал/порция</span>
                                )}
                                {item.weight_per_portion > 0 && (
                                    <span className="px-3 py-1.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 font-bold">⚖️ {item.weight_per_portion}г/порция</span>
                                )}
                            </>
                        ) : (
                            <>
                                <span className="px-3 py-1.5 rounded-full border bg-gray-100 text-gray-700 border-gray-200 font-bold">Базовая порция: {item.amount} {item.unit}</span>
                                {item.price > 0 && <span className="px-3 py-1.5 rounded-full border bg-green-50 text-green-700 border-green-200 font-bold">€{item.price}</span>}
                                {item.weight_per_piece > 0 && <span className="px-3 py-1.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">{item.weight_per_piece}г/шт</span>}
                                {item.calories > 0 && <span className="px-3 py-1.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200 font-bold">🔥 {item.calories} ккал/{item.unit === 'шт' ? 'шт' : '100г'}</span>}
                            </>
                        )}
                        <span className="px-3 py-1.5 rounded-full border bg-blue-100 text-blue-700 border-blue-200 font-bold">Б:{prot}</span>
                        <span className="px-3 py-1.5 rounded-full border bg-yellow-100 text-yellow-700 border-yellow-200 font-bold">Ж:{fat}</span>
                        <span className="px-3 py-1.5 rounded-full border bg-red-100 text-red-700 border-red-200 font-bold">У:{carb}</span>
                    </div>

                    {item.ingredients && item.ingredients.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Ингредиенты</h3>
                            <ul className="space-y-2">
                                {item.ingredients.map(ing => (
                                    <li key={ing.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-xl">
                                        <span className="font-medium text-gray-800 text-lg">{ing.product?.name || '...'}</span>
                                        <span className="text-gray-600 font-bold bg-white px-3 py-1.5 rounded-lg shadow-sm">
                                            {ing.quantity} {ing.product?.unit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="pt-4 flex flex-wrap gap-4 border-t border-gray-100">
                        <button
                            onClick={() => { onClose(); onEdit(item); }}
                            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-lg font-bold border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 active:scale-95 transition-all"
                        >
                            ✏️ Редактировать
                        </button>
                        {isRecipe && tgUsers && tgUsers.length > 0 && (
                            <button
                                onClick={() => onSend(item)}
                                disabled={isSending}
                                className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-lg font-bold border transition-all
                                    ${isSending
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 active:scale-95'
                                    }`}
                            >
                                {isSending ? '⏳ Отправляем...' : '✈️ Отправить в Telegram'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Gallery Card ─────────────────────────────────────────────────────────────

const RecipeGalleryCard = ({ recipe, tgUsers, selectedUser, sendingId, onSend, onEdit, onView }) => {
    const cat = getCategoryById(recipe.category);
    const portions = recipe.portions || 1;
    const prot = Math.round((recipe.total_proteins || 0) / portions);
    const fat = Math.round((recipe.total_fats || 0) / portions);
    const carb = Math.round((recipe.total_carbs || 0) / portions);
    const isSending = sendingId === recipe.id;

    const stripeColor = {
        breakfast: 'bg-yellow-400', soup: 'bg-red-400', main: 'bg-orange-400',
        side: 'bg-green-400', snack: 'bg-purple-400', yummy: 'bg-pink-400',
        drink: 'bg-teal-400',
    }[cat.id] || 'bg-gray-400';

    return (
        <div 
            onClick={() => onView(recipe)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
        >
            {/* Category stripe */}
            <div className={`h-1.5 w-full ${stripeColor}`} />

            <div className="p-4 flex flex-col gap-2 flex-1">
                {/* Category + Rating */}
                <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${getCategoryStyle(recipe.category)}`}>
                        {getCategoryIcon(recipe.category)} {getCategoryLabel(recipe.category)}
                    </span>
                    <div className="flex items-center gap-2">
                        {recipe.rating > 0 && (
                            <span className="text-xs text-amber-500" title={`Оценка: ${recipe.rating}/5`}>
                                {'⭐'.repeat(recipe.rating)}
                            </span>
                        )}
                        {/* Edit button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(recipe); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all duration-150 text-sm"
                            title="Редактировать рецепт"
                        >
                            ✏️
                        </button>
                    </div>
                </div>

                {/* Title */}
                <h3
                    className="text-gray-900 font-bold text-base leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2"
                    title={recipe.title}
                >
                    {recipe.title}
                </h3>

                {/* Description */}
                {recipe.description && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                        {recipe.description}
                    </p>
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

                {/* Action buttons row */}
                <div className={`grid gap-2 ${tgUsers.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(recipe); }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 hover:shadow-sm active:scale-95 transition-all duration-200"
                    >
                        ✏️ Изменить
                    </button>

                    {tgUsers.length > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSend(recipe); }}
                            disabled={isSending}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200
                                ${isSending
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-400 hover:shadow-sm active:scale-95'
                                }`}
                        >
                            {isSending ? '⏳ Отправляем...' : '✈️ Telegram'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProductGalleryCard = ({ product, onView }) => {
    return (
        <div 
            onClick={() => onView(product)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
        >
            <div className="h-1.5 w-full bg-cyan-400" />
            <div className="p-4 flex flex-col gap-2 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-cyan-200 text-cyan-700 bg-cyan-50 self-start">
                    🛒 Продукт
                </span>
                
                <h3 className="text-gray-900 font-bold text-base leading-snug group-hover:text-indigo-700 transition-colors" title={product.name}>
                    {product.name}
                </h3>
                
                <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Базовая порция:</strong> {product.amount} {product.unit}</p>
                    {product.price > 0 && <p><strong>Цена:</strong> €{product.price}</p>}
                    {product.weight_per_piece > 0 && <p><strong>Вес 1 шт:</strong> {product.weight_per_piece}г</p>}
                </div>
            </div>

            <div className="px-4 pb-4 flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5">
                    {product.calories > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200">
                            🔥 {product.calories} ккал/{product.unit === 'шт' ? 'шт' : '100г'}
                        </span>
                    )}
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-blue-100 text-blue-700 border-blue-200">Б:{product.proteins ?? 0}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-yellow-100 text-yellow-700 border-yellow-200">Ж:{product.fats ?? 0}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200">У:{product.carbs ?? 0}</span>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const ViewRecipesPage = () => {
    const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' | 'products'
    const [recipes, setRecipes] = useState([]);
    const [products, setProducts] = useState([]);
    const [tgUsers, setTgUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [sendingId, setSendingId] = useState(null);
    const [editingRecipe, setEditingRecipe] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const debounceTimer = useRef(null);

    // Debounce search
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 350);
        return () => clearTimeout(debounceTimer.current);
    }, [searchTerm]);

    const loadData = async (query = debouncedSearch, tab = activeTab) => {
        setIsLoading(true);
        try {
            if (tab === 'recipes') {
                const data = await fetchRecipes(query);
                setRecipes(Array.isArray(data) ? data : []);
            } else {
                const data = await fetchProducts(query);
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error(e);
            if (tab === 'recipes') setRecipes([]);
            else setProducts([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Load data when debounced search or activeTab changes
    useEffect(() => {
        loadData(debouncedSearch, activeTab);
    }, [debouncedSearch, activeTab]);

    // Load TG users once
    useEffect(() => {
        fetchTgUsers().then(data => {
            setTgUsers(data);
            if (data.length > 0) setSelectedUser(data[0].chat_id);
        });
    }, []);

    // Client-side category filter for recipes
    const filteredRecipes = recipes
        .filter(r => selectedCategory === 'all' || r.category === selectedCategory)
        .sort((a, b) => a.title.localeCompare(b.title));

    const currentItems = activeTab === 'recipes' ? filteredRecipes : products;

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

    const handleRecipeSaved = () => {
        setEditingRecipe(null);
        loadData(debouncedSearch, activeTab);
    };

    const handleProductSaved = () => {
        setEditingProduct(null);
        loadData(debouncedSearch, activeTab);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-gray-50">

            {/* View Modal */}
            {viewingItem && (
                <ViewItemModal
                    item={viewingItem.data}
                    type={viewingItem.type}
                    onClose={() => setViewingItem(null)}
                    tgUsers={tgUsers}
                    sendingId={sendingId}
                    onSend={handleSend}
                    onEdit={viewingItem.type === 'recipe' ? setEditingRecipe : setEditingProduct}
                />
            )}

            {/* Edit Modals */}
            {editingRecipe && (
                <EditModal
                    recipe={editingRecipe}
                    onClose={() => setEditingRecipe(null)}
                    onSaved={handleRecipeSaved}
                />
            )}

            {editingProduct && (
                <ProductEditModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSaved={handleProductSaved}
                />
            )}

            {/* ─── Hero Search ──────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-10 pb-14 shadow-lg">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                        🔎 Каталог
                    </h1>
                    <p className="text-indigo-200 text-sm mb-6">Найди идеальное блюдо или продукт</p>

                    {/* Tab Toggle */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-white/20 p-1 rounded-2xl inline-flex backdrop-blur-sm border border-white/30">
                            <button
                                onClick={() => setActiveTab('recipes')}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                                    activeTab === 'recipes'
                                    ? 'bg-white text-indigo-700 shadow flex-1'
                                    : 'text-white hover:bg-white/10 flex-1'
                                }`}
                            >
                                🍽️ Рецепты
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                                    activeTab === 'products'
                                    ? 'bg-white text-indigo-700 shadow flex-1'
                                    : 'text-white hover:bg-white/10 flex-1'
                                }`}
                            >
                                🛒 Продукты
                            </button>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative max-w-xl mx-auto">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">🔍</span>
                        <input
                            id="view-search-input"
                            type="text"
                            placeholder={activeTab === 'recipes' ? "Название блюда..." : "Название продукта..."}
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

            {/* ─── Category pills (Only for recipes) ────────────────── */}
            {activeTab === 'recipes' && (
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
            )}

            {/* ─── Results ─────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Counter */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        {isLoading
                            ? 'Ищем...'
                            : `${currentItems.length} ${
                                currentItems.length === 1 
                                ? (activeTab === 'recipes' ? 'рецепт' : 'продукт') 
                                : currentItems.length < 5 
                                    ? (activeTab === 'recipes' ? 'рецепта' : 'продукта') 
                                    : (activeTab === 'recipes' ? 'рецептов' : 'продуктов')
                              }`
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
                {!isLoading && currentItems.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <div className="text-6xl mb-4">{activeTab === 'recipes' ? '🍽️' : '🛒'}</div>
                        <p className="text-lg font-medium text-gray-500 mb-1">Ничего не найдено</p>
                        <p className="text-sm">Попробуй другой запрос или сбрось фильтры</p>
                    </div>
                )}

                {/* Grid */}
                {!isLoading && currentItems.length > 0 && (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${activeTab === 'products' ? 'mt-6' : ''}`}>
                        {currentItems.map(item => (
                            activeTab === 'recipes' ? (
                                <RecipeGalleryCard
                                    key={item.id}
                                    recipe={item}
                                    tgUsers={tgUsers}
                                    selectedUser={selectedUser}
                                    sendingId={sendingId}
                                    onSend={handleSend}
                                    onEdit={setEditingRecipe}
                                    onView={(r) => setViewingItem({ type: 'recipe', data: r })}
                                />
                            ) : (
                                <ProductGalleryCard
                                    key={item.id}
                                    product={item}
                                    onView={(p) => setViewingItem({ type: 'product', data: p })}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewRecipesPage;
