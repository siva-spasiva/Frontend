const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const ACCESS_TOKEN_KEY = 'sv_access_token';
const REFRESH_TOKEN_KEY = 'sv_refresh_token';
const SAVE_SLOTS_KEY = 'sv_save_slots';

let loginPromise = null;

const isBrowser = typeof window !== 'undefined';

// ===== 세이브 슬롯 관리 (localStorage) =====

export const getSaveSlots = () => {
    if (!isBrowser) return [];
    try {
        const raw = localStorage.getItem(SAVE_SLOTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const setSaveSlots = (slots) => {
    if (!isBrowser) return;
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
};

export const createSaveSlot = ({ accessToken, refreshToken }) => {
    const slots = getSaveSlots();
    const newSlot = {
        id: `slot_${Date.now()}`,
        accessToken,
        refreshToken,
        savedAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
    };
    slots.push(newSlot);
    setSaveSlots(slots);
    return newSlot;
};

export const deleteSaveSlot = (slotId) => {
    const slots = getSaveSlots().filter(s => s.id !== slotId);
    setSaveSlots(slots);
};

export const touchSaveSlot = (slotId) => {
    const slots = getSaveSlots();
    const idx = slots.findIndex(s => s.id === slotId);
    if (idx !== -1) {
        slots[idx].lastPlayedAt = new Date().toISOString();
        setSaveSlots(slots);
    }
};

export const activateSlot = (slot) => {
    if (!isBrowser) return;
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, slot.accessToken);
    window.sessionStorage.setItem(REFRESH_TOKEN_KEY, slot.refreshToken);
};

/**
 * 특정 슬롯의 stats를 해당 토큰으로 직접 fetch (현재 활성 세션에 영향 없음)
 * @param {object} slot
 * @returns {Promise<object|null>}
 */
export const fetchSlotStats = async (slot) => {
    const tryFetch = async (token) => {
        const res = await fetch(`${API_BASE_URL}/api/v1/stats`, {
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
        });
        return res;
    };

    try {
        let res = await tryFetch(slot.accessToken);

        if (res.status === 401 && slot.refreshToken) {
            // 액세스 토큰 만료 → 리프레시 시도
            const refreshRes = await fetch(`${API_BASE_URL}/api/v1/users/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify({ refresh_token: slot.refreshToken }),
            });

            if (!refreshRes.ok) return null;

            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData.access_token;
            const newRefreshToken = refreshData.refresh_token || slot.refreshToken;

            // 갱신된 토큰을 슬롯에 저장
            const slots = getSaveSlots();
            const idx = slots.findIndex(s => s.id === slot.id);
            if (idx !== -1) {
                slots[idx].accessToken = newAccessToken;
                slots[idx].refreshToken = newRefreshToken;
                setSaveSlots(slots);
            }

            res = await tryFetch(newAccessToken);
        }

        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
};

/**
 * 새 게임용 로그인 — 토큰 자동 저장 없이 반환
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
export const loginNewSave = async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
        },
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
    };
};

export const getAccessToken = () => {
    if (!isBrowser) return null;
    return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = () => {
    if (!isBrowser) return null;
    return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = ({ accessToken, refreshToken }) => {
    if (!isBrowser) return;
    if (accessToken) {
        window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
        window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
};

export const clearTokens = () => {
    if (!isBrowser) return;
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const login = async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
        },
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
    });
    return data.access_token;
};

export const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new Error('No refresh token');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/users/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
    }

    const data = await response.json();
    setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
    });
    return data.access_token;
};

export const ensureAccessToken = async () => {
    const current = getAccessToken();
    if (current) return current;

    if (!loginPromise) {
        loginPromise = login().finally(() => {
            loginPromise = null;
        });
    }

    return loginPromise;
};

