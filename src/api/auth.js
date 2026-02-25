const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const ACCESS_TOKEN_KEY = 'sv_access_token';
const REFRESH_TOKEN_KEY = 'sv_refresh_token';

let loginPromise = null;

const isBrowser = typeof window !== 'undefined';

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

