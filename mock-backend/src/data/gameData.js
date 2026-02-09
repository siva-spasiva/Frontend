
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
    detective_kang: {
        id: 'detective_kang',
        name: '강 형사',
        prompt: PROMPTS.DETECTIVE_KANG_PROMPT
    },
    test02: {
        id: 'test02',
        name: 'Test NPC 02',
        prompt: PROMPTS.TEST02_NPC_PROMPT
    }
};

const MAP_DATA = {
    // [NOTE] MAP_DATA is for the HUD/Scene display (Concise).
    // FLOOR_DATA is for the Map App (Detailed).

    test01: {
        id: 'test01',
        namePrefix: 'UNKNOWN MAP',
        highlightText: '01',
        highlightColor: 'text-yellow-500',
        description: '정체불명의 공간. 비릿한 냄새가 난다.',
        background: null,
        overlayColor: 'bg-black/40',
    },
    test02: {
        id: 'test02',
        namePrefix: 'TEST MAP',
        highlightText: '02',
        highlightColor: 'text-yellow-500',
        description: '304호. 어둡고 습한 나의 방.',
        background: 'testroom02.png',
        overlayColor: 'bg-black/40',
        activeZones: [
            {
                id: 'zone_bed',
                type: 'info',
                x: '10%',
                y: '50%',
                width: '30%',
                height: '20%',
                label: '낡은 침대',
                message: '딱딱하고 차가운 침대다.'
            },
            {
                id: 'zone_table',
                type: 'info',
                x: '50%',
                y: '45%',
                width: '20%',
                height: '15%',
                label: '베드 테이블',
                message: '먼지가 쌓인 테이블.'
            },
            {
                id: 'zone_box',
                type: 'item',
                x: '75%',
                y: '60%',
                width: '15%',
                height: '20%',
                label: '나무 상자',
                message: '잠겨있다.'
            },
            {
                id: 'zone_door',
                type: 'move',
                target: 'hallway',
                x: '40%',
                y: '20%',
                width: '20%',
                height: '25%',
                label: '철제 문',
                message: '굳게 닫겨있다.'
            }
        ]
    },
    umi_class: {
        id: 'umi_class',
        namePrefix: '원데이 클래스',
        highlightText: '우미',
        highlightColor: 'text-blue-400',
        description: '바닷가가 보이는 평화로운 강의실.',
        background: 'testintro02.png',
        overlayColor: 'bg-black/5',
    },
    // 2F
    storage_main: {
        id: 'storage_main',
        namePrefix: '2F 자재 창고',
        highlightText: 'MAIN',
        highlightColor: 'text-gray-400',
        description: '먼지 쌓인 미술 도구와 비품들이 방치된 곳.',
        overlayColor: 'bg-black/60',
    },
    terrace_locked: {
        id: 'terrace_locked',
        namePrefix: '2F 테라스',
        highlightText: 'LOCKED',
        highlightColor: 'text-red-500',
        description: '판자로 막힌 테라스 입구. 바람 소리가 들린다.',
        overlayColor: 'bg-black/40',
    },
    // 1F
    main_hall: {
        id: 'main_hall',
        namePrefix: '1F 메인 홀',
        highlightText: 'CAFE',
        highlightColor: 'text-blue-300',
        description: '햇살이 비치는 관광객용 카페. 조용하다.',
        overlayColor: 'bg-black/5',
    },
    staff_door: {
        id: 'staff_door',
        namePrefix: '1F 비밀 통로',
        highlightText: 'STAFF',
        highlightColor: 'text-gray-500',
        description: '서늘한 냉기가 새어나오는 스태프 룸.',
        overlayColor: 'bg-black/20',
    },
    // B1
    cafeteria: {
        id: 'cafeteria',
        namePrefix: 'B1 중앙 식당',
        highlightText: 'DINING',
        highlightColor: 'text-orange-300',
        description: '신도들이 식사하는 넓은 공간.',
        overlayColor: 'bg-black/20',
    },
    // B2
    hallway: {
        id: 'hallway',
        namePrefix: 'B2 복도',
        highlightText: 'HALL',
        highlightColor: 'text-gray-600',
        description: '차가운 공기가 감도는 신도 숙소 복도.',
        overlayColor: 'bg-black/50',
    },
    // B4
    ocean_gate: {
        id: 'ocean_gate',
        namePrefix: 'B4 배수구',
        highlightText: 'EXIT',
        highlightColor: 'text-blue-800',
        description: '바다로 연결되는 거대한 배수구.',
        overlayColor: 'bg-blue-900/40',
    }
};

// [LEGACY] Old Floor Data (Reference)
// export const FLOOR_DATA = [
//     {
//         id: '1F',
//         name: '1F: 지상 위장 시설',
//         description: '우미 갤러리 & 카페',
//         rooms: [
//             { id: 'main_hall', name: '메인 홀', description: '카페 및 대기 공간' },
//             { id: 'umi_class', name: '원데이 클래스 룸', description: '그림 및 꽃꽂이 강의실', linkedScene: 'umi_class' },
//             { id: 'staff_room', name: '카운터 및 스태프 전용실', description: '지하 연결 승강기/계단 은닉' }
//         ]
//     },
//     {
//         id: 'B1',
//         name: 'B1: 공용 구역',
//         description: '규율의 식당',
//         rooms: [
//             { id: 'cafeteria', name: '중앙 식당', description: '신도 공용 식사 공간' },
//             { id: 'kitchen', name: '조리실', description: '출입 제한 / B4 연결 식재료 리프트 존재' },
//             { id: 'master_room', name: '교주의 방', description: 'CCTV 관제실 및 마스터키 보관' }
//         ]
//     },
//     {
//         id: 'B2',
//         name: 'B2: 거주 구역',
//         description: '생활관 (플레이어 시작점)',
//         rooms: [
//             { id: 'hallway', name: '복도', description: '감시 초소 포함' },
//             { id: 'player_room', name: '플레이어의 방', description: '감금 및 튜토리얼 지점', linkedScene: 'test02' },
//             { id: 'believer3_room', name: '신도 3의 방', description: '플레이어 옆방, 벽 너머 상호작용' },
//             { id: 'believer_a_room', name: '기타 신도 방 A', description: '아이템 및 세계관 단서' },
//             { id: 'believer_b_room', name: '기타 신도 방 B', description: '아이템 및 세계관 단서' },
//             { id: 'bathroom', name: '공용 세면실', description: '세이브 포인트 및 하층 소음 청취' }
//         ]
//     },
//     {
//         id: 'B3',
//         name: 'B3: 의식 구역',
//         description: '기도 예배당',
//         rooms: [
//             { id: 'chapel', name: '대예배당', description: '중앙 성상 및 신도석' },
//             { id: 'podium', name: '단상', description: '교주 연설대' },
//             { id: 'secret_stairs', name: '비밀 계단', description: '단상 뒤편, B4로 연결되는 은폐 통로' }
//         ]
//     },
//     {
//         id: 'B4',
//         name: 'B4: 최심부',
//         description: '비밀 창고',
//         rooms: [
//             { id: 'archives', name: '기록보관실', description: '교단 기밀 문서고' },
//             { id: 'cold_storage', name: '냉장보관소', description: '물고기가 된 신자들 보관 구역', linkedScene: 'test01' },
//             { id: 'solpi_room', name: '솔피의 방', description: '해수면과 연결된 동굴 / 범고래 솔피 서식지' },
//             { id: 'ocean_exit', name: '바다 출구', description: '최종 탈출구' }
//         ]
//     }
// ];

export const FLOOR_DATA = [
    // ----------------------------------------------------------------
    // 2F: 창고 (The Attic)
    // 기믹: 1층의 아름다움을 유지하기 위한 잡동사니들이 방치된 곳.
    //       먼지 쌓인 그림들 속에서 기괴한 초기 컨셉(복선)을 발견할 수 있음.
    // ----------------------------------------------------------------
    {
        id: '2F',
        name: '2F: 자재 창고',
        description: '쓰지 않는 미술 도구와 카페 비품들이 쌓여있다. 1층의 활기찬 소리가 먹먹하게 들려온다.',
        rooms: [
            {
                id: 'storage_main',
                name: '메인 창고',
                description: '오래된 캔버스들이 천으로 덮여있다.',
            },
            {
                id: 'terrace_locked',
                name: '폐쇄된 테라스',
                description: '바다 쪽으로 난 문이지만 판자로 못질되어 있다. 틈새로 들어오는 바닷바람이 윙윙거리는 소리를 낸다.',
            }
        ]
    },

    // ----------------------------------------------------------------
    // 1F: 지상 (The Paradise)
    // 기믹: Fishlevel 0 상태의 완벽한 평화. 공포 요소가 전혀 없는 '힐링' 공간.
    //       플레이어가 "여기가 정말 사이비 종교 맞아?"라고 의심하게 만들어야 함.
    // ----------------------------------------------------------------
    {
        id: '1F',
        name: '우미 갤러리 & 카페',
        description: '아름다운 해안 절벽 위에 세워진 목조 건물.',
        background: 'testintro01.png', // 우미 카페 외부 전경 이미지 사용
        rooms: [
            {
                id: 'main_hall',
                name: '메인 홀',
                description: '잔잔한 재즈 음악이 흐르는, 바닷가가 보이는 깔끔한 인테리어와 곳곳에 놓인 싱그러운 화분들이 돋보인다.',
                background: '01.png',
            },
            {
                id: 'umi_class',
                name: '원데이 클래스 룸',
                description: '아치형 창문으로 바다가 내다보이는 아름다운 강의실. 나무 바닥 위로 햇살이 길게 드리워져 있고, 이젤과 책들이 여기저기 놓여있다.',
                background: 'umiclass01.png',
            },
            {
                id: 'stairs_up',
                name: '나선형 계단',
                description: '2층으로 이어지는 목조 계단. "관계자 외 출입금지" 팻말이 작게 붙어있다.',
                background: 'umiclass02.png',
            },
            {
                id: 'staff_door',
                name: '스태프 룸',
                description: '직원들이 휴식을 취하는 공간. 안쪽에는 낡은 벽돌 벽 옆으로 돌계단이 있고, 계단 아래쪽 벽에는 아치형으로 된 작은 나무 문이 숨겨져 있다. 문틈으로 서늘한 냉기가 새어 나오는 것 같다.',
                background: 'image_3.png', // 계단과 비밀 통로 이미지 사용
            }
        ]
    },

    // ----------------------------------------------------------------
    // B1: 사교와 기만의 장 (The Social Layer)
    // 기믹: '엿보기'와 '여론 조작(Reputation Attack)'의 주 무대.
    // ----------------------------------------------------------------
    {
        id: 'B1',
        name: 'B1: 규율의 공간',
        description: '신도들이 모여 식사하고 교류하는 곳. 묘한 활기와 감시가 공존한다.',
        rooms: [
            {
                id: 'cafeteria',
                name: '중앙 식당',
                description: '점심시간(12:00)에 모든 NPC가 모인다. 구석 자리는 도청하기 완벽하다.',
            },
            {
                id: 'lounge',
                name: '휴게실 (자판기 구역)',
                description: '솔피의 눈물(하급)이 들어있는 자판기가 있다. 청갈치(사기꾼)가 자주 출몰한다.',
            },
            {
                id: 'kitchen',
                name: '조리실',
                description: '칼과 불이 있는 위험한 곳. B4로 직행하는 식재료용 덤웨이터(소형 승강기)가 있다.',
            },
            {
                id: 'master_room',
                name: '관리실 (구 교주의 방)',
                description: 'CCTV로 B2 복도를 감시하는 곳. 주교는 더 깊은 곳에 있다. 여기엔 장부만 있다.',
            }
        ]
    },

    // ----------------------------------------------------------------
    // B2: 감금과 생활 (The Private Layer)
    // 기믹: NPC들의 개인 공간. 증거 수집(가택 침입) 및 파트너 관리.
    // ----------------------------------------------------------------
    {
        id: 'B2',
        name: 'B2: 침묵의 복도',
        description: '신도들의 숙소. 밤이 되면 기괴한 신음소리([뻐끔] 소리)가 벽 너머로 들린다.',
        rooms: [
            {
                id: 'player_room',
                name: '304호 (나의 방)',
                description: '안전 가옥. 파트너 형사(또는 기자)가 대기 중이다. 획득한 아이템을 숨길 수 있다.',
            },
            {
                id: 'suspect_room_1',
                name: '305호 (박복어의 방)',
                description: '항상 잠겨있다. 문틈으로 비린내가 새어 나온다. 살인의 증거가 있을지 모른다.',
            },
            {
                id: 'suspect_room_2',
                name: '306호 (곽민어의 방)',
                description: '잡동사니가 가득하다. 훔친 물건들을 숨겨둔 것 같다.',
            },
            {
                id: 'shower_room',
                name: '공용 샤워실',
                description: '물소리 때문에 도청당하지 않는다. 기자와 은밀한 거래를 하기에 적합하다.',
            }
        ]
    },

    // ----------------------------------------------------------------
    // B3: 맹신과 심판 (The Fanatic Layer)
    // 기믹: UmiLevel(권력)이 높아야 의심받지 않음. '왕따 NPC'가 갇히는 곳.
    // ----------------------------------------------------------------
    {
        id: 'B3',
        name: 'B3: 심해의 예배당',
        description: '습도가 매우 높다. 바닥이 항상 축축하며, 벽화 속 솔피의 눈이 움직이는 것 같다.',
        rooms: [
            {
                id: 'chapel',
                name: '대예배당',
                description: '거대한 솔피상이 있는 곳. 새벽 기도(04:00)가 강제 진행된다.',
            },
            {
                id: 'confession_room',
                name: '정화의 방 (독방)',
                description: '평판(Reputation)이 바닥난 NPC가 갇히는 곳. 그들은 여기서 강제 변이를 당한다.',
            },
            {
                id: 'secret_passage',
                name: '성물 안치소',
                description: '단상 뒤편의 비밀 공간. B4로 내려가는 나선형 계단이 숨겨져 있다.',
            }
        ]
    },

    // ----------------------------------------------------------------
    // B4: 진실 (The Abyss)
    // 기믹: Fishlevel 4 이상만 진실(텍스트)을 볼 수 있음. 낮은 레벨에선 공포만 느낌.
    // ----------------------------------------------------------------
    {
        id: 'B4',
        name: 'B4: 어머니의 품',
        description: '건물이 아니다. 해저 동굴을 개조한 공간. 파도 소리가 귀를 때린다.',
        rooms: [
            {
                id: 'lab',
                name: '배합실',
                description: '솔피의 눈물을 제조하는 곳. 실패작(완전 변이체)들이 유리관에 떠다닌다.',
            },
            {
                id: 'solpi_tank',
                name: '솔피의 수조',
                description: '집채만한 범고래(혹은 고대 생물) 솔피가 갇혀있는 거대 수조. 주교 전광어가 머무는 곳.',
            },
            {
                id: 'ocean_gate',
                name: '배수구 (탈출구)',
                description: '바다로 연결되는 거대한 배수구. 인간의 몸으로는 수압을 견딜 수 없을지도 모른다.',
            }
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
