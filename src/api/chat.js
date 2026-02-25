import { apiClient } from './client';

const withFallback = async (primary, fallback) => {
    try {
        return await primary();
    } catch (error) {
        if (!fallback) throw error;
        return fallback();
    }
};

/**
 * Backward-compatible signature:
 * sendChatMessage(message, npcId, userId, presentedItem)
 */
export const sendChatMessage = async (
    message,
    npcId = 'npc_a',
    userId = 'user_dev_session',
    presentedItem = null,
) => {
    const itemId = presentedItem?.itemId || presentedItem?.id || null;

    return withFallback(
        () => apiClient('/api/v1/chat', {
            method: 'POST',
            auth: true,
            body: JSON.stringify({ message, npcId, item_id: itemId }),
        }),
        () => apiClient('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ message, npcId, userId, presentedItem }),
        }),
    );
};

export const startConversation = async ({
    npcIds,
    topic = null,
    numTurns = 4,
    dayIndex = null,
    session = null,
} = {}) => {
    const body = {
        topic,
        npc_ids: npcIds,
        num_turns: numTurns,
        day_index: dayIndex,
        session,
    };

    return apiClient('/api/v1/conversation/start', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(body),
    });
};

export const replyConversation = async ({
    topic,
    npcIds,
    userMessage,
    history = null,
} = {}) => {
    return apiClient('/api/v1/conversation/reply', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
            topic,
            npc_ids: npcIds,
            user_message: userMessage,
            history,
        }),
    });
};

export const eavesdropMore = async ({ dayIndex, sessionIndex, roomId }) => {
    return apiClient('/api/v1/eavesdrop', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
            day_index: dayIndex,
            session_index: sessionIndex,
            room_id: roomId,
        }),
    });
};

