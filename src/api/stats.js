import { apiClient } from './client';

/**
 * 게임의 현재 모든 통계 정보를 가져옵니다.
 */
export const fetchGameStats = async (userId = 'user_dev_session') => {
    return apiClient(`/api/stats?userId=${userId}`);
};

/**
 * 플레이어 또는 특정 NPC의 스탯을 업데이트합니다.
 * @param {object} updates - 변경할 스탯 { key: value }
 * @param {string|null} npcId - NPC ID (선택 사항)
 * @param {string} userId - 사용자 ID (선택)
 */
export const updateGameStats = async (updates, npcId = null, userId = 'user_dev_session') => {
    const body = { updates, userId };
    if (npcId) {
        body.npcId = npcId;
    }
    return apiClient('/api/stats', {
        method: 'POST',
        body: JSON.stringify(body),
    });
};

/**
 * NPC 데이터, 맵 데이터 등 정적 데이터를 가져옵니다.
 */
export const fetchStaticGameData = async () => {
    return apiClient('/api/data/static');
};
