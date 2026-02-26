import { apiClient } from './client';

/**
 * 대화 녹음 저장
 * POST /api/v1/records
 * @param {{ messages: object[], title?: string }} payload
 */
export const saveRecording = async ({ messages, title = null }) => {
    const body = { messages };
    if (title) body.title = title;

    return apiClient('/api/v1/records', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(body),
    });
};

/**
 * 녹음 목록 조회
 * GET /api/v1/records/list
 * @returns {Promise<Array<{ record_id: string, title?: string, created_at: string }>>}
 */
export const fetchRecordingList = async () => {
    return apiClient('/api/v1/records/list', {
        method: 'GET',
        auth: true,
    });
};

/**
 * 특정 녹음 상세 조회
 * GET /api/v1/records/{record_id}
 * @param {string} recordId
 * @returns {Promise<{ record_id: string, user_id: string, title?: string, messages: object[], created_at: string }>}
 */
export const fetchRecording = async (recordId) => {
    return apiClient(`/api/v1/records/${encodeURIComponent(recordId)}`, {
        method: 'GET',
        auth: true,
    });
};
