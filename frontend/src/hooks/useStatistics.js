import { useState, useEffect, useMemo } from 'react';
import { calculateItemStats } from '../utils/stats';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export const useStatistics = () => {
    const [plan, setPlan] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('all');
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper: Получить диапазон дат недели (Пн-Вс)
    const getWeekRange = (baseDate) => {
        const currentDay = baseDate.getDay();
        const dayIndex = currentDay === 0 ? 6 : currentDay - 1; // 0=Mon, 6=Sun

        const start = new Date(baseDate);
        start.setDate(baseDate.getDate() - dayIndex);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        const fmt = (d) => {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${yyyy}-${mm}-${dd}`;
        };

        const fmtDisplay = (d) => {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            return `${dd}.${mm}`;
        };

        return {
            start: fmt(start),
            end: fmt(end),
            display: `${fmtDisplay(start)} - ${fmtDisplay(end)}`
        };
    };

    const changeWeek = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (offset * 7));
        setCurrentDate(newDate);
    };

    // 1. Загрузка данных
    useEffect(() => {
        setLoading(true);
        const { start, end } = getWeekRange(currentDate);

        Promise.all([
            fetch(`/api/plan/?start_date=${start}&end_date=${end}`).then(res => res.json()),
            fetch('/api/admin/family').then(res => res.json())
        ])
            .then(([planData, usersData]) => {
                setPlan(Array.isArray(planData) ? planData : []);
                setUsers(Array.isArray(usersData) ? usersData : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [currentDate]);

    // 2. Агрегация данных
    const stats = useMemo(() => {
        const dailyStats = {};
        let totalCost = 0;
        let totalCals = 0;
        let totalProt = 0;
        let totalFat = 0;
        let totalCarb = 0;

        // Инициализируем нулями
        DAYS.forEach(day => {
            dailyStats[day] = { cost: 0, cals: 0, prot: 0, fat: 0, carb: 0, itemsCount: 0 };
        });

        plan.forEach(item => {
            // Фильтрация по пользователю
            if (selectedUser !== 'all') {
                if (item.family_member_id !== parseInt(selectedUser)) return;
            }

            if (dailyStats[item.day_of_week]) {
                const { cost, cals, prot, fat, carb } = calculateItemStats(item);
                dailyStats[item.day_of_week].cost += cost;
                dailyStats[item.day_of_week].cals += cals;
                dailyStats[item.day_of_week].prot += prot;
                dailyStats[item.day_of_week].fat += fat;
                dailyStats[item.day_of_week].carb += carb;
                dailyStats[item.day_of_week].itemsCount += 1;

                totalCost += cost;
                totalCals += cals;
                totalProt += prot;
                totalFat += fat;
                totalCarb += carb;
            }
        });

        return {
            daily: dailyStats,
            total: {
                cost: totalCost,
                cals: totalCals,
                prot: totalProt,
                fat: totalFat,
                carb: totalCarb
            }
        };
    }, [plan, selectedUser]);

    // 3. Расчет дневного лимита калорий и БЖУ
    const dailyLimit = useMemo(() => {
        // Дефолтные значения
        const defaults = { cals: 2000, prot: 135, fat: 100, carb: 300 };

        if (selectedUser === 'all') {
            const res = { cals: 0, prot: 0, fat: 0, carb: 0 };
            if (users.length === 0) return { cals: defaults.cals * 2, prot: defaults.prot * 2, fat: defaults.fat * 2, carb: defaults.carb * 2 }; // Fallback

            users.forEach(u => {
                res.cals += (u.max_calories || defaults.cals);
                res.prot += (u.max_proteins || defaults.prot);
                res.fat += (u.max_fats || defaults.fat);
                res.carb += (u.max_carbs || defaults.carb);
            });
            return res;
        } else {
            const user = users.find(u => u.id === parseInt(selectedUser));
            if (!user) return defaults;
            return {
                cals: user.max_calories || defaults.cals,
                prot: user.max_proteins || defaults.prot,
                fat: user.max_fats || defaults.fat,
                carb: user.max_carbs || defaults.carb
            };
        }
    }, [users, selectedUser]);

    return {
        plan,
        users,
        selectedUser,
        setSelectedUser,
        loading,
        currentDate,
        setCurrentDate,
        changeWeek,
        stats,
        dailyLimit,
        getWeekRange,
        DAYS
    };
};
