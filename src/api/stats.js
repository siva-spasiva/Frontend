import { apiClient } from './client';

export const fetchGameStats = async () => {
    return apiClient('/api/v1/stats', { auth: true });
};

export const fetchStaticStats = async () => {
    return apiClient('/api/v1/stats/static', { auth: true });
};

export const spendHpAPI = async (amount) => {
    return apiClient('/api/v1/stats/hp/spend', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ hp: amount }),
    });
};

export const updateStats = async (updates) => {
    return apiClient('/api/v1/stats', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ updates }),
    });
};

export const updateGameStats = updateStats;

export const transferItem = async (npcId, itemId, direction = 'fromNpc') => {
    return apiClient('/api/v1/stats/transfer-item', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ npcId, itemId, direction }),
    });
};

export const fetchTutorialStatus = async () => {
    return apiClient('/api/v1/tutorial/status', { auth: true });
};

export const completeTutorialAPI = async () => {
    return apiClient('/api/v1/tutorial/complete', {
        method: 'POST',
        auth: true,
    });
};

export const spendHpBackend = spendHpAPI;

export const restBackend = async () => {
    return apiClient('/api/v1/action/rest', {
        method: 'POST',
        auth: true,
    });
};

export const updateLocationStats = async (floorId, roomId) => {
    return updateStats({ floor_id: floorId, room_id: roomId });
};
