import { NPC_DATA } from '../data/gameData.js';

const userStates = new Map();

const VALID_PERIODS = ['morning', 'afternoon', 'evening', 'night'];

export const INITIAL_STATS = {
    hp: 100,
    plusHp: 0,
    fishLevel: 0,
    umiLevel: 0,
    trust: 10,
    currentDay: 0,       // 0=Tutorial, 1~5=본편 (5일차가 최종일)
    currentPeriod: 'morning', // 'morning' | 'afternoon' | 'evening' | 'night'
    inventory: ['item001', 'item002', 'item003'],
    isTutorialCompleted: false
};

export const INITIAL_NPC_STATS = {
    friendly: 50,
    faith: 50,
    fishLevel: 0, // 0 to 100
};

export const getState = (userId) => {
    if (!userStates.has(userId)) {
        userStates.set(userId, {
            global: { ...INITIAL_STATS },
            npcStats: {}
        });
    }
    return userStates.get(userId);
};

// Helper to get specific NPC stats (auto-init if missing)
// NPC_DATA에 initialStats가 정의되어 있으면 기본값 대신 우선 적용
// NPC inventory도 자동 초기화
export const getNpcState = (userId, npcId) => {
    const state = getState(userId);
    if (!state.npcStats[npcId]) {
        const npcDef = NPC_DATA[npcId];
        const customInitial = npcDef?.initialStats;
        state.npcStats[npcId] = {
            ...INITIAL_NPC_STATS,
            ...customInitial,
            inventory: npcDef?.initialInventory ? [...npcDef.initialInventory] : [],
        };
    }
    // Migration: add inventory if missing (for already-initialized NPCs)
    if (!state.npcStats[npcId].inventory) {
        const npcDef = NPC_DATA[npcId];
        state.npcStats[npcId].inventory = npcDef?.initialInventory ? [...npcDef.initialInventory] : [];
    }
    return state.npcStats[npcId];
};

export const updateGlobalState = (userId, updates) => {
    const state = getState(userId);
    const newGlobal = { ...state.global };

    for (const [key, value] of Object.entries(updates)) {
        // Allow updating any key, not just those in INITIAL_STATS. 
        // This is important for new fields like inventory.
        newGlobal[key] = value;
    }

    // Bounds check
    if (newGlobal.hp !== undefined) newGlobal.hp = Math.max(0, Math.min(100, newGlobal.hp));
    if (newGlobal.plusHp !== undefined) newGlobal.plusHp = Math.max(0, Math.min(30, newGlobal.plusHp));
    if (newGlobal.currentDay !== undefined) newGlobal.currentDay = Math.max(0, Math.min(5, newGlobal.currentDay));
    if (newGlobal.currentPeriod !== undefined && !VALID_PERIODS.includes(newGlobal.currentPeriod)) {
        newGlobal.currentPeriod = 'morning'; // fallback
    }

    state.global = newGlobal;
    return newGlobal;
};

export const updateNpcState = (userId, npcId, updates) => {
    const currentState = getNpcState(userId, npcId);
    const newState = { ...currentState };

    for (const [key, value] of Object.entries(updates)) {
        if (key in INITIAL_NPC_STATS) {
            newState[key] = typeof INITIAL_NPC_STATS[key] === 'number' ? Number(value) : value;
        }
    }

    // Bounds check
    ['friendly', 'faith', 'fishLevel'].forEach(k => {
        if (newState[k] !== undefined) {
            newState[k] = Math.max(0, Math.min(100, newState[k]));
        }
    });

    // Save back
    const rootState = getState(userId);
    rootState.npcStats[npcId] = newState;

    return newState;
};

// Legacy support if needed, or unified access?
// We will export specific updaters.
export const updateState = (userId, updates) => {
    // This is a catch-all wrapper.
    // If updates contain global keys, update global.
    // If updates contain NPC keys, we need npcId. 
    // BUT legacy chatController calls updateState(userId, updates). 
    // We need to refactor chatController to call correct updater.
    // For now, let's assume 'updates' passed here are GLOBAL.
    return updateGlobalState(userId, updates);
};


export const resetState = (userId) => {
    userStates.set(userId, {
        global: { ...INITIAL_STATS },
        npcStats: {}
    });
    return userStates.get(userId);
}

/**
 * NPC → 플레이어 아이템 전달
 * NPC 인벤토리에서 제거하고 플레이어 인벤토리에 추가
 * @returns {{ success: boolean, error?: string }}
 */
export const transferItemFromNpc = (userId, npcId, itemId) => {
    const npcState = getNpcState(userId, npcId);
    const globalState = getState(userId).global;

    // Check NPC has the item
    if (!npcState.inventory || !npcState.inventory.includes(itemId)) {
        return { success: false, error: `NPC '${npcId}' does not have item '${itemId}'` };
    }

    // Check player doesn't already have it
    const playerInv = globalState.inventory || [];
    if (playerInv.includes(itemId)) {
        return { success: false, error: `Player already has item '${itemId}'` };
    }

    // Transfer: remove from NPC, add to player
    npcState.inventory = npcState.inventory.filter(id => id !== itemId);
    globalState.inventory = [...playerInv, itemId];

    return { success: true };
};

/**
 * 플레이어 → NPC 아이템 전달
 * 플레이어 인벤토리에서 제거하고 NPC 인벤토리에 추가
 * @returns {{ success: boolean, error?: string }}
 */
export const transferItemToNpc = (userId, npcId, itemId) => {
    const npcState = getNpcState(userId, npcId);
    const globalState = getState(userId).global;

    // Check player has the item
    const playerInv = globalState.inventory || [];
    if (!playerInv.includes(itemId)) {
        return { success: false, error: `Player does not have item '${itemId}'` };
    }

    // Transfer: remove from player, add to NPC
    globalState.inventory = playerInv.filter(id => id !== itemId);
    if (!npcState.inventory) npcState.inventory = [];
    npcState.inventory.push(itemId);

    return { success: true };
};

// ═══════════════════════════════════════
// Backend HP and Time Control Logic
// ═══════════════════════════════════════

/**
 * Handle HP spending on the backend. Decreases HP, and if 0 or below, rolls over to night or next morning.
 */
export const spendHpInternal = (userId, amount) => {
    const state = getState(userId);
    const g = state.global;

    let newHp = g.hp - amount;
    let newPeriod = g.currentPeriod;
    let newDay = g.currentDay;
    let transitionEvent = null;

    if (newHp <= 0) {
        // 기절/하루 종료 처리
        if (newPeriod === 'night') {
            newDay = Math.min(5, newDay + 1);
            newPeriod = 'morning';
            newHp = 100;
            transitionEvent = { next: 'morning', message: '피로로 쓰러졌습니다... 다음 날 아침이 되었습니다.' };
        } else {
            newPeriod = 'night';
            newHp = 20; // 심야에 깨어날 때 기본 부여되는 체력
            transitionEvent = { next: 'night', message: '피로로 쓰러졌습니다... 눈을 떠보니 심야입니다.' };
        }
    }

    const updates = {
        hp: newHp,
        currentDay: newDay,
        currentPeriod: newPeriod,
    };

    updateGlobalState(userId, updates);
    return { global: state.global, transitionEvent };
};

/**
 * Handle resting on the backend. Uses `plusHp` and skips to the next period.
 */
export const restInternal = (userId) => {
    const state = getState(userId);
    const g = state.global;

    // 적용할 회복량 계산
    const baseRecovery = 20;
    const additionalRecovery = g.plusHp || 0;
    let newHp = g.hp + baseRecovery + additionalRecovery;
    newHp = Math.min(100, newHp);

    let newPeriod = g.currentPeriod;
    let newDay = g.currentDay;
    let transitionEvent = null;

    // 시간 경과 로직
    const pIdx = VALID_PERIODS.indexOf(g.currentPeriod);
    if (pIdx === VALID_PERIODS.length - 1) {
        // night -> (next day) morning
        newDay = Math.min(5, newDay + 1);
        newPeriod = 'morning';
        newHp = 100; // 자고 일어나면 완충
        transitionEvent = { next: 'morning', message: '푹 쉬고 일어났습니다. 상쾌한 아침입니다.' };
    } else {
        newPeriod = VALID_PERIODS[pIdx + 1];
        transitionEvent = { next: newPeriod, message: '잠시 눈을 붙였습니다...' };
    }

    const updates = {
        hp: newHp,
        plusHp: 0, // 소모됨
        currentDay: newDay,
        currentPeriod: newPeriod,
    };

    updateGlobalState(userId, updates);
    return { global: state.global, transitionEvent };
};

