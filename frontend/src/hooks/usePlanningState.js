import { useState, useEffect, useCallback } from 'react';
import { fetchRecipes } from '../api/recipes';
import { fetchPlan } from '../api/plan';
import { fetchFamily } from '../api/admin';

export const usePlanningState = () => {
    // -------------------------------------------------------------------------
    // 1. Data Fetching & Basic State
    // -------------------------------------------------------------------------
    const [recipes, setRecipes] = useState([]);
    const [weeklyPlan, setWeeklyPlan] = useState([]);
    const [familyMembers, setFamilyMembers] = useState([]);

    useEffect(() => {
        Promise.all([
            fetchRecipes().catch(console.error),
            fetchPlan().catch(console.error),
            fetchFamily().catch(console.error)
        ]).then(([recipesData, planData, familyData]) => {
            if (Array.isArray(recipesData)) setRecipes(recipesData);
            if (Array.isArray(planData)) setWeeklyPlan(planData);
            if (Array.isArray(familyData)) setFamilyMembers(familyData);
        });
    }, []);

    // -------------------------------------------------------------------------
    // 2. Local Storage Persisted State
    // -------------------------------------------------------------------------

    // Hidden Recipes
    const [hiddenIds, setHiddenIds] = useState(() => {
        const saved = localStorage.getItem('planning_hidden_recipes');
        return saved ? JSON.parse(saved) : [];
    });
    useEffect(() => {
        localStorage.setItem('planning_hidden_recipes', JSON.stringify(hiddenIds));
    }, [hiddenIds]);

    // Highlighted (Pinned) Recipes
    const [highlightedIds, setHighlightedIds] = useState(() => {
        const saved = localStorage.getItem('planning_highlighted_recipes');
        return saved ? JSON.parse(saved) : [];
    });
    useEffect(() => {
        localStorage.setItem('planning_highlighted_recipes', JSON.stringify(highlightedIds));
    }, [highlightedIds]);

    // Planned Portions { recipeId: number }
    const [plannedPortions, setPlannedPortions] = useState(() => {
        try {
            const saved = localStorage.getItem('planning_portions');
            const parsed = saved ? JSON.parse(saved) : {};
            return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
        } catch (e) {
            console.error('Error parsing planning_portions', e);
            return {};
        }
    });
    useEffect(() => {
        localStorage.setItem('planning_portions', JSON.stringify(plannedPortions));
    }, [plannedPortions]);

    // Eaters Count
    const [eatersCount, setEatersCount] = useState(() => {
        const saved = localStorage.getItem('planning_eaters_count');
        return saved ? parseInt(saved) : 2;
    });
    useEffect(() => {
        localStorage.setItem('planning_eaters_count', eatersCount);
    }, [eatersCount]);

    // Sync eatersCount if uninitialized
    useEffect(() => {
        if (localStorage.getItem('planning_eaters_count') === null && familyMembers.length > 0) {
            setEatersCount(familyMembers.length);
        }
    }, [familyMembers]);

    // Planned Meals
    const [plannedMeals, setPlannedMeals] = useState([]);

    // State for Next Week Start Date (to calculate target dates for API)
    const [nextMondayDate, setNextMondayDate] = useState(null);

    // Initial Load - Next Week
    const loadSharedPlan = useCallback(async () => {
        try {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const currentMonday = new Date(today);
            currentMonday.setDate(today.getDate() - diffToMon);

            const nextMonday = new Date(currentMonday);
            nextMonday.setDate(currentMonday.getDate() + 7);

            // Store valid Date object
            setNextMondayDate(nextMonday);

            const nextSunday = new Date(nextMonday);
            nextSunday.setDate(nextMonday.getDate() + 6);

            const formatDate = (d) => d.toISOString().split('T')[0];

            const data = await fetchPlan(formatDate(nextMonday), formatDate(nextSunday));

            if (Array.isArray(data)) {
                const daysMap = {
                    'Понедельник': 0, 'Вторник': 1, 'Среда': 2, 'Четверг': 3,
                    'Пятница': 4, 'Суббота': 5, 'Воскресенье': 6
                };

                const mapped = data.map(item => ({
                    id: item.id, // Keep ID for updates/deletes
                    day: daysMap[item.day_of_week],
                    // Keep type as is (lunch/dinner separate)
                    type: item.meal_type,
                    recipeId: item.recipe_id,
                    memberId: item.family_member_id,
                    portions: item.portions || 1
                })).filter(i => i.day !== undefined);

                setPlannedMeals(mapped);
            }
        } catch (e) {
            console.error("Failed to load shared plan", e);
        }
    }, []);

    useEffect(() => {
        loadSharedPlan();
    }, [loadSharedPlan]);

    return {
        recipes,
        weeklyPlan,
        familyMembers,
        hiddenIds,
        setHiddenIds,
        highlightedIds,
        setHighlightedIds,
        plannedPortions,
        setPlannedPortions,
        eatersCount,
        setEatersCount,
        plannedMeals,
        setPlannedMeals,
        nextMondayDate,
        loadSharedPlan
    };
};
