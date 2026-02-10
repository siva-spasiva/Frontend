import { sendChatMessage } from '../api/chat';

/**
 * Generates a response from the AI via Backend.
 * 
 * @param {string} userPrompt The user's input text.
 * @param {object} config Configuration (npcId, userId, presentedItem, etc.)
 * @returns {Promise<object>} The response object { response, thought, updatedStats, currentStats }.
 */
export const generateAIResponse = async (userPrompt, config = {}) => {
    const npcId = config.npcId || 'active_npc';
    const userId = config.userId || 'user_dev_session';
    const presentedItem = config.presentedItem || null;

    try {
        console.log("Sending request to Backend via API Adapter:", { userPrompt, npcId, presentedItem });

        const data = await sendChatMessage(userPrompt, npcId, userId, presentedItem);

        // data structure: { response, thought, updatedStats, currentStats }
        console.log("Received data from backend:", data);

        return data;

    } catch (error) {
        console.error("AI Service Failed:", error);
        return {
            response: "...(통신 오류)...",
            thought: "Network Error",
            updatedStats: {}
        };
    }
};

