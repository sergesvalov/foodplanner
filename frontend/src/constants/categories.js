export const CATEGORIES = [
    {
        id: 'breakfast',
        label: 'Завтрак',
        icon: '🍳',
        style: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    {
        id: 'soup',
        label: 'Первое',
        icon: '🍲',
        style: 'bg-red-100 text-red-800 border-red-200'
    },
    {
        id: 'main',
        label: 'Второе',
        icon: '🍗',
        style: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    {
        id: 'side',
        label: 'Гарнир',
        icon: '🍚',
        style: 'bg-green-100 text-green-800 border-green-200'
    },
    {
        id: 'snack',
        label: 'Перекус',
        icon: '🥪',
        style: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    {
        id: 'yummy',
        label: 'Вкусняшки',
        icon: '🍪',
        style: 'bg-pink-100 text-pink-800 border-pink-200'
    },
    {
        id: 'drink',
        label: 'Напитки',
        icon: '🥤',
        style: 'bg-teal-100 text-teal-800 border-teal-200'
    },
    {
        id: 'other',
        label: 'Другое',
        icon: '📦',
        style: 'bg-gray-100 text-gray-800 border-gray-200'
    }
];

export const getCategoryById = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES.find(c => c.id === 'other');
export const getCategoryLabel = (id) => getCategoryById(id).label;
export const getCategoryStyle = (id) => getCategoryById(id).style;
export const getCategoryIcon = (id) => getCategoryById(id).icon;
