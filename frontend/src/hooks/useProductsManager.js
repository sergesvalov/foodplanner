import { useState, useEffect, useMemo, useCallback } from 'react';

const UNITS = ['шт', 'кг', 'г', 'л', 'мл', 'упак'];

export const useProductsManager = () => {
    const [products, setProducts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

    const [form, setForm] = useState({
        name: '', price: '', amount: '1', unit: 'г', calories: '',
        proteins: '', fats: '', carbs: '', weight_per_piece: ''
    });

    const fetchProducts = useCallback(() => {
        fetch('/api/products/')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // --- SORTING & FILTERING ---
    const sortedProducts = useMemo(() => {
        let items = [...products];

        if (searchTerm) {
            items = items.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) aValue = -1;
                if (bValue === null || bValue === undefined) bValue = -1;

                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return items;
    }, [products, sortConfig, searchTerm]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (name) => {
        if (sortConfig.key === name) {
            return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
        }
        return '';
    };

    // --- FORM HANDLERS ---
    const resetForm = () => {
        setForm({ name: '', price: '', amount: '1', unit: 'г', calories: '', proteins: '', fats: '', carbs: '', weight_per_piece: '' });
        setEditingId(null);
    };

    const handleEditClick = (product) => {
        setEditingId(product.id);
        setForm({
            name: product.name,
            price: product.price,
            amount: product.amount || 1,
            unit: product.unit,
            calories: product.calories || '',
            proteins: product.proteins !== null ? product.proteins : '',
            fats: product.fats !== null ? product.fats : '',
            carbs: product.carbs !== null ? product.carbs : '',
            weight_per_piece: product.weight_per_piece !== null ? product.weight_per_piece : ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- CRUD ---
    const handleDelete = async (id) => {
        if (!window.confirm('Удалить продукт?')) return;
        try {
            await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (editingId === id) resetForm();
            fetchProducts();
        } catch (err) {
            console.error(err);
            alert("Ошибка при удалении");
        }
    };

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
            let url = '/api/products/';
            let method = 'POST';

            if (editingId) {
                url = `/api/products/${editingId}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                fetchProducts();
                alert("Продукт сохранен!");
            } else {
                const data = await res.json();
                alert("Ошибка: " + data.detail);
            }
        } catch (err) { console.error(err); }
    };

    // --- ACTIONS ---
    const handleCreateRecipe = async () => {
        if (!window.confirm("Сохранить продукт и создать из него рецепт?")) return;

        const payload = {
            name: form.name,
            price: parseFloat(form.price),
            amount: parseFloat(form.amount),
            unit: form.unit,
            calories: form.calories ? parseFloat(form.calories) : 0,
            proteins: form.proteins ? parseFloat(form.proteins) : null,
            fats: form.fats ? parseFloat(form.fats) : null,
            carbs: form.carbs ? parseFloat(form.carbs) : null,
            weight_per_piece: form.weight_per_piece ? parseFloat(form.weight_per_piece) : null
        };

        try {
            // 1. Save/Update Product
            let url = '/api/products/';
            let method = 'POST';

            if (editingId) {
                url = `/api/products/${editingId}`;
                method = 'PUT';
            }

            const resProduct = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const productData = await resProduct.json();

            if (!resProduct.ok) {
                alert("Ошибка при сохранении продукта: " + productData.detail);
                return;
            }

            // 2. Create Recipe
            const productId = productData.id || editingId;

            const recipePayload = {
                title: payload.name,
                description: "Автоматически создано из продукта",
                category: "other",
                portions: 1,
                ingredients: [
                    {
                        product_id: productId,
                        quantity: payload.amount
                    }
                ]
            };

            const resRecipe = await fetch('/api/recipes/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recipePayload)
            });

            const recipeData = await resRecipe.json();

            if (resRecipe.ok) {
                alert(`✅ Продукт сохранен и рецепт "${recipeData.title}" создан!`);
                fetchProducts();
            } else {
                alert("Продукт сохранен, но ошибка создания рецепта: " + recipeData.detail);
                fetchProducts();
            }

        } catch (err) {
            console.error(err);
            alert("Ошибка сети");
        }
    };

    const handleServerExport = async () => {
        if (!window.confirm("Сохранить текущую базу в файл на сервере?")) return;
        try {
            const res = await fetch('/api/products/export');
            const data = await res.json();
            if (res.ok) alert("✅ " + data.message);
            else alert("❌ Ошибка: " + data.detail);
        } catch (err) { alert("Ошибка сети"); }
    };

    const handleServerImport = async () => {
        if (!window.confirm("Загрузить данные из файла на сервере?")) return;
        try {
            const res = await fetch('/api/products/import', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert(`✅ Успешно!\nСоздано: ${data.created}\nОбновлено: ${data.updated}`);
                fetchProducts();
            } else {
                alert("❌ Ошибка: " + data.detail);
            }
        } catch (err) { alert("Ошибка сети"); }
    };

    return {
        products,
        sortedProducts,
        editingId,
        form,
        setForm,
        searchTerm,
        setSearchTerm,
        UNITS,
        requestSort,
        getSortIndicator,
        resetForm,
        handleEditClick,
        handleDelete,
        handleSubmit,
        handleCreateRecipe,
        handleServerExport,
        handleServerImport
    };
};
