export const fetchPlan = async () => {
    const response = await fetch('/api/plan/');
    if (!response.ok) {
        throw new Error('Failed to fetch plan');
    }
    return response.json();
};
