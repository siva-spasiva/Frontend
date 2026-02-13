
// Import prompts
import * as PROMPTS from '../utils/prompts.js';
import { ITEM_DEFINITIONS } from './items.js';
import { FLOOR_DATA } from './mapdata.js';
export { FLOOR_DATA };

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
        prompts: {
            friendly: {
                DEFAULT: PROMPTS.TEST03_NPC_PROMPT,
            },
        },
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
        prompts: {
            friendly: {
                DEFAULT: PROMPTS.REPORTER_PROMPT,
            },
        },
        apiConfig: {
            model: 'gpt-oss:20b-cloud',
        }
    },
    detective_kang: {
        id: 'detective_kang',
        name: '강 형사',
        prompts: {
            friendly: {
                DEFAULT: PROMPTS.DETECTIVE_KANG_PROMPT,
            },
        },
    },
    test02: {
        id: 'test02',
        name: 'Test NPC 02',
        prompts: {
            friendly: {
                DEFAULT: PROMPTS.TEST02_NPC_PROMPT,
            },
        },
    },
    bokeo: {
        id: 'bokeo',
        name: '박복어',
        // NPC별 초기 스탯 (기본값 대신 적용)
        initialStats: {
            friendly: 10,   // BAD 구간(0-19)에서 시작 — 극도의 경계
            faith: 80,
            fishLevel: 6,
        },
        initialInventory: ['npc_bokeo_001', 'npc_bokeo_002', 'npc_bokeo_003'],
        initialPortrait: 'npc_bokeo_00.png',
        portraits: {
            default: 'npc_bokeo_00.png',
            glare: 'npc_bokeo_01.png',
            smirk: 'npc_bokeo_02.png',
            confess: 'npc_bokeo_03.png',
        },
        // 친밀도(Friendly) 구간별 프롬프트 자동 전환
        prompts: {
            friendly: {
                BAD: PROMPTS.BOKEO_PROMPT_BAD,         // 0-19
                NORMAL: PROMPTS.BOKEO_PROMPT_NORMAL,   // 20-45
                GOOD: PROMPTS.BOKEO_PROMPT_GOOD,       // 46-75
                PERFECT: PROMPTS.BOKEO_PROMPT_PERFECT,  // 76-100
            },
        },
        apiConfig: {
            model: 'gpt-oss:20b-cloud',
        }
    },
    galchi: {
        id: 'galchi',
        name: '청갈치',
        initialStats: {
            friendly: 10,
            faith: 10,
            fishLevel: 10,
        },
        initialInventory: ['npc_galchi_001', 'npc_galchi_002'],
        initialPortrait: 'npc_galchi_00.png',
        portraits: {
            default: 'npc_galchi_00.png',
            smirk: 'npc_galchi_01.png',
            serious: 'npc_galchi_02.png',
        },
        prompts: {
            friendly: {
                BAD: PROMPTS.GALCHI_PROMPT_BAD,         // 0-19
                NORMAL: PROMPTS.GALCHI_PROMPT_NORMAL,   // 20-45
                GOOD: PROMPTS.GALCHI_PROMPT_GOOD,       // 46-75
                PERFECT: PROMPTS.GALCHI_PROMPT_PERFECT,  // 76-100
            },
        },
        apiConfig: {
            model: 'gpt-oss:20b-cloud',
        }
    },
    bingeo: {   // 곽빙어, 짜바리 도둑. 다른 NPC들의 정보를 가지고 있게끔.
        id: 'bingeo',
        name: '곽빙어',
        initialStats: {
            friendly: 15,
            faith: 20,
            fishLevel: 5,
        },
        initialInventory: ['npc_bingeo_001', 'npc_bingeo_002', 'npc_bingeo_003'],
        initialPortrait: 'npc_bingeo_00.png',
        portraits: {
            default: 'npc_bingeo_00.png',
            nervous: 'npc_bingeo_01.png',
            earnest: 'npc_bingeo_02.png',
        },
        prompts: {
            friendly: {
                BAD: PROMPTS.BINGEO_PROMPT_BAD,         // 0-19
                NORMAL: PROMPTS.BINGEO_PROMPT_NORMAL,   // 20-45
                GOOD: PROMPTS.BINGEO_PROMPT_GOOD,       // 46-75
                PERFECT: PROMPTS.BINGEO_PROMPT_PERFECT,  // 76-100
            },
        },
        apiConfig: {
            model: 'gpt-oss:20b-cloud',
        }
    }
};


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
