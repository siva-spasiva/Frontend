/**
 * NPC 스케줄 컨트롤러 — 중앙 집중 관리
 * 
 * 구조: { npcId: { day: { period: roomId } } }
 * - day: 0(튜토리얼) ~ 7(최종일)
 * - period: 'morning' | 'afternoon' | 'evening'
 * - roomId: gameData.js FLOOR_DATA의 room.id와 매칭
 * 
 * 'default' 키: 특정 일차에 일정이 없으면 default 일정 사용
 * null: 해당 시간대에 맵에 등장하지 않음 (부재)
 */

const NPC_SCHEDULE = {
    // ─── 김태영 (npc_a): 우미교 열성 신도 ───
    npc_a: {
        default: {
            morning: 'umi_class',      // 원데이 클래스 (포교 활동)
            afternoon: 'chapel',       // 대예배당 (예배)
            evening: 'cafeteria',      // 중앙 식당 (식사)
        },
        0: { // 튜토리얼
            morning: null,
            afternoon: null,
            evening: 'hallway',        // 복도에서 배회
        },
        1: {
            morning: 'umi_class',
            afternoon: 'chapel',
            evening: 'cafeteria',
        },
        2: {
            morning: 'hallway',        // 복도에서 플레이어 방 앞 서성
            afternoon: 'chapel',
            evening: 'lounge',         // 휴게실
        },
    },

    // ─── 박복어 (bokeo): 수배 중인 살인마 ───
    bokeo: {
        default: {
            morning: 'room004',        // 004호 (자기 방에 은거)
            afternoon: 'room004',
            evening: 'room004',
        },
        0: { // 튜토리얼에는 등장 안 함
            morning: null,
            afternoon: null,
            evening: null,
        },
        1: {
            morning: 'room004',
            afternoon: 'room004',
            evening: 'hallway',        // 저녁에만 복도로 나옴
        },
        3: {
            morning: 'room004',
            afternoon: 'cafeteria',    // 3일차부터 식당에 나타남
            evening: 'room004',
        },
    },

    // ─── 기자 (reporter) ───
    reporter: {
        default: {
            morning: null,             // 기본적으로 등장 안 함
            afternoon: null,
            evening: null,
        },
        2: { // 2일차부터 등장
            morning: 'umi_class',
            afternoon: 'terrace',
            evening: null,
        },
        3: {
            morning: 'main_hall',
            afternoon: 'terrace',
            evening: 'lounge',
        },
    },

    // ─── 청갈치 (galchi): 사기꾼 — 여기저기 돌아다님 (005호 거주) ───
    galchi: {
        default: {
            morning: 'cafeteria',      // 중앙 식당 (정보 수집)
            afternoon: 'lounge',       // 휴게실 (사람들과 어울림)
            evening: 'room005',        // 005호 (자기 방)
        },
        0: { // 튜토리얼에는 등장 안 함
            morning: null,
            afternoon: null,
            evening: null,
        },
        1: {
            morning: 'cafeteria',
            afternoon: 'hallway',
            evening: 'room005',
        },
        2: {
            morning: 'lounge',
            afternoon: 'cafeteria',
            evening: 'room005',
        },
    },

    // ─── 곽빙어 (bingeo): 좁도둑/관찰자 — 003호 거주, 심부름으로 여기저기 ───
    bingeo: {
        default: {
            morning: 'hallway',        // 복도 (심부름/청소)
            afternoon: 'cafeteria',    // 식당 (관찰)
            evening: 'room003',        // 003호 (자기 방 — 기록 정리)
        },
        0: { // 튜토리얼에는 등장 안 함
            morning: null,
            afternoon: null,
            evening: null,
        },
        1: {
            morning: 'hallway',
            afternoon: 'cafeteria',
            evening: 'room003',
        },
        2: {
            morning: 'cafeteria',      // 2일차부터 아침 식당에서 목격
            afternoon: 'lounge',
            evening: 'room003',
        },
        3: {
            morning: 'hallway',
            afternoon: 'chapel',       // 3일차 대예배당 심부름
            evening: 'room003',
        },
    },

    // ─── 강 형사 (detective_kang): 전화 전용 (맵에 등장하지 않음) ───
    detective_kang: {
        default: {
            morning: null,
            afternoon: null,
            evening: null,
        },
    },
};


// ═══════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════

/**
 * 특정 NPC의 특정 시점 위치를 반환
 * @param {number} day - 현재 일차 (0~7)
 * @param {string} period - 'morning' | 'afternoon' | 'evening'
 * @param {string} npcId - NPC ID
 * @returns {string|null} roomId 또는 null(부재)
 */
export const getNpcLocation = (day, period, npcId) => {
    const schedule = NPC_SCHEDULE[npcId];
    if (!schedule) return null;

    // 해당 일차 스케줄이 있으면 사용, 없으면 default
    const daySchedule = schedule[day] ?? schedule.default;
    if (!daySchedule) return null;

    return daySchedule[period] ?? null;
};

/**
 * 특정 방에 있는 모든 NPC 목록을 반환
 * @param {number} day - 현재 일차
 * @param {string} period - 현재 시간대
 * @param {string} roomId - 방 ID
 * @returns {string[]} 해당 방에 있는 NPC ID 배열
 */
export const getNpcsInRoom = (day, period, roomId) => {
    const npcsInRoom = [];

    for (const npcId in NPC_SCHEDULE) {
        const location = getNpcLocation(day, period, npcId);
        if (location === roomId) {
            npcsInRoom.push(npcId);
        }
    }

    return npcsInRoom;
};

/**
 * 현재 시점의 전체 NPC 위치 맵을 반환
 * @param {number} day
 * @param {string} period
 * @returns {Object} { npcId: roomId|null, ... }
 */
export const getAllNpcLocations = (day, period) => {
    const locations = {};

    for (const npcId in NPC_SCHEDULE) {
        locations[npcId] = getNpcLocation(day, period, npcId);
    }

    return locations;
};

/**
 * 전체 스케줄 데이터를 반환 (프론트엔드 전달용)
 */
export const getScheduleData = () => NPC_SCHEDULE;

export default NPC_SCHEDULE;
