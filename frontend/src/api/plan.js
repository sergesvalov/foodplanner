export const fetchPlan = async (startDate, endDate) => {
    let url = '/api/plan/';
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch plan');
    }
    return response.json();
};

export const savePlan = async (items) => {
    const response = await fetch('/api/plan/batch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(items),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to save plan');
    }
    return response.json();
};
