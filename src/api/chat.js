import { apiClient } from './client';

/**
 * @param {string} message - The user's chat message
 * @param {string} npcId - Target NPC ID
 * @param {string} userId - User session ID
 * @param {object|null} presentedItem - Item being presented to NPC
 *   { itemId, name, icon, description, type, transcriptSummary?, transcriptContent? }
 */
export const sendChatMessage = async (message, npcId = 'npc_a', userId = 'user_dev_session', presentedItem = null) => {
    return apiClient('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message, npcId, userId, presentedItem }),
    });
};
