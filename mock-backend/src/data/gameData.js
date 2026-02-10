
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

// [NOTE] MAP_DATA is now merged into FLOOR_DATA.
// Use getGameData() to retrieve the flat map data structure.

export const FLOOR_DATA = [
    {
        id: '2F',
        name: '자재 창고',
        description: '쓰지 않는 미술 도구와 카페 비품들이 쌓여있다. 1층의 활기찬 소리가 먹먹하게 들려온다.',
        rooms: [
            {
                id: 'storage_main',
                name: '메인 창고',
                namePrefix: '2F 자재 창고',
                highlightText: 'MAIN',
                highlightColor: 'text-gray-400',
                description: '쓰지 않는 미술 도구와 카페 비품들이 쌓여있다. 1층의 활기찬 소리가 먹먹하게 들려온다.',
                background: '2F_storage01.png',
                overlayColor: 'bg-black/60',
                activeZones: [
                    {
                        id: 'to_terrace',
                        type: 'move',
                        target: 'terrace',
                        x: '80%',
                        y: '30%',
                        width: '15%',
                        height: '40%',
                        label: '테라스',
                        message: '테라스로 나간다.'
                    },
                    {
                        id: 'item_box_01',
                        type: 'item',
                        itemId: 'item010', // Black Key
                        x: '50%',
                        y: '75%',
                        width: '10%',
                        height: '10%',
                        label: '작은 상자',
                        message: '구석에 놓인 낡은 상자.'
                    }
                ]
            },
            {
                id: 'terrace',
                name: '테라스',
                namePrefix: '2F 테라스',
                highlightText: 'OPEN',
                highlightColor: 'text-blue-200',
                description: '테라스. 바닷바람이 시원하게 불어온다.',
                overlayColor: 'bg-black/10',
                background: '2F_terrace01.png',
                activeZones: [
                    {
                        id: 'back_to_storage',
                        type: 'move',
                        target: 'storage_main',
                        x: '10%',
                        y: '50%',
                        width: '10%',
                        height: '30%',
                        label: '창고로',
                        message: '창고 안으로 돌아간다.'
                    },
                    {
                        id: 'terrace_to_stairs',
                        type: 'move',
                        target: 'stairs_up',
                        x: '30%',
                        y: '85%',
                        width: '40%',
                        height: '15%',
                        label: '1층 계단',
                        message: '계단을 통해 1층으로 내려간다.'
                    }
                ]
            }
        ]
    },

    {
        id: '1F',
        name: '우미 갤러리 & 카페',
        description: '아름다운 해안 절벽 위에 세워진 목조 건물.',
        mapImage: '1F_outside.png',
        rooms: [
            {
                id: 'main_hall',
                name: '메인 홀',
                namePrefix: '1F 메인 홀',
                highlightText: 'CAFE',
                highlightColor: 'text-blue-300',
                description: '잔잔한 재즈 음악이 흐르는, 바닷가가 보이는 깔끔한 인테리어와 곳곳에 놓인 싱그러운 화분들이 돋보인다.',
                background: null,
                overlayColor: 'bg-black/5',
            },
            {
                id: 'umi_class',
                name: '원데이 클래스 룸',
                namePrefix: '원데이 클래스',
                highlightText: '우미',
                highlightColor: 'text-blue-400',
                description: '아치형 창문으로 바다가 내다보이는 아름다운 강의실. 나무 바닥 위로 햇살이 길게 드리워져 있고, 이젤과 책들이 여기저기 놓여있다.',
                background: '1F_class02.png',
                overlayColor: 'bg-black/5',
            },
            {
                id: 'stairs_up',
                name: '계단',
                description: '2층으로 이어지는 목조 계단. "관계자 외 출입금지" 팻말이 작게 붙어있다.',
                background: '1F_stair01.png',
                activeZones: [
                    {
                        id: 'to_storage',
                        type: 'move',
                        target: 'storage_main',
                        x: '45%',
                        y: '10%',
                        width: '15%',
                        height: '20%',
                        label: '2층 창고',
                        message: '2층 자재 창고로 올라간다.'
                    },
                    {
                        id: 'center_door_locked',
                        type: 'info', // Changed to info to represent locked state
                        x: '65%',
                        y: '50%',
                        width: '15%',
                        height: '30%',
                        label: '지하 1층 (잠김)',
                        message: '문이 굳게 잠겨있다. "관계자 외 출입금지"'
                    },
                    {
                        id: 'to_umi_class',
                        type: 'move',
                        target: 'umi_class',
                        x: '90%',
                        y: '40%',
                        width: '10%',
                        height: '40%',
                        label: '복도',
                        message: '복도로 나간다.'
                    }
                ]
            },
            {
                id: 'stairs_down',
                name: '계단',
                description: '2층으로 이어지는 목조 계단. 지하로 내려가는 계단이 보인다.',
                background: '1F_stair02.png',
                activeZones: [
                    {
                        id: 'to_storage',
                        type: 'move',
                        target: 'storage_main',
                        x: '5%',
                        y: '20%',
                        width: '25%',
                        height: '70%',
                        label: '2층 창고',
                        message: '2층 자재 창고로 올라간다.'
                    },
                    {
                        id: 'to_b1',
                        type: 'move',
                        target: 'cafeteria',
                        x: '35%',
                        y: '30%',
                        width: '30%',
                        height: '60%',
                        label: '지하 1층',
                        message: '지하 1층으로 내려간다.'
                    },
                    {
                        id: 'to_umi_class',
                        type: 'move',
                        target: 'umi_class',
                        x: '75%',
                        y: '40%',
                        width: '20%',
                        height: '50%',
                        label: '복도',
                        message: '복도로 나간다.'
                    }
                ]
            }
        ]
    },

    {
        id: 'B1',
        name: 'B1: 규율의 공간',
        description: '신도들이 모여 식사하고 교류하는 곳. 묘한 활기와 감시가 공존한다.',
        rooms: [
            {
                id: 'cafeteria',
                name: '중앙 식당',
                namePrefix: 'B1 중앙 식당',
                highlightText: 'DINING',
                highlightColor: 'text-orange-300',
                description: '조금 소란스러운 식당. 신도들이 식사를 하고 있다.',
                mapImage: 'B1_restaurant01.png',
                overlayColor: 'bg-black/20',
            },
            {
                id: 'lounge',
                name: '휴게실 (자판기 구역)',
                description: '솔피의 눈물이 들어있는 자판기가 있다.',
                background: null,
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

    {
        id: 'B2',
        name: '거주층',
        description: '신도들의 숙소. 기묘한 소리가 벽 너머로 들린다.',
        rooms: [
            {
                id: 'room001', // Renamed from player_room for consistency
                name: '001호',
                namePrefix: '001호',
                highlightText: '001',
                highlightColor: 'text-yellow-500',
                description: '어둡고 조용한 방. 왠지 모르게 춥다.',
                background: 'B2_room02.png',
                overlayColor: 'bg-black/40',
                activeZones: [
                    {
                        id: 'zone_bed',
                        type: 'info',
                        x: '18%',
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
                        y: '55%',
                        width: '15%',
                        height: '15%',
                        label: '작은 테이블',
                        message: '먼지가 쌓인 테이블.'
                    },
                    {
                        id: 'zone_box',
                        type: 'item',
                        x: '75%',
                        y: '60%',
                        width: '15%',
                        height: '20%',
                        label: '옷장 서랍',
                        message: '잠겨있다. 무언가 열쇠가 필요해 보인다...'
                    },
                    {
                        id: 'zone_door',
                        type: 'move',
                        target: 'hallway',
                        x: '69%',
                        y: '22%',
                        width: '8%',
                        height: '50%',
                        label: '지하 복도',
                        message: '복도로 나간다.'
                    }
                ]
            },
            {
                id: 'hallway',
                name: '복도',
                namePrefix: 'B2 복도',
                highlightText: 'HALL',
                highlightColor: 'text-gray-600',
                description: '묘한 비린내와 곰팡이 냄새가 진동하는 복도.',
                overlayColor: 'bg-black/20',
                background: 'B2_hallway02.png',
                activeZones: [
                    {
                        id: 'door_001',
                        type: 'move',
                        target: 'room001',
                        x: '5%',
                        y: '20%',
                        width: '16%',
                        height: '60%',
                        label: '001호',
                        message: '001호 문을 연다.'
                    },
                    {
                        id: 'door_shower',
                        type: 'move',
                        target: 'shower_room',
                        x: '30%',
                        y: '20%',
                        width: '12%',
                        height: '60%',
                        label: '샤워실',
                        message: '샤워실에 들어간다.'
                    },
                    {
                        id: 'door_003',
                        type: 'move',
                        target: 'room003',
                        x: '48%',
                        y: '30%',
                        width: '8%',
                        height: '45%',
                        label: '003호',
                        message: '003호로 들어간다.'
                    },
                    {
                        id: 'stair_001',
                        type: 'move',
                        target: 'B1',
                        x: '70%',
                        y: '40%',
                        width: '7%',
                        height: '20%',
                        label: '지하 1층으로',
                        message: '지하 1층으로 올라간다.'
                    },
                    {
                        id: 'door_004',
                        type: 'move',
                        target: 'room004',
                        x: '75%',
                        y: '20%',
                        width: '14%',
                        height: '60%',
                        label: '004호',
                        message: '004호 문을 연다.'
                    }
                ]
            },
            {
                id: 'suspect_room_1',
                name: '002호',
                namePrefix: '002호',
                highlightText: 'LOCKED',
                highlightColor: 'text-red-500',
                description: '항상 잠겨있다. 문틈으로 비린내가 새어 나온다. 살인의 증거가 있을지 모른다.',
                background: null,
                overlayColor: 'bg-black/40',
            },
            {
                id: 'suspect_room_2',
                name: '003호',
                namePrefix: '003호',
                highlightText: '003',
                highlightColor: 'text-gray-400',
                description: '잡동사니가 가득하다. 훔친 물건들을 숨겨둔 것 같다.',
                background: null,
                overlayColor: 'bg-black/40',
            },
            {
                id: 'shower_room',
                name: '공용 샤워실',
                namePrefix: 'B2 샤워실',
                highlightText: 'SHOWER',
                highlightColor: 'text-blue-200',
                description: '물때와 곰팡이로 얼룩진 샤워실. 비린내가 난다.',
                background: null,
                overlayColor: 'bg-black/30',
            }
        ]
    },

    {
        id: 'B3',
        name: 'B3: 심해의 예배당',
        description: '습도가 매우 높다. 바닥이 항상 축축하며, 벽화 속 솔피의 눈이 움직이는 것 같다.',
        mapImage: 'B3_hall.png',
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

    {
        id: 'B4',
        name: 'B4: 어머니의 품',
        description: '건물최하층, 해저 동굴을 개조한 공간. 파도 소리가 귀를 때린다.',
        mapImage: 'B4_water01.png',
        rooms: [
            {
                id: 'ocean_gate',
                name: '배수구 (탈출구)',
                namePrefix: 'B4 배수구',
                highlightText: 'EXIT',
                highlightColor: 'text-blue-800',
                description: '바다로 연결되는 거대한 배수구.',
                overlayColor: 'bg-blue-900/40',
            },
            {
                id: 'master_room',
                name: '전광어의 방',
                description: '전광어의 방. 수조에 물고기가 가득하다.',
            },
            {
                id: 'solpi_tank',
                name: '솔피의 수조',
                description: '집채만한 범고래 솔피가 갇혀있는 거대 수조.',
            }
        ]
    },

    // ----------------------------------------------------------------
    // DEBUG / ETC
    // ----------------------------------------------------------------
    {
        id: 'DEBUG',
        name: '디버그 구역',
        description: '개발자 및 테스트용 공간.',
        rooms: [
            {
                id: 'test01',
                name: 'UNKNOWN MAP',
                namePrefix: 'UNKNOWN MAP',
                highlightText: '01',
                highlightColor: 'text-yellow-500',
                description: '정체불명의 공간. 비릿한 냄새가 난다.',
                background: null,
                overlayColor: 'bg-black/40',
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

    // Process Floor Data first
    const resolvedFloorData = FLOOR_DATA.map(floor => ({
        ...floor,
        mapImage: floor.mapImage ? `${MAP_ROOT}${floor.mapImage}` : null,
        rooms: floor.rooms.map(room => ({
            ...room,
            background: resolveMapBackground(room.background)
        }))
    }));

    // Generate Map Data from Floor Data (Flat List for Lookups)
    const resolvedMapData = {};
    resolvedFloorData.forEach(floor => {
        floor.rooms.forEach(room => {
            // Only add if it has an ID
            if (room.id) {
                resolvedMapData[room.id] = room;
            }
        });
    });

    return {
        npcData: resolvedNpcData,
        mapData: resolvedMapData,
        floorData: resolvedFloorData,
        itemData: ITEM_DEFINITIONS
    };
};

// Export raw data for internal backend usage if needed (e.g., prompts)
export { NPC_DATA };
