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
