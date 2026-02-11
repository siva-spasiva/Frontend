import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchGameStats, updateGameStats, fetchStaticGameData, transferItem } from '../api/stats';

// Fish Level Tier 유틸리티
const getFishTier = (fishLevel) => {
    if (fishLevel >= 100) return 5;
    if (fishLevel >= 81) return 4;
    if (fishLevel >= 61) return 3;
    if (fishLevel >= 41) return 2;
    if (fishLevel >= 21) return 1;
    return 0;
};
const FISH_TIER_LABELS = ['정상', '미세 변이', '중간 변이', '심각 변이', '거의 물고기', '완전한 물고기'];


const GameContext = createContext();

// Removed local URL constants in favor of API adapter


export const useGame = () => {
    return useContext(GameContext);
};

export const GameProvider = ({ children }) => {
    // Stats State
    const [stats, setStats] = useState({
        fishLevel: 0,
        umiLevel: 0,
        hp: 50,
        trust: 10,
        currentDay: 0,
        currentPeriod: 'morning',
        tutorialCompleted: false,
        npcStats: {},
        inventory: ['smartphone', 'id_card', 'police_badge']
    });

    // Static Data State
    const [gameData, setGameData] = useState({
        npcData: {},
        mapData: {},
        floorData: [],
        itemData: {},
        scheduleData: {}  // NPC 스케줄 데이터
    });

    // Custom Items (Dynamic, e.g. Transcripts)
    const [customItems, setCustomItems] = useState({});

    // Current Chat Logs (Synced from active scene)
    const [chatLogs, setChatLogs] = useState([]);

    // Current Location Info (Synced from active scene)
    const [currentLocationInfo, setCurrentLocationInfo] = useState(null);

    // === Item Presentation System ===
    // Currently presented item (shown above chat UI when presenting to NPC)
    const [presentedItem, setPresentedItem] = useState(null);
    // Active NPC in current field (synced from scene)
    const [activeNpcInField, setActiveNpcInField] = useState(null);

    // Visual State for App Layout
    const [isPhoneCentered, setIsPhoneCentered] = useState(false);
    const [phoneScreenOverride, setPhoneScreenOverride] = useState(null);
    const [appEvent, setAppEvent] = useState(null);

    // === Fish Level Tier System ===
    const [fishLevelUpWarning, setFishLevelUpWarning] = useState(null); // { prevTier, newTier, label }
    const [isGameOver, setIsGameOver] = useState(false);
    const prevFishTierRef = useRef(0);

    const [isLoading, setIsLoading] = useState(true);

    // Fetch Initial Stats and Data
    useEffect(() => {
        const initGame = async () => {
            await Promise.all([fetchStats(), fetchStaticData()]);
            setIsLoading(false);
        };
        initGame();
        initGame();
    }, []);

    // Check Effects: Fish Level & Contract Replacement
    useEffect(() => {
        // Condition: Fish Level >= 20 AND Has Suspicious Contract (item004)
        const hasSuspiciousContract = stats.inventory?.includes('item004');

        if (stats.fishLevel >= 20 && hasSuspiciousContract) {
            console.log("Fish level high enough, enlightening contract...");

            // 1. Remove item004, Add item020
            const currentInv = stats.inventory || [];
            const newInv = currentInv.filter(id => id !== 'item004');
            if (!newInv.includes('item020')) {
                newInv.push('item020');
            }

            // 2. Perform Update
            // Also increase Umi Level as a bonus
            updateStatsBackend({
                inventory: newInv,
                umiLevel: Math.max(stats.umiLevel, 1)
            });
        }
    }, [stats.fishLevel, stats.inventory]); // Dependency on specific stats

    // === Fish Level Tier Change Detection ===
    useEffect(() => {
        const currentTier = getFishTier(stats.fishLevel || 0);
        const prevTier = prevFishTierRef.current;

        if (currentTier > prevTier && prevTier !== undefined) {
            if (currentTier >= 5) {
                // 만렙 = 게임 오버
                setIsGameOver(true);
                console.log('[GAME OVER] Fish Level 100 도달 — 완전한 물고기');
            } else {
                // 레벨업 경고
                setFishLevelUpWarning({
                    prevTier,
                    newTier: currentTier,
                    label: FISH_TIER_LABELS[currentTier],
                });
                console.log(`[Fish Level Up] Tier ${prevTier} → ${currentTier} (${FISH_TIER_LABELS[currentTier]})`);
            }
        }
        prevFishTierRef.current = currentTier;
    }, [stats.fishLevel]);

    const fetchStats = async () => {
        try {
            const data = await fetchGameStats();
            console.log("Fetched Stats:", data);
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch game stats:", error);
        }
    };

    const fetchStaticData = async () => {
        try {
            const data = await fetchStaticGameData();
            setGameData(data); // Expecting { npcData, mapData, floorData }
        } catch (error) {
            console.error("Failed to fetch static game data:", error);
        }
    };

    // Generic Update Function
    const updateStatsBackend = async (updates, npcId = null) => {
        console.log("Updating Stats:", updates, "NPC:", npcId);

        // Optimistic update
        if (!npcId) {
            setStats(prev => ({ ...prev, ...updates }));
        } else {
            setStats(prev => {
                const currentNpc = prev.npcStats?.[npcId] || {};
                return {
                    ...prev,
                    npcStats: {
                        ...prev.npcStats,
                        [npcId]: { ...currentNpc, ...updates }
                    }
                };
            });
        }

        try {
            const newFullData = await updateGameStats(updates, npcId);
            // backend returns flat global + npcStats
            setStats(newFullData);

        } catch (error) {
            console.error("Failed to update stats:", error);
            // Ideally rollback optimistic update here
        }
    };

    // Sync without backend call (used when backend already returned updated stats)
    const syncStats = (newStats) => {
        console.log("Syncing Stats:", newStats);
        setStats(prev => ({ ...prev, ...newStats }));
    };

    // Helper functions maintaining original API
    const updateHp = (amount) => updateStatsBackend({ hp: stats.hp + amount });
    // const updateTrust = (amount) => updateStatsBackend({ trust: stats.trust + amount }); // Removed
    const updateFishLevel = (amount) => updateStatsBackend({ fishLevel: stats.fishLevel + amount });
    const updateUmiLevel = (amount) => updateStatsBackend({ umiLevel: stats.umiLevel + amount });

    // Explicit setters if needed
    const setFishLevel = (val) => updateStatsBackend({ fishLevel: typeof val === 'function' ? val(stats.fishLevel) : val });
    const setUmiLevel = (val) => updateStatsBackend({ umiLevel: typeof val === 'function' ? val(stats.umiLevel) : val });
    const setHp = (val) => updateStatsBackend({ hp: typeof val === 'function' ? val(stats.hp) : val });
    const setTrust = (val) => updateStatsBackend({ trust: typeof val === 'function' ? val(stats.trust) : val });
    const setTutorialCompleted = (val) => updateStatsBackend({ tutorialCompleted: val });

    // === Day / Period System ===
    const PERIOD_ORDER = ['morning', 'afternoon', 'evening'];
    const PERIOD_LABELS = { morning: '아침', afternoon: '오후', evening: '저녁' };
    const PERIOD_CLOCK = { morning: '08:00', afternoon: '14:00', evening: '20:00' };

    const setDay = (day) => updateStatsBackend({ currentDay: Math.max(0, Math.min(7, day)) });
    const setPeriod = (period) => updateStatsBackend({ currentPeriod: period });

    /**
     * 시간대 전진: morning→afternoon→evening→(다음날 morning + day+1)
     */
    const advancePeriod = () => {
        const currentIdx = PERIOD_ORDER.indexOf(stats.currentPeriod);
        if (currentIdx < PERIOD_ORDER.length - 1) {
            // 같은 날 다음 시간대
            updateStatsBackend({ currentPeriod: PERIOD_ORDER[currentIdx + 1] });
        } else {
            // evening → 다음 날 morning
            const nextDay = Math.min(stats.currentDay + 1, 7);
            updateStatsBackend({ currentDay: nextDay, currentPeriod: 'morning' });
        }
    };

    /**
     * 특정 방에 있는 NPC 목록 조회 (스케줄 기반)
     * @param {string} roomId
     * @returns {string[]} NPC ID 배열
     */
    const getNpcsForRoom = (roomId) => {
        const schedule = gameData.scheduleData;
        if (!schedule || !roomId) return [];

        const day = stats.currentDay;
        const period = stats.currentPeriod;
        const npcsInRoom = [];

        for (const npcId in schedule) {
            const npcSchedule = schedule[npcId];
            const daySchedule = npcSchedule[day] ?? npcSchedule.default;
            if (!daySchedule) continue;
            if (daySchedule[period] === roomId) {
                npcsInRoom.push(npcId);
            }
        }

        return npcsInRoom;
    };

    const incrementFishLevel = () => updateStatsBackend({ fishLevel: stats.fishLevel + 1 });
    const incrementUmiLevel = () => updateStatsBackend({ umiLevel: stats.umiLevel + 1 });

    const addItem = (itemId) => {
        console.log("Adding item:", itemId);
        // Prevent duplicates for key items if needed, or just push
        const currentInventory = stats.inventory || [];
        if (!currentInventory.includes(itemId)) {
            updateStatsBackend({ inventory: [...currentInventory, itemId] });
        }
    };

    const addCustomItem = (item) => {
        console.log("Adding custom item:", item);
        setCustomItems(prev => ({ ...prev, [item.id]: item }));

        // Also add ID to inventory list
        const currentInventory = stats.inventory || [];
        if (!currentInventory.includes(item.id)) {
            updateStatsBackend({ inventory: [...currentInventory, item.id] });
        }
    };

    const removeItem = (itemId) => {
        console.log("Removing item:", itemId);
        const currentInventory = stats.inventory || [];
        const newInventory = currentInventory.filter(id => id !== itemId);
        updateStatsBackend({ inventory: newInventory });

        // If it's a custom item, we could optionally remove it from customItems, 
        // but keeping it there is harmless unless memory is a concern.
        // For strict cleanup:
        if (customItems[itemId]) {
            setCustomItems(prev => {
                const newState = { ...prev };
                delete newState[itemId];
                return newState;
            });
        }
    };

    // === Consumable Item Usage ===
    const useItem = (item) => {
        if (!item?.consumable) {
            console.warn('Cannot use non-consumable item:', item?.id);
            return false;
        }
        if (!(stats.inventory || []).includes(item.id)) {
            console.warn('Item not in inventory:', item.id);
            return false;
        }

        const updates = {};

        // Apply effects
        if (item.effect?.fishLevel) {
            updates.fishLevel = Math.min(100, (stats.fishLevel || 0) + item.effect.fishLevel);
        }

        // Remove from inventory
        const newInv = (stats.inventory || []).filter(id => id !== item.id);
        updates.inventory = newInv;

        console.log(`[Use Item] ${item.name} (${item.id}) → effects:`, item.effect);
        updateStatsBackend(updates);
        return true;
    };

    const inventoryItems = (stats.inventory || [])
        .map(id => gameData.itemData?.[id] || customItems[id])
        .filter(Boolean);

    // === Item Presentation Helpers ===
    /**
     * Present an item to the current NPC.
     * @param {object} item - The item object to present (from inventoryItems or customItems)
     */
    const presentItem = (item) => {
        if (!item) return;
        // Verify it's actually in inventory
        if (!(stats.inventory || []).includes(item.id)) {
            console.warn('Cannot present item not in inventory:', item.id);
            return;
        }
        const presented = {
            itemId: item.id,
            name: item.name,
            icon: item.icon || '📦',
            description: item.description,
            type: item.type, // 'normal' | 'key_item' | 'transcript'
        };
        // For transcript items, include a summary line
        if (item.type === 'transcript' && item.content) {
            const firstNpcLine = item.content.find(l => l.type === 'npc' || l.type === 'active_npc');
            presented.transcriptSummary = firstNpcLine
                ? firstNpcLine.text.substring(0, 40) + (firstNpcLine.text.length > 40 ? '...' : '')
                : '대화 기록';
            presented.transcriptContent = item.content;
        }
        console.log('Presenting item:', presented);
        setPresentedItem(presented);
    };

    // === NPC ↔ Player 아이템 전달 ===
    const transferItemFromNpc = async (npcId, itemId) => {
        try {
            const data = await transferItem(npcId, itemId, 'fromNpc');
            setStats(prev => ({
                ...prev,
                ...data,
                npcStats: data.npcStats || prev.npcStats,
            }));
            console.log(`[Transfer] NPC '${npcId}' → Player: ${itemId}`);
            return true;
        } catch (err) {
            console.error('[Transfer Error]', err);
            return false;
        }
    };

    const transferItemToNpc = async (npcId, itemId) => {
        try {
            const data = await transferItem(npcId, itemId, 'toNpc');
            setStats(prev => ({
                ...prev,
                ...data,
                npcStats: data.npcStats || prev.npcStats,
            }));
            console.log(`[Transfer] Player → NPC '${npcId}': ${itemId}`);
            return true;
        } catch (err) {
            console.error('[Transfer Error]', err);
            return false;
        }
    };

    const getNpcInventory = (npcId) => {
        const npcInv = stats.npcStats?.[npcId]?.inventory || [];
        return npcInv.map(id => gameData.itemData?.[id]).filter(Boolean);
    };

    const clearPresentation = () => {
        setPresentedItem(null);
    };

    const value = {
        // Expose all stats directly
        ...stats,

        // Expose Game Data
        npcData: gameData.npcData,
        mapData: gameData.mapData,
        floorData: gameData.floorData,
        scheduleData: gameData.scheduleData,
        isLoading,

        // Day / Period System
        currentDay: stats.currentDay ?? 0,
        currentPeriod: stats.currentPeriod ?? 'morning',
        PERIOD_LABELS,
        PERIOD_CLOCK,
        PERIOD_ORDER,
        setDay,
        setPeriod,
        advancePeriod,
        getNpcsForRoom,

        // Expose setters
        setFishLevel,
        setUmiLevel,
        setHp,
        setTrust,
        setTutorialCompleted,

        // Expose updaters
        updateHp,
        updateTrust: (amount) => updateStatsBackend({ trust: stats.trust + amount }), // Re-enabled
        updateFishLevel,
        updateUmiLevel,
        incrementFishLevel,
        incrementUmiLevel,
        addItem,
        addCustomItem,
        removeItem,
        useItem,
        inventoryItems,

        // Fish Level Tier System
        fishTier: getFishTier(stats.fishLevel || 0),
        fishTierLabel: FISH_TIER_LABELS[getFishTier(stats.fishLevel || 0)],
        fishLevelUpWarning,
        clearFishLevelUpWarning: () => setFishLevelUpWarning(null),
        isGameOver,
        FISH_TIER_LABELS,
        getFishTier,

        // Chat Logs
        chatLogs,
        setChatLogs,
        currentLocationInfo,
        setCurrentLocationInfo,
        ITEMS: gameData.itemData || {},

        // Item Presentation System
        presentedItem,
        presentItem,
        clearPresentation,
        activeNpcInField,
        setActiveNpcInField,
        isNpcPresent: !!activeNpcInField,

        // NPC Inventory & Transfer
        transferItemFromNpc,
        transferItemToNpc,
        getNpcInventory,

        // Layout Control
        isPhoneCentered,
        setIsPhoneCentered,
        phoneScreenOverride,
        setPhoneScreenOverride,

        // Generic Event Bus for Scene-App Communication
        appEvent: appEvent, // Fixed: Pass actual state
        triggerAppEvent: (event, payload) => setAppEvent({ event, payload, timestamp: Date.now() }),

        // Max values (hardcoded for now)
        maxHp: 100,
        maxTrust: 100,
        maxFishLevel: 100,
        maxUmiLevel: 100,

        fetchStats,
        syncStats,
        updateStatsBackend
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};
