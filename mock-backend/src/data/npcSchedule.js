/**
 * NPC 스케줄 컨트롤러 — 중앙 집중 관리
 * 
 * 구조: { npcId: { day: { period: roomId } } }
 * - day: 0(튜토리얼), 1~5(본편, 5일차가 최종일)
 * - period: 'morning' | 'afternoon' | 'evening' | 'night'
 * - roomId: gameData.js FLOOR_DATA의 room.id와 매칭
 * 
 * 'default' 키: 특정 일차에 일정이 없으면 default 일정 사용
 * null: 해당 시간대에 맵에 등장하지 않음 (부재)
 */

const NPC_SCHEDULE = {
    // ─── 김태영 (npc_a): 우미교 열성 신도 -> 게임 내 배제됨 (더미 방) ───
    npc_a: {
        default: {
            morning: 'unknown',
            afternoon: 'unknown',
            evening: 'unknown',
            night: 'unknown',
        },
    },

    // ─── 박복어 (bokeo): 수배 중인 살인마 -> 003호 거주 및 B4 입구 보초 ───
    bokeo: {
        default: {
            morning: 'room003',
            afternoon: 'b4_entrance', // B4 입구 보초
            evening: 'b4_entrance',
            night: 'room003',
        },
        0: { // 튜토리얼 (등장 X)
            morning: null, afternoon: null, evening: null, night: null,
        },
    },

    // ─── 곽빙어 (bingeo): 플레이어 관찰자 -> 001호 거주 ───
    bingeo: {
        default: {
            morning: 'hallway',
            afternoon: 'cafeteria',
            evening: 'room001',
            night: 'room001',
        },
        0: { // 튜토리얼
            morning: null, afternoon: null, evening: null, night: null,
        },
        1: {
            morning: 'hallway',
            afternoon: 'cafeteria',
            evening: 'room001',
            night: 'room001',
        },
        2: {
            morning: 'cafeteria',
            afternoon: 'lounge', // (식당이나 복도가 붐비지 않게 휴게소 배정)
            evening: 'room001',
            night: 'room001',
        },
        3: {
            morning: 'hallway',
            afternoon: 'b3_hall', // 3일차 심부름
            evening: 'room001',
            night: 'room001',
        },
    },

    // ─── 청갈치 (galchi): 사기꾼 -> 005호 거주 ───
    galchi: {
        default: {
            morning: 'kitchen',
            afternoon: 'hallway',
            evening: 'room005',
            night: 'room005',
        },
        0: { // 튜토리얼
            morning: null, afternoon: null, evening: null, night: null,
        },
        1: {
            morning: 'kitchen',
            afternoon: 'hallway',
            evening: 'room005',
            night: 'room005',
        },
        2: {
            morning: 'lounge',
            afternoon: 'cafeteria', // 빙어와 같이 식당 배정(2인 제한 준수)
            evening: 'room005',
            night: 'room005',
        },
    },

    // ─── 이민어 (mineo): 잠입 기자 -> 004호 거주 ───
    mineo: {
        default: {
            morning: 'room004',
            afternoon: 'laundry_room',
            evening: 'truth_room001', // 단서 탐색
            night: 'room004',
        },
        0: { // 튜토리얼
            morning: null, afternoon: null, evening: null, night: null,
        },
        1: {
            morning: 'room004',
            afternoon: 'laundry_room',
            evening: 'truth_room001',
            night: 'room004',
        },
        2: { // 가끔 1,2층으로 올라와서 조사
            morning: 'terrace',
            afternoon: 'umi_class',
            evening: 'truth_room001',
            night: 'room004',
        }
    },

    // ─── 전광어 (gwangeo): 진정한 흑막 -> 주 서식지 B4, B5, 교제당 ───
    gwangeo: {
        default: {
            morning: 'chapel',
            afternoon: 'real_leader_room',
            evening: 'solphi_room',
            night: 'real_leader_room', // 전광어는 night에도 지하에 머무름
        },
    },

    // ─── 고등어 (godeungeo): 맹신도 -> 002호 거주 ───
    godeungeo: {
        default: {
            morning: 'truth_room001',
            afternoon: 'laundry_room',
            evening: 'b3_hall',
            night: 'room002',
        },
    },

    // ─── 구복치 (gubokchi): 평범한 신도 -> 004호 거주 (3일차부터 실종) ───
    gubokchi: {
        default: { // 기본적으로는 실종됨 (2일차 초과 시 default 사용되므로 전부 null)
            morning: null,
            afternoon: null,
            evening: null,
            night: null,
        },
        0: {
            morning: null, afternoon: null, evening: null, night: null,
        },
        1: {
            morning: 'cafeteria', // 아침부터 식사
            afternoon: 'kitchen',
            evening: 'hallway',
            night: 'room004',
        },
        2: {
            morning: 'truth_room001', // 고등어와 나란히 학습
            afternoon: 'kitchen',
            evening: 'laundry_room',
            night: 'room004', // 2일차 밤(night)까지 있다가 다음날 아침부터 증발
        }
    },

    // ─── 송사리 (songsari): 겁먹은 신도 -> 002호 거주 ───
    songsari: {
        default: {
            morning: 'b3_hall',
            afternoon: 'truth_room001',
            evening: 'hallway',
            night: 'room002',
        },
    },

    // ─── 강 형사 (detective_kang): 통신 전용 (맵에 등장하지 않음) ───
    detective_kang: {
        default: {
            morning: null, afternoon: null, evening: null, night: null,
        },
    },
};


// ═══════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════

/**
 * 특정 NPC의 특정 시점 위치를 반환
 * @param {number} day - 현재 일차 (0=튜토리얼, 1~5=본편)
 * @param {string} period - 'morning' | 'afternoon' | 'evening' | 'night'
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
