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

        // v1 response may include hp object instead of updatedStats.
        if (data?.hp && !data?.updatedStats) {
            const mappedStats = {
                hp: data.hp.total_hp,
                sessionHp: data.hp.session_hp,
                plusHp: data.hp.plus_hp,
                currentDay: data.hp.current_day,
                currentPeriod: data.hp.current_session,
            };
            if (data.hp.floor_id !== undefined) mappedStats.floor_id = data.hp.floor_id;
            if (data.hp.room_id !== undefined) mappedStats.room_id = data.hp.room_id;

            return {
                ...data,
                updatedStats: mappedStats,
            };
        }

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

