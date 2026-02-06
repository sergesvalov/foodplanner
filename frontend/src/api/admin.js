
// Authentication
export const verifyPassword = async (password) => {
    const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    if (!response.ok) throw new Error('Authentication failed');
    return response.json();
};

// Family Management
export const fetchFamily = async () => {
    const response = await fetch('/api/admin/family');
    if (!response.ok) throw new Error('Failed to fetch family members');
    return response.json();
};

export const saveFamilyMember = async (member) => {
    const url = member.id ? `/api/admin/family/${member.id}` : '/api/admin/family';
    const method = member.id ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
    });

    if (!response.ok) throw new Error('Failed to save family member');
    return response.json();
};

export const deleteFamilyMember = async (id) => {
    const response = await fetch(`/api/admin/family/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete family member');
    return response.json();
};

// Telegram Management
export const fetchTelegramConfig = async () => {
    const [tokenRes, usersRes] = await Promise.all([
        fetch('/api/admin/telegram/token'),
        fetch('/api/admin/telegram/users')
    ]);

    if (!tokenRes.ok || !usersRes.ok) throw new Error('Failed to fetch Telegram config');

    const tokenData = await tokenRes.json();
    const usersData = await usersRes.json();

    return { token: tokenData.token, users: usersData };
};

export const saveBotToken = async (token) => {
    const response = await fetch('/api/admin/telegram/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    if (!response.ok) throw new Error('Failed to save token');
    return response.json();
};

export const addTelegramUser = async (user) => {
    const response = await fetch('/api/admin/telegram/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });
    if (!response.ok) throw new Error('Failed to add Telegram user');
    return response.json();
};

export const deleteTelegramUser = async (id) => {
    const response = await fetch(`/api/admin/telegram/users/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete Telegram user');
    return response.json();
};

// Backups & Maintenance
export const triggerExport = async (endpoint, method = 'GET') => {
    const response = await fetch(endpoint, { method });
    if (!response.ok) throw new Error('Export failed');
    return response.json();
};

export const triggerImport = async (endpoint) => {
    const response = await fetch(endpoint, { method: 'POST' });
    if (!response.ok) throw new Error('Import failed');
    return response.json();
};
