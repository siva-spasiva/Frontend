import { apiClient } from './client';

const SESSION_INDEX_TO_PERIOD = {
    1: 'morning',
    2: 'afternoon',
    3: 'evening',
    4: 'night',
};

const normalizeGlobalStats = (payload = {}) => {
    const data = payload?.global ?? payload ?? {};
    const sessionIndex = data.current_session_index ?? data.currentSessionIndex;

    return {
        fishLevel: data.fishLevel ?? data.fish_level ?? 0,
        hp: data.total_hp ?? data.hp ?? 100,
        sessionHp: data.session_hp ?? data.sessionHp ?? 30,
        plusHp: data.plus_hp ?? data.plusHp ?? 0,
        currentPeriod: data.current_session ?? data.currentPeriod ?? SESSION_INDEX_TO_PERIOD[sessionIndex] ?? 'morning',
        currentDay: data.current_day ?? data.currentDay ?? 0,
        floorId: data.floor_id ?? data.floorId ?? null,
        roomId: data.room_id ?? data.roomId ?? null,
    };
};

const normalizeActionResponse = (payload = {}, fallbackTransition = null) => {
    if (payload?.global) {
        return {
            ...payload,
            global: normalizeGlobalStats(payload.global),
        };
    }

    return {
        global: normalizeGlobalStats(payload),
        transitionEvent: payload?.transitionEvent ?? fallbackTransition,
    };
};

export const fetchGameStats = async () => {
    return apiClient('/api/v1/stats', { auth: true });
};

export const fetchStaticStats = async () => {
    return apiClient('/api/v1/stats/static', { auth: true });
};

export const spendHpAPI = async (amount) => {
    const response = await apiClient('/api/v1/stats/hp/spend', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ hp: amount }),
    });

    return normalizeActionResponse(response);
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



export const spendHpBackend = spendHpAPI;

export const resetItemsAPI = async () => {
    return apiClient('/api/v1/debug/reset_items', {
        method: 'POST',
        auth: true,
    });
};

export const restBackend = async () => {
    try {
        const response = await apiClient('/api/v1/action/rest', {
            method: 'POST',
            auth: true,
        });
        return normalizeActionResponse(response);
    } catch (error) {
        const message = String(error?.message || '');
        const isMissingRoute = message.includes('404');
        if (!isMissingRoute) throw error;

        const before = await fetchGameStats();
        const dayIndex = before.current_day ?? before.currentDay ?? 0;
        const sessionIndex = before.current_session_index ?? before.currentSessionIndex ?? 1;

        const endSessionResult = await apiClient('/api/v1/end-session', {
            method: 'POST',
            auth: true,
            body: JSON.stringify({
                day_index: dayIndex,
                session_index: sessionIndex,
            }),
        });

        const after = await fetchGameStats();
        const advance = endSessionResult?.advance;
        const transitionEvent = advance
            ? {
                next: advance.current_session
                    ?? SESSION_INDEX_TO_PERIOD[advance.current_session_index]
                    ?? null,
                message: advance.message ?? endSessionResult?.message ?? null,
            }
            : null;

        return {
            global: normalizeGlobalStats(after),
            transitionEvent,
        };
    }
};

export const updateLocationStats = async (floorId, roomId) => {
    return updateStats({ floor_id: floorId, room_id: roomId });
};
