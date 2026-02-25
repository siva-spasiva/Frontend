/**
 * NPC 데이터 (프론트 전용)
 * mock-backend/src/data/gameData.js에서 추출
 * prompts/apiConfig 제거, 포트레이트와 기본 정보만 보존
 */

const PORTRAIT_ROOT = '/src/assets/portrait/';

const resolvePortraitPath = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http') || filename.startsWith('/')) return filename;
    return `${PORTRAIT_ROOT}${filename}`;
};

const NPC_DATA_RAW = {
    npc_a: {
        id: 'npc_a',
        name: '김태영',
        initialPortrait: 'npc_A_00.png',
        portraits: {
            default: 'npc_A_00.png',
            smile: 'npc_A_01.png',
            angry: 'npc_A_02.png',
            surprised: 'npc_A_03.png',
        },
    },
    detective_kang: {
        id: 'detective_kang',
        name: '강 형사',
    },
    bokeo: {
        id: 'bokeo',
        name: '박복어',
        initialPortrait: 'npc_bokeo_00.png',
        portraits: {
            default: 'npc_bokeo_00.png',
            alt: 'npc_bokeo_01.png',
        },
    },
    galchi: {
        id: 'galchi',
        name: '청갈치',
        initialPortrait: 'npc_galchi_00.png',
        portraits: {
            default: 'npc_galchi_00.png',
            alt: 'npc_galchi_01.png',
        },
    },
    bingeo: {
        id: 'bingeo',
        name: '곽빙어',
        initialPortrait: 'npc_bingeo_00.png',
        portraits: {
            default: 'npc_bingeo_00.png',
            alt: 'npc_bingeo_01.png',
        },
    },
    mineeo: {
        id: 'mineeo',
        name: '이민어',
        initialPortrait: 'npc_mineeo_00.png',
        portraits: {
            default: 'npc_mineeo_00.png',
            alt: 'npc_mineeo_01.png',
        },
    },
    gwangeo: {
        id: 'gwangeo',
        name: '전광어',
        initialPortrait: 'npc_gwangeo_00.png',
        portraits: {
            default: 'npc_gwangeo_00.png',
            alt: 'npc_gwangeo_01.png',
        },
    },
    godeungeo: {
        id: 'godeungeo',
        name: '고등어',
        isHardcoded: true,
        dialogues: ['1', '2', '3'],
        initialPortrait: 'npc_godeungeo_00.png',
        portraits: { default: 'npc_godeungeo_00.png', alt: 'npc_godeungeo_01.png' },
    },
    gubokchi: {
        id: 'gubokchi',
        name: '구복치',
        isHardcoded: true,
        dialogues: ['1', '2', '3'],
        initialPortrait: 'npc_gubokchi_00.png',
        portraits: { default: 'npc_gubokchi_00.png', alt: 'npc_gubokchi_01.png' },
    },
    songsari: {
        id: 'songsari',
        name: '송사리',
        isHardcoded: true,
        dialogues: ['1', '2', '3'],
        initialPortrait: 'npc_songsari_00.png',
        portraits: { default: 'npc_songsari_00.png', alt: 'npc_songsari_01.png' },
    },
};

// 포트레이트 경로 resolve 적용
const NPC_DATA = {};
for (const key in NPC_DATA_RAW) {
    const npc = NPC_DATA_RAW[key];
    const portraits = {};
    if (npc.portraits) {
        for (const pKey in npc.portraits) {
            portraits[pKey] = resolvePortraitPath(npc.portraits[pKey]);
        }
    }
    NPC_DATA[key] = {
        ...npc,
        initialPortrait: resolvePortraitPath(npc.initialPortrait),
        portraits,
    };
}

export default NPC_DATA;
