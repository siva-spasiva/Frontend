/**
 * Fish Level Tier 유틸리티
 * 
 * Tier 구간:
 *   0~20  → Lv 0 (정상)
 *   21~40 → Lv 1 (미세 변이)
 *   41~60 → Lv 2 (중간 변이)
 *   61~80 → Lv 3 (심각 변이)
 *   81~99 → Lv 4 (거의 물고기)
 *   100   → Lv 5 / 만렙 (게임 오버)
 */

export const getFishTier = (fishLevel) => {
    if (fishLevel >= 100) return 5; // 만렙 (Game Over)
    if (fishLevel >= 81) return 4;
    if (fishLevel >= 61) return 3;
    if (fishLevel >= 41) return 2;
    if (fishLevel >= 21) return 1;
    return 0;
};

export const FISH_TIER_LABELS = [
    '정상',          // Lv 0
    '미세 변이',     // Lv 1
    '중간 변이',     // Lv 2
    '심각 변이',     // Lv 3
    '거의 물고기',   // Lv 4
    '완전한 물고기', // Lv 5 (Game Over)
];

/**
 * Tier 차이에 따른 마스킹 확률 반환
 * @param {number} npcTier - NPC의 Fish Tier
 * @param {number} playerTier - 플레이어의 Fish Tier
 * @returns {number} 0.0 ~ 0.9 확률
 */
export const getMaskingRate = (npcTier, playerTier) => {
    const diff = npcTier - playerTier;
    if (diff <= 0) return 0;     // 플레이어가 NPC 이상 → 다 알아들음
    const rates = [0, 0.2, 0.45, 0.7, 0.9];
    return rates[Math.min(diff, 4)];
};
