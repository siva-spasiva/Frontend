import { apiClient } from './client';

export const sendChatMessage = async (message, npcId, itemId = null) => {
    const body = { message, npcId };
    if (itemId) body.item_id = itemId;

    return apiClient('/api/v1/chat', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(body),
    });
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

export const eavesdropRoom = async (floorId, roomId) => {
    return apiClient(`/api/v1/map/${floorId}/room/${roomId}/eavesdrop`, {
        method: 'POST',
        auth: true,
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

export const endSession = async ({ dayIndex, sessionIndex, npcId = null }) => {
    return apiClient('/api/v1/end-session', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
            day_index: dayIndex,
            session_index: sessionIndex,
            npc_id: npcId,
        }),
    });
};
