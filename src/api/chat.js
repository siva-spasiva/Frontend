import { apiClient } from './client';

/**
 * NPC에게 메시지를 보내고 AI 응답을 받습니다.
 * @param {string} message - 사용자 메시지
 * @param {string} npcId - 대상 NPC ID
 * @param {string} userId - 사용자 ID (선택)
 */
export const sendChatMessage = async (message, npcId, userId = 'user_dev_session') => {
    return apiClient('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
            message,
            npcId,
            userId
        }),
    });
};
