/**
 * NPC 스케줄 데이터 (프론트 전용)
 * mock-backend/src/data/npcSchedule.js에서 이전
 * 
 * 구조: { npcId: { day: { period: roomId } } }
 * - day: 0(튜토리얼), 1~5(본편)
 * - period: 'morning' | 'afternoon' | 'evening' | 'night'
 * - null = 해당 시간에 등장 안 함
 */

const NPC_SCHEDULE = {
    npc_a: {
        default: {
            morning: 'unknown', afternoon: 'unknown', evening: 'unknown', night: 'unknown',
        },
    },
    bokeo: {
        default: {
            morning: 'room003', afternoon: 'b4_entrance', evening: 'b4_entrance', night: 'room003',
        },
        0: { morning: null, afternoon: null, evening: null, night: null },
    },
    bingeo: {
        default: {
            morning: 'hallway', afternoon: 'cafeteria', evening: 'room001', night: 'room001',
        },
        0: { morning: null, afternoon: null, evening: null, night: null },
        1: { morning: 'hallway', afternoon: 'cafeteria', evening: 'room001', night: 'room001' },
        2: { morning: 'cafeteria', afternoon: 'lounge', evening: 'room001', night: 'room001' },
        3: { morning: 'hallway', afternoon: 'b3_hall', evening: 'room001', night: 'room001' },
    },
    galchi: {
        default: {
            morning: 'kitchen', afternoon: 'hallway', evening: 'room005', night: 'room005',
        },
        0: { morning: null, afternoon: null, evening: null, night: null },
        1: { morning: 'kitchen', afternoon: 'hallway', evening: 'room005', night: 'room005' },
        2: { morning: 'lounge', afternoon: 'cafeteria', evening: 'room005', night: 'room005' },
    },
    mineeo: {
        default: {
            morning: 'room004', afternoon: 'laundry_room', evening: 'truth_room001', night: 'room004',
        },
        0: { morning: null, afternoon: null, evening: null, night: null },
        1: { morning: 'room004', afternoon: 'laundry_room', evening: 'truth_room001', night: 'room004' },
        2: { morning: 'terrace', afternoon: 'umi_class', evening: 'truth_room001', night: 'room004' },
    },
    gwangeo: {
        default: {
            morning: 'chapel', afternoon: 'real_leader_room', evening: 'solphi_room', night: 'real_leader_room',
        },
    },
    godeungeo: {
        default: {
            morning: 'truth_room001', afternoon: 'laundry_room', evening: 'b3_hall', night: 'room002',
        },
    },
    gubokchi: {
        default: { morning: null, afternoon: null, evening: null, night: null },
        0: { morning: null, afternoon: null, evening: null, night: null },
        1: { morning: 'cafeteria', afternoon: 'kitchen', evening: 'hallway', night: 'room004' },
        2: { morning: 'truth_room001', afternoon: 'kitchen', evening: 'laundry_room', night: 'room004' },
    },
    songsari: {
        default: {
            morning: 'b3_hall', afternoon: 'truth_room001', evening: 'hallway', night: 'room002',
        },
    },
    detective_kang: {
        default: { morning: null, afternoon: null, evening: null, night: null },
    },
};

export default NPC_SCHEDULE;
