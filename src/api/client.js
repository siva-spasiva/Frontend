/**
 * API 기본 설정 및 Fetch Wrapper
 */

const API_BASE_URL = 'http://localhost:3000';

/**
 * 기본 Fetch 함수 래퍼
 * @param {string} endpoint - API 엔드포인트 (예: '/api/stats')
 * @param {object} options - fetch 옵션
 * @returns {Promise<any>} - 파싱된 JSON 응답
 */
export const apiClient = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Request Failed: ${endpoint}`, error);
        throw error;
    }
};
