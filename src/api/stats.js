import { apiClient } from './client';

const withFallback = async (primary, fallback) => {
    try {
        return await primary();
    } catch (error) {
        if (!fallback) throw error;
        return fallback();
    }
};

export const fetchGameStats = async (userId = 'user_dev_session') => {
    return withFallback(
        () => apiClient('/api/v1/stats', { auth: true }),
        () => apiClient(`/api/stats?userId=${userId}`),
    );
};

export const updateGameStats = async (updates, npcId = null, userId = 'user_dev_session') => {
    return withFallback(
        () => apiClient('/api/v1/stats', {
            method: 'POST',
            auth: true,
            body: JSON.stringify({ updates }),
        }),
        () => {
            const body = { updates, userId };
            if (npcId) body.npcId = npcId;
            return apiClient('/api/stats', {
                method: 'POST',
                body: JSON.stringify(body),
            });
        },
    );
};

export const fetchStaticGameData = async () => {
    return apiClient('/api/data/static');
};

export const transferItem = async (npcId, itemId, direction = 'fromNpc', userId = 'user_dev_session') => {
    return apiClient('/api/stats/transfer-item', {
        method: 'POST',
        body: JSON.stringify({ npcId, itemId, direction, userId }),
    });
};

export const fetchTutorialStatus = async (userId = 'user_dev_session') => {
    return apiClient(`/api/tutorial/status?userId=${userId}`);
};

export const completeTutorialAPI = async (userId = 'user_dev_session') => {
    return apiClient('/api/tutorial/complete', {
        method: 'POST',
        body: JSON.stringify({ userId }),
    });
};

export const spendHpBackend = async (amount) => {
    return withFallback(
        () => apiClient('/api/v1/stats/hp/spend', {
            method: 'POST',
            auth: true,
            body: JSON.stringify({ hp: amount }),
        }),
        () => apiClient('/action/spendHp', {
            method: 'POST',
            body: JSON.stringify({ userId: 'default_user', amount }),
        }),
    );
};

export const restBackend = async () => {
    return apiClient('/action/rest', {
        method: 'POST',
        body: JSON.stringify({ userId: 'default_user' }),
    });
};

export const updateLocationStats = async (floorId, roomId) => {
    return updateGameStats({ floor_id: floorId, room_id: roomId });
};

