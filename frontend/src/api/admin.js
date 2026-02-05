export const fetchFamily = async () => {
    const response = await fetch('/api/admin/family');
    if (!response.ok) {
        throw new Error('Failed to fetch family members');
    }
    return response.json();
};
