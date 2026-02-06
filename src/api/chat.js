import { apiClient } from './client';

export const sendChatMessage = async (message, npcId = 'npc_a', userId = 'user_dev_session') => {
    return apiClient('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message, npcId, userId }),
    });
};
