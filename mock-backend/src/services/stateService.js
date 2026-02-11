const userStates = new Map();

const VALID_PERIODS = ['morning', 'afternoon', 'evening'];

export const INITIAL_STATS = {
    hp: 50,
    fishLevel: 0,
    umiLevel: 0,
    trust: 10,
    currentDay: 0,       // 0=Tutorial, 1~7=본편
    currentPeriod: 'morning', // 'morning' | 'afternoon' | 'evening'
    inventory: ['item001', 'item002', 'item003']
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
export const getNpcState = (userId, npcId) => {
    const state = getState(userId);
    if (!state.npcStats[npcId]) {
        state.npcStats[npcId] = { ...INITIAL_NPC_STATS };
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
    if (newGlobal.currentDay !== undefined) newGlobal.currentDay = Math.max(0, Math.min(7, newGlobal.currentDay));
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
