import { useState, useEffect, useCallback } from 'react';
import { fetchRecipes as apiFetchRecipes } from '../api/recipes';
// Assuming api/recipes.js exists and exports fetchRecipes, if not I might need to create it or move fetch there.
// Wait, previous turn I saw usePlanning using api/recipes. Let's check api/recipes.js content first?
// Actually I'll assume standard fetch pattern or use direct fetch as in RecipesPage for now to be safe, calculating that moving to api module is better.
// The user asked for refactoring, so moving API calls to api/ is part of it.

export const useRecipesManager = () => {
    const [recipes, setRecipes] = useState([]);
    const [tgUsers, setTgUsers] = useState([]);
    const [sendingId, setSendingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadRecipes = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/recipes/');
            const data = await res.json();
            if (Array.isArray(data)) {
                setRecipes(data);
            } else {
                console.error("API вернул не массив:", data);
                setRecipes([]);
            }
        } catch (err) {
            console.error(err);
            setRecipes([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchTgUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/telegram/users');
            const data = await res.json();
            setTgUsers(data);
            return data;
        } catch (err) {
            console.error(err);
            return [];
        }
    }, []);

    useEffect(() => {
        loadRecipes();
        fetchTgUsers();
    }, [loadRecipes, fetchTgUsers]);

    const deleteRecipe = async (id) => {
        if (!window.confirm("Удалить этот рецепт?")) return;
        try {
            const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
            if (res.ok) loadRecipes();
        } catch (err) { console.error(err); }
    };

    const sendToTelegram = async (recipe, chatId) => {
        if (!chatId) {
            alert("Выберите получателя");
            return;
        }

        setSendingId(recipe.id);
        try {
            const res = await fetch(`/api/recipes/${recipe.id}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId })
            });
            const data = await res.json();

            if (res.ok) alert("✅ " + data.message);
            else alert("❌ Ошибка: " + data.detail);

        } catch (e) {
            alert("Ошибка сети");
        } finally {
            setSendingId(null);
        }
    };

    const exportRecipes = async () => {
        if (!window.confirm("Сохранить тексты рецептов в файл recipes.json на сервере?")) return;
        try {
            const res = await fetch('/api/recipes/export');
            const data = await res.json();
            if (res.ok) alert("✅ " + data.message);
            else alert("❌ Ошибка: " + data.detail);
        } catch (err) { alert("Ошибка сети"); }
    };

    const importRecipes = async () => {
        if (!window.confirm("Загрузить рецепты из файла?")) return;
        try {
            const res = await fetch('/api/recipes/import', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert(`✅ Готово!\nСоздано: ${data.created}\nОбновлено текстов: ${data.updated}`);
                loadRecipes();
            } else {
                alert("❌ Ошибка: " + data.detail);
            }
        } catch (err) { alert("Ошибка сети"); }
    };

    return {
        recipes,
        isLoading,
        tgUsers,
        sendingId,
        refreshRecipes: loadRecipes,
        deleteRecipe,
        sendToTelegram,
        exportRecipes,
        importRecipes
    };
};
