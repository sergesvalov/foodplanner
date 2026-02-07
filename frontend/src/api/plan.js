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

export const clearPlan = async (startDate, endDate) => {
    let url = '/api/plan/';
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to clear plan');
    }
    return response.json();
};

export const autofillWeek = async () => {
    const response = await fetch('/api/plan/autofill_week', {
        method: 'POST',
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to autofill week');
    }
    return response.json();
};

export const autofillOne = async (data = {}) => {
    const response = await fetch('/api/plan/autofill_one', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to autofill one slot');
    }
    return response.json();
};

export const importPlan = async () => {
    const response = await fetch('/api/plan/import', {
        method: 'POST',
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to import plan');
    }
    return response.json();
};

export const exportPlan = async () => {
    const response = await fetch('/api/plan/export');
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to export plan');
    }
    return response.json();
};
