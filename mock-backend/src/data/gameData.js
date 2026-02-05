
// Import prompts
import * as PROMPTS from '../utils/prompts.js';
import { ITEM_DEFINITIONS } from './items.js';

const PORTRAIT_ROOT = '/src/assets/portrait/';
const MAP_ROOT = '/src/assets/map/';

// Raw Data (Filenames only)
const NPC_DATA = {
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
        prompt: PROMPTS.TEST03_NPC_PROMPT,
        apiConfig: {
            model: 'gpt-oss:20b-cloud',
        }
    },
    reporter: {
        id: 'reporter',
        name: '기자',
        initialPortrait: 'npc_reporter_00.png',
        portraits: {
            default: 'npc_reporter_00.png',
            talking: 'npc_reporter_01.png',
        },
        prompt: PROMPTS.REPORTER_PROMPT,
        apiConfig: {
            model: 'gpt-oss:20b-cloud',
        }
    },
    friend_a: {
        id: 'friend_a',
        name: 'Friend A',
        prompt: PROMPTS.FRIEND_A_PROMPT
    },
    test02: {
        id: 'test02',
        name: 'Test NPC 02',
        prompt: PROMPTS.TEST02_NPC_PROMPT
    }
};

const MAP_DATA = {
    test01: {
        id: 'test01',
        namePrefix: 'UNKNOWN MAP',
        highlightText: '01',
        highlightColor: 'text-yellow-500',
        description: '임시 공간. 뭔가 비릿한 냄새가 난다. 어둡고 습하다.',
        background: null,
        overlayColor: 'bg-black/40',
    },
    test02: {
        id: 'test02',
        namePrefix: 'TEST MAP',
        highlightText: '02',
        highlightColor: 'text-yellow-500',
        description: '어둡고 습한 지하실. 작은 침대와 나무상자, 그리고 낡은 베드테이블이 널브러져 있다.',
        background: 'testroom02.png',
        overlayColor: 'bg-black/40',
    },
    umi_class: {
        id: 'umi_class',
        namePrefix: '원데이 클래스',
        highlightText: '우미',
        highlightColor: 'text-blue-400',
        description: '바닷가가 보이는 아름다운 건물. 햇살이 비치는 창가와 깔끔한 인테리어가 돋보인다.',
        background: 'testintro02.png',
        overlayColor: 'bg-black/5',
    }
};

export const FLOOR_DATA = [
    {
        id: '1F',
        name: '1F: 지상 위장 시설',
        description: '우미 갤러리 & 카페',
        rooms: [
            { id: 'main_hall', name: '메인 홀', description: '카페 및 대기 공간' },
            { id: 'umi_class', name: '원데이 클래스 룸', description: '그림 및 꽃꽂이 강의실', linkedScene: 'umi_class' },
            { id: 'staff_room', name: '카운터 및 스태프 전용실', description: '지하 연결 승강기/계단 은닉' }
        ]
    },
    {
        id: 'B1',
        name: 'B1: 공용 구역',
        description: '규율의 식당',
        rooms: [
            { id: 'cafeteria', name: '중앙 식당', description: '신도 공용 식사 공간' },
            { id: 'kitchen', name: '조리실', description: '출입 제한 / B4 연결 식재료 리프트 존재' },
            { id: 'master_room', name: '교주의 방', description: 'CCTV 관제실 및 마스터키 보관' }
        ]
    },
    {
        id: 'B2',
        name: 'B2: 거주 구역',
        description: '생활관 (플레이어 시작점)',
        rooms: [
            { id: 'hallway', name: '복도', description: '감시 초소 포함' },
            { id: 'player_room', name: '플레이어의 방', description: '감금 및 튜토리얼 지점', linkedScene: 'test02' },
            { id: 'believer3_room', name: '신도 3의 방', description: '플레이어 옆방, 벽 너머 상호작용' },
            { id: 'believer_a_room', name: '기타 신도 방 A', description: '아이템 및 세계관 단서' },
            { id: 'believer_b_room', name: '기타 신도 방 B', description: '아이템 및 세계관 단서' },
            { id: 'bathroom', name: '공용 세면실', description: '세이브 포인트 및 하층 소음 청취' }
        ]
    },
    {
        id: 'B3',
        name: 'B3: 의식 구역',
        description: '기도 예배당',
        rooms: [
            { id: 'chapel', name: '대예배당', description: '중앙 성상 및 신도석' },
            { id: 'podium', name: '단상', description: '교주 연설대' },
            { id: 'secret_stairs', name: '비밀 계단', description: '단상 뒤편, B4로 연결되는 은폐 통로' }
        ]
    },
    {
        id: 'B4',
        name: 'B4: 최심부',
        description: '비밀 창고',
        rooms: [
            { id: 'archives', name: '기록보관실', description: '교단 기밀 문서고' },
            { id: 'cold_storage', name: '냉장보관소', description: '물고기가 된 신자들 보관 구역', linkedScene: 'test01' },
            { id: 'solpi_room', name: '솔피의 방', description: '해수면과 연결된 동굴 / 범고래 솔피 서식지' },
            { id: 'ocean_exit', name: '바다 출구', description: '최종 탈출구' }
        ]
    }
];

// Resolvers
const resolvePortraitPath = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http') || filename.startsWith('/')) return filename; // Already absolute/full
    return `${PORTRAIT_ROOT}${filename}`;
};

const resolveMapBackground = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('url(')) return filename; // Already formatted
    return `url(${MAP_ROOT}${filename})`;
};

// Data Getter with Resolution (Transforms filenames to full paths)
export const getGameData = () => {
    // Process NPC Data
    const resolvedNpcData = {};
    for (const key in NPC_DATA) {
        const npc = NPC_DATA[key];
        const portraits = {};

        if (npc.portraits) {
            for (const pKey in npc.portraits) {
                portraits[pKey] = resolvePortraitPath(npc.portraits[pKey]);
            }
        }

        resolvedNpcData[key] = {
            ...npc,
            initialPortrait: resolvePortraitPath(npc.initialPortrait),
            portraits: portraits
        };
    }

    // Process Map Data
    const resolvedMapData = {};
    for (const key in MAP_DATA) {
        const map = MAP_DATA[key];
        resolvedMapData[key] = {
            ...map,
            background: resolveMapBackground(map.background)
        };
    }

    return {
        npcData: resolvedNpcData,
        mapData: resolvedMapData,
        mapData: resolvedMapData,
        floorData: FLOOR_DATA,
        itemData: ITEM_DEFINITIONS
    };
};

// Export raw data for internal backend usage if needed (e.g., prompts)
export { NPC_DATA, MAP_DATA };
