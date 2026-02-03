const BACKEND_URL = 'http://localhost:3000/api/chat';

/**
 * Generates a response from the AI via Backend.
 * 
 * @param {string} userPrompt The user's input text.
 * @param {object} config Configuration (npcId, userId, etc.)
 * @returns {Promise<object>} The response object { response, thought, updatedStats, currentStats }.
 */
export const generateAIResponse = async (userPrompt, config = {}) => {

    const payload = {
        message: userPrompt,
        npcId: config.npcId || 'active_npc', // Default if missing
        userId: 'user_dev_session' // In real app, persist this
    };

    try {
        console.log("Sending request to Backend:", BACKEND_URL, payload);

        const res = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`Backend Error: ${res.status}`);
        }

        const data = await res.json();
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

