import { getState, updateGlobalState, updateNpcState, resetState, transferItemFromNpc, transferItemToNpc } from '../services/stateService.js';

export const getStats = (req, res) => {
    const { userId = 'default_user' } = req.query;
    const state = getState(userId);
    // Flatten global stats to root for frontend compatibility (StatusWidget expects top-level hp, trust)
    res.json({
        ...state.global,
        npcStats: state.npcStats
    });
};

export const updateStats = (req, res) => {
    const { userId = 'default_user', updates, npcId } = req.body;
    if (!updates) {
        return res.status(400).json({ error: 'Missing updates object' });
    }

    if (npcId) {
        updateNpcState(userId, npcId, updates);
    } else {
        updateGlobalState(userId, updates);
    }

    // Return full structure for consistency
    const state = getState(userId);
    res.json({
        ...state.global,
        npcStats: state.npcStats
    });
};

export const resetStats = (req, res) => {
    const { userId = 'default_user' } = req.query; // Or body
    const state = resetState(userId);
    res.json({
        ...state.global,
        npcStats: state.npcStats
    });
}

// NPC ↔ Player 아이템 전달
export const transferItem = (req, res) => {
    const { userId = 'default_user', npcId, itemId, direction = 'fromNpc' } = req.body;

    if (!npcId || !itemId) {
        return res.status(400).json({ error: 'Missing npcId or itemId' });
    }

    let result;
    if (direction === 'fromNpc') {
        result = transferItemFromNpc(userId, npcId, itemId);
    } else if (direction === 'toNpc') {
        result = transferItemToNpc(userId, npcId, itemId);
    } else {
        return res.status(400).json({ error: `Invalid direction '${direction}'. Use 'fromNpc' or 'toNpc'.` });
    }

    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }

    // Return full state
    const state = getState(userId);
    res.json({
        ...state.global,
        npcStats: state.npcStats
    });
};
