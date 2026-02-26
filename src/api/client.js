import { ensureAccessToken, refreshAccessToken } from './auth';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

/**
 * Generic API client.
 * @param {string} endpoint
 * @param {object} options
 * @param {boolean} options.auth - add bearer token automatically
 * @param {boolean} options.retryOnAuthError - retry once on 401 using refresh token
 * @returns {Promise<any>}
 */
export const apiClient = async (endpoint, options = {}) => {
    const {
        auth = false,
        retryOnAuthError = true,
        silent = false,
        ...fetchOptions
    } = options;

    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    };

    let authHeaders = {};
    if (auth) {
        try {
            const accessToken = await ensureAccessToken();
            if (accessToken) {
                authHeaders = { Authorization: `Bearer ${accessToken}` };
            }
        } catch (error) {
            console.error('Failed to get access token:', error);
        }
    }

    const baseConfig = {
        ...fetchOptions,
        headers: {
            ...defaultHeaders,
            ...authHeaders,
            ...(fetchOptions.headers || {}),
        },
    };

    try {
        let response = await fetch(url, baseConfig);

        if (auth && response.status === 401 && retryOnAuthError) {
            try {
                const refreshed = await refreshAccessToken();
                response = await fetch(url, {
                    ...baseConfig,
                    headers: {
                        ...baseConfig.headers,
                        Authorization: `Bearer ${refreshed}`,
                    },
                });
            } catch (refreshError) {
                console.error('Failed to refresh token:', refreshError);
            }
        }

        if (!response.ok) {
            let detail = '';
            try {
                const errorBody = await response.json();
                detail = errorBody?.detail || JSON.stringify(errorBody);
                console.error(`API ${response.status} body:`, errorBody);
            } catch { /* non-JSON error body */ }
            throw new Error(`API Error: ${response.status} ${response.statusText}${detail ? ' — ' + detail : ''}`);
        }

        return await response.json();
    } catch (error) {
        if (!silent) {
            console.error(`API Request Failed: ${endpoint}`, error);
        }
        throw error;
    }
};

