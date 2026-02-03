import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();

const BACKEND_URL_STATS = 'http://localhost:3000/api/stats';
const BACKEND_URL_DATA = 'http://localhost:3000/api/data/static';

export const useGame = () => {
    return useContext(GameContext);
};

export const GameProvider = ({ children }) => {
    // Stats State
    const [stats, setStats] = useState({
        fishLevel: 10,
        umiLevel: 10,
        hp: 50,
        trust: 10,
        friendly: 50,
        faith: 50,
        npcStats: {} // Initialize empty
    });

    // Static Data State
    const [gameData, setGameData] = useState({
        npcData: {},
        mapData: {},
        floorData: []
    });

    const [isLoading, setIsLoading] = useState(true);

    // Fetch Initial Stats and Data
    useEffect(() => {
        const initGame = async () => {
            await Promise.all([fetchStats(), fetchStaticData()]);
            setIsLoading(false);
        };
        initGame();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(BACKEND_URL_STATS);
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched Stats:", data);
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch game stats:", error);
        }
    };

    const fetchStaticData = async () => {
        try {
            const res = await fetch(BACKEND_URL_DATA);
            if (res.ok) {
                const data = await res.json();
                setGameData(data); // Expecting { npcData, mapData, floorData }
            }
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
            const body = { updates };
            if (npcId) body.npcId = npcId;

            const res = await fetch(BACKEND_URL_STATS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const newFullData = await res.json();
                // backend returns flat global + npcStats
                setStats(newFullData);
            }
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
    const updateTrust = (amount) => updateStatsBackend({ trust: stats.trust + amount });
    const updateFishLevel = (amount) => updateStatsBackend({ fishLevel: stats.fishLevel + amount });
    const updateUmiLevel = (amount) => updateStatsBackend({ umiLevel: stats.umiLevel + amount });

    // Explicit setters if needed
    const setFishLevel = (val) => updateStatsBackend({ fishLevel: typeof val === 'function' ? val(stats.fishLevel) : val });
    const setUmiLevel = (val) => updateStatsBackend({ umiLevel: typeof val === 'function' ? val(stats.umiLevel) : val });
    const setHp = (val) => updateStatsBackend({ hp: typeof val === 'function' ? val(stats.hp) : val });
    const setTrust = (val) => updateStatsBackend({ trust: typeof val === 'function' ? val(stats.trust) : val });

    const incrementFishLevel = () => updateStatsBackend({ fishLevel: stats.fishLevel + 1 });
    const incrementUmiLevel = () => updateStatsBackend({ umiLevel: stats.umiLevel + 1 });

    const value = {
        // Expose all stats directly
        ...stats,

        // Expose Game Data
        npcData: gameData.npcData,
        mapData: gameData.mapData,
        floorData: gameData.floorData,
        isLoading,

        // Expose setters
        setFishLevel,
        setUmiLevel,
        setHp,
        setTrust,

        // Expose updaters
        updateHp,
        updateTrust,
        updateFishLevel,
        updateUmiLevel,
        incrementFishLevel,
        incrementUmiLevel,

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
