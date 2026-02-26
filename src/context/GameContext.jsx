import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchGameStats, updateGameStats, transferItem, fetchTutorialStatus, completeTutorialAPI, spendHpBackend, restBackend, fetchStaticStats } from '../api/stats';
import { loginNewSave, createSaveSlot, activateSlot, touchSaveSlot, getSaveSlots, setTokens } from '../api/auth';
import { fetchAllMaps, fetchFloor } from '../api/map';
import { fetchInventory, addItemAPI, consumeItemAPI } from '../api/inventory';
import { getNpcDataResolved } from '../data/npcData';
import NPC_SCHEDULE from '../data/npcSchedule';
import { ITEM_DEFINITIONS } from '../data/items';

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
const MAP_ROOT = '/src/assets/map/';
const CANDIDATE_FLOOR_IDS = ['1F', '2F', 'B1', 'B2', 'B3', 'B4', 'B5', 'DEBUG'];


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
        hp: 100,
        plusHp: 0,
        trust: 10,
        currentDay: 0,
        currentPeriod: 'morning',
        npcStats: {},
        inventory: ['smartphone', 'id_card', 'police_badge'],
    });

    const [isTutorialCompleted, setIsTutorialCompleted] = useState(false);

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

    // === Section Transition System ===
    const [sectionTransition, setSectionTransition] = useState(null);
    // { message, targetRoom, nextPeriod, nextDay?, hpAfter }

    // === NPC Conversation Session Tracking ===
    const [activeConversationNpcId, setActiveConversationNpcId] = useState(null);

    // === Fish Level Tier System ===
    const [fishLevelUpWarning, setFishLevelUpWarning] = useState(null); // { prevTier, newTier, label }
    const [isGameOver, setIsGameOver] = useState(false);
    const prevFishTierRef = useRef(0);

    const [isLoading, setIsLoading] = useState(false);
    const [gameInitialized, setGameInitialized] = useState(false);
    const [currentSlotId, setCurrentSlotId] = useState(null);

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

    /**
     * 서버 stats → 프론트 stats 매핑
     */
    const mapServerStats = (data) => {
        return {
            fishLevel: data.fishLevel ?? data.fish_level ?? 0,
            umiLevel: data.umiLevel ?? data.umi_level ?? 0,
            hp: data.total_hp ?? data.hp ?? 100,
            sessionHp: data.session_hp ?? 30,
            plusHp: data.plus_hp ?? data.plusHp ?? 0,
            trust: data.trust ?? 10,
            currentDay: data.current_day ?? data.currentDay ?? 0,
            currentPeriod: data.current_session ?? data.currentPeriod ?? 'morning',
            npcStats: data.npcStats ?? {},
            inventory: data.inventory ?? ['smartphone', 'id_card', 'police_badge'],
            floorId: data.floor_id ?? null,
            roomId: data.room_id ?? null,
        };
    };

    /**
     * 새 게임 시작: 새 JWT 발급 → 슬롯 생성 → 서버 세션 초기화 → 데이터 로드
     */
    const initNewGame = async () => {
        setIsLoading(true);
        try {
            // 1. 새 JWT 발급 (새 세이브 슬롯)
            const tokens = await loginNewSave();
            setTokens(tokens);

            // 2. localStorage에 슬롯 생성
            const slot = createSaveSlot(tokens);
            setCurrentSlotId(slot.id);

            // 3. 서버 게임 세션 초기화 (새 게임만!)
            try {
                await fetchStaticStats();
                console.log('[InitNewGame] Static stats & session initialized');
            } catch (err) {
                console.warn('[InitNewGame] fetchStaticStats failed:', err);
            }

            // 4. 로컬 정적 데이터 로드
            loadLocalStaticData();

            // 5. 서버 데이터 fetch
            // 새 게임: fetchTutorialStatus 호출 안 함 (새 계정엔 레코드 없어서 404)
            await Promise.all([
                fetchStats(),
                fetchMapData(),
                fetchInventoryData(),
            ]);
            setIsTutorialCompleted(false); // 새 게임은 항상 미완료

            setGameInitialized(true);
            console.log('[InitNewGame] Done. Slot:', slot.id);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 기존 세이브 로드: 슬롯 토큰 활성화 → 데이터 로드 (fetchStaticStats 호출 안 함)
     * @param {string} slotId
     */
    const loadGame = async (slotId) => {
        setIsLoading(true);
        try {
            const slots = getSaveSlots();
            const slot = slots.find(s => s.id === slotId);
            if (!slot) throw new Error(`Slot not found: ${slotId}`);

            // 1. 슬롯 토큰 활성화 (sessionStorage)
            activateSlot(slot);
            setCurrentSlotId(slotId);

            // 2. 로컬 정적 데이터 로드
            loadLocalStaticData();

            // 3. 서버 데이터 fetch (fetchStaticStats 호출 안 함!)
            const [, , , tutorialRes] = await Promise.all([
                fetchStats(),
                fetchMapData(),
                fetchInventoryData(),
                fetchTutorialStatus().catch(() => ({ isCompleted: false })),
            ]);
            if (tutorialRes && tutorialRes.isCompleted !== undefined) {
                setIsTutorialCompleted(tutorialRes.isCompleted);
            }

            // 4. lastPlayedAt 갱신
            touchSaveSlot(slotId);

            setGameInitialized(true);
            console.log('[LoadGame] Done. Slot:', slotId);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await fetchGameStats();
            console.log('Fetched Stats (raw):', data);
            const mapped = mapServerStats(data);
            console.log('Fetched Stats (mapped):', mapped);
            setStats(mapped);
        } catch (error) {
            console.error('Failed to fetch game stats:', error);
        }
    };

    const fetchInventoryData = async () => {
        try {
            const data = await fetchInventory();
            console.log('Fetched Inventory (raw):', data);
            setStats(prev => ({ ...prev, inventory: data.items || data.inventory || prev.inventory }));
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        }
    };

    /**
     * 로컬 정적 데이터 로드 (NPC, 스케줄, 아이템)
     */
    const loadLocalStaticData = () => {
        setGameData(prev => ({
            ...prev,
            npcData: getNpcDataResolved(),
            scheduleData: NPC_SCHEDULE,
            itemData: ITEM_DEFINITIONS,
        }));
    };

    /**
     * 서버에서 맵 데이터 fetch
     */
    const extractFloorArray = (mapResponse) => {
        if (Array.isArray(mapResponse)) return mapResponse;
        if (mapResponse && Array.isArray(mapResponse.floors)) return mapResponse.floors;
        if (mapResponse && Array.isArray(mapResponse.data)) return mapResponse.data;
        if (mapResponse && Array.isArray(mapResponse.items)) return mapResponse.items;
        return [];
    };

    const resolveMapAssetPath = (assetValue, wrapAsCssUrl = false) => {
        if (!assetValue || typeof assetValue !== 'string') return null;

        const value = assetValue.trim();
        if (!value) return null;
        if (value.startsWith('url(')) return value;

        const isAbsolute = /^(https?:)?\/\//.test(value) || value.startsWith('/') || value.startsWith('data:');
        const resolvedPath = isAbsolute ? value : `${MAP_ROOT}${value}`;
        return wrapAsCssUrl ? `url(${resolvedPath})` : resolvedPath;
    };

    const normalizeRoom = (room) => {
        const roomId = room?.id || room?.room_id || room?.roomId || null;
        const activeZones = Array.isArray(room?.activeZones)
            ? room.activeZones
            : (Array.isArray(room?.active_zones) ? room.active_zones : []);

        return {
            ...room,
            id: roomId,
            activeZones,
            background: resolveMapAssetPath(room?.background || room?.background_url || room?.backgroundUrl, true),
        };
    };

    const normalizeFloor = (floor) => {
        const rooms = Array.isArray(floor?.rooms)
            ? floor.rooms
            : (Array.isArray(floor?.room_list) ? floor.room_list : []);

        return {
            ...floor,
            id: floor?.id || floor?.floor_id || floor?.floorId || null,
            mapImage: resolveMapAssetPath(floor?.mapImage || floor?.map_image || floor?.mapUrl || floor?.map_url),
            rooms: rooms.map(normalizeRoom),
        };
    };

    const fetchMapData = async () => {
        try {
            const mapResponse = await fetchAllMaps();
            let floorArray = extractFloorArray(mapResponse);

            if (floorArray.length === 0) {
                console.warn('[MapData] /api/v1/map/ returned no floors. Retrying /api/v1/map/{floor_id}...');
                const fallbackFloors = await Promise.all(
                    CANDIDATE_FLOOR_IDS.map(async (floorId) => {
                        try {
                            return await fetchFloor(floorId);
                        } catch (error) {
                            return null;
                        }
                    })
                );
                floorArray = fallbackFloors.filter(Boolean);
            }

            const resolvedFloorData = floorArray
                .map(normalizeFloor)
                .filter(floor => !!floor.id);

            const resolvedMapData = {};
            resolvedFloorData.forEach(floor => {
                (floor.rooms || []).forEach(room => {
                    if (room.id) resolvedMapData[room.id] = room;
                });
            });

            if (Object.keys(resolvedMapData).length === 0) {
                throw new Error('Map API returned 0 rooms after normalization.');
            }

            setGameData(prev => ({
                ...prev,
                mapData: resolvedMapData,
                floorData: resolvedFloorData,
            }));
            console.log('[Init] Map data loaded:', resolvedFloorData.length, 'floors,', Object.keys(resolvedMapData).length, 'rooms');
        } catch (error) {
            console.error('[MapData] Failed to fetch map data:', error);
            setGameData(prev => ({
                ...prev,
                mapData: {},
                floorData: [],
            }));
            throw error;
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

    // === Day / Period System ===
    const PERIOD_ORDER = ['morning', 'afternoon', 'evening', 'night'];
    const PERIOD_LABELS = { morning: '아침', afternoon: '오후', evening: '저녁', night: '심야' };
    const PERIOD_CLOCK = { morning: '08:00', afternoon: '14:00', evening: '20:00', night: '24:00' };

    // === HP Action Cost System ===
    const ACTION_COSTS = {
        move: 1,
        interact: 1,
        item: 1,
        npcChat: 10,
        eavesdrop: 1,
        eavesdropContinue: 5,
        eavesdropJoin: 10,
    };

    const SECTION_TRANSITIONS = {
        morning: { next: 'afternoon', message: '점심 시간입니다. 식당으로 이동해 오후 일정을 시작합니다.', targetRoom: 'cafeteria' },
        afternoon: { next: 'evening', message: '저녁 시간입니다. 진리 학습실로 이동합니다.', targetRoom: 'b3_hall' },
        evening: { next: 'night', message: '심야 시간입니다. 각자의 방으로 돌아가 취침을 준비합니다.', targetRoom: 'room001' }, // 곽빙어의 방(001호)
        night: { next: null, message: '더 이상 행동할 수 없다.', targetRoom: 'room001' },
    };

    const getPeriodFromHp = (hp) => {
        if (hp <= 0) return null; // 행동 불가
        if (hp <= 10) return 'night';
        if (hp <= 40) return 'evening';
        if (hp <= 70) return 'afternoon';
        return 'morning';
    };



    const setDay = (day) => updateStatsBackend({ currentDay: Math.max(0, Math.min(5, day)) });
    const setPeriod = (period) => updateStatsBackend({ currentPeriod: period });

    /**
     * 시간대 전진: morning→afternoon→evening→night→(다음날 morning + day+1)
     */
    const advancePeriod = () => {
        const currentIdx = PERIOD_ORDER.indexOf(stats.currentPeriod);
        if (currentIdx < PERIOD_ORDER.length - 1) {
            // 같은 날 다음 시간대
            updateStatsBackend({ currentPeriod: PERIOD_ORDER[currentIdx + 1] });
        } else {
            // night → 다음 날 morning
            const nextDay = Math.min(stats.currentDay + 1, 5);
            updateStatsBackend({ currentDay: nextDay, currentPeriod: 'morning', hp: 100, plusHp: 0 });
        }
    };

    /**
     * 현재 방에 rest 존이 있는지 확인
     */
    const currentRoomHasRest = () => {
        const roomId = currentLocationInfo?.roomId;
        if (!roomId) return false;
        const roomData = gameData.mapData?.[roomId];
        return roomData?.activeZones?.some(z => z.type === 'rest') ?? false;
    };

    /** plusHp 최대 수용량 (한 섹션에서 보존 가능한 최대치) */
    const PLUS_HP_CAP = 30;

    /**
     * HP 소비 시 섹션 전환 여부를 미리 확인
     * @param {number} cost - 소모할 HP
     * @returns {{ willTransition: boolean, fromPeriod: string, toPeriod: string|null, newHp: number } | null}
     */
    const getHpCostPreview = (cost) => {
        const baseHp = stats.hp;
        const currentPlus = stats.plusHp || 0;
        const totalHp = baseHp + currentPlus;
        if (totalHp < cost) return null; // can't afford

        let remainingCost = cost;
        let tmpPlus = currentPlus;
        if (tmpPlus > 0) {
            const fromPlus = Math.min(remainingCost, tmpPlus);
            tmpPlus -= fromPlus;
            remainingCost -= fromPlus;
        }
        const newHp = baseHp - remainingCost;
        const currentPer = stats.currentPeriod;
        const newPer = newHp <= 0 ? null : getPeriodFromHp(newHp);

        return {
            willTransition: newHp <= 0 || (newPer && newPer !== currentPer),
            fromPeriod: currentPer,
            toPeriod: newHp <= 0 ? 'morning' : newPer,
            newHp,
        };
    };

    /**
     * 백엔드 API를 사용하는 HP 소모 함수
     * UI 단에서 getHpCostPreview()를 통해 섹션 전환 경고 이후에 호출되는 것으로,
     * 백엔드가 돌려주는 transitionEvent가 있으면 오버레이를 켭니다.
     * @param {number} cost - 소모할 HP
     * @returns {Promise<boolean>} 성공 여부
     */
    const spendHp = async (cost) => {
        const baseHp = stats.hp;
        const currentPlus = stats.plusHp || 0;
        const totalHp = baseHp + currentPlus;

        if (totalHp < cost) return false;

        try {
            const result = await spendHpBackend(cost);
            // 백엔드에서 반환한 플래그(transitionEvent)가 있는 경우 트랜지션 모달 작동
            if (result.transitionEvent) {
                const penalty = currentRoomHasRest() ? 0 : 5;
                setSectionTransition({
                    message: result.transitionEvent.message,
                    targetRoom: SECTION_TRANSITIONS[stats.currentPeriod]?.targetRoom || 'room001',
                    nextPeriod: result.transitionEvent.next,
                    // 백엔드에서 온 데이터에 바로 반영하지만 로컬 ui penalty 처리가 있다면 덧붙임
                    penalty: penalty > 0 ? { amount: penalty, message: '피곤하다...' } : null,
                });
                // Sync data slightly penalized
                const adjustedHp = Math.max(0, result.global.hp - penalty);
                syncStats({ ...result.global, hp: adjustedHp, plusHp: 0 });
            } else {
                syncStats(result.global);
            }
            setActiveConversationNpcId(null);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    /**
     * 백엔드 API를 사용하는 휴식 함수
     */
    const rest = async () => {
        try {
            const result = await restBackend();
            if (result.transitionEvent) {
                setSectionTransition({
                    message: result.transitionEvent.message,
                    targetRoom: SECTION_TRANSITIONS[stats.currentPeriod]?.targetRoom || 'room001',
                    nextPeriod: result.transitionEvent.next,
                });
            }
            syncStats(result.global);
            setActiveConversationNpcId(null);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    /**
     * 섹션 전환 완료 로직
     * (이미 백엔드에서 전환된 state를 받았고, UI 단 모달만 닫음)
     */
    const completeSectionTransition = () => {
        setSectionTransition(null);
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

    const addItem = async (itemId) => {
        console.log("Adding item API:", itemId);
        try {
            // Optimistic
            const currentInventory = stats.inventory || [];
            if (!currentInventory.includes(itemId)) {
                setStats(prev => ({ ...prev, inventory: [...currentInventory, itemId] }));
            }
            const res = await addItemAPI(itemId);
            if (res && res.items) {
                syncStats({ inventory: res.items });
            }
        } catch (err) {
            console.error("Failed to add item API:", err);
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
    const useItem = async (item) => {
        if (!item?.consumable) {
            console.warn('Cannot use non-consumable item:', item?.id);
            return false;
        }
        if (!(stats.inventory || []).includes(item.id)) {
            console.warn('Item not in inventory:', item.id);
            return false;
        }

        try {
            // Optimistic update
            const newInv = (stats.inventory || []).filter(id => id !== item.id);
            const newFishLevel = item.effect?.fishLevel ? Math.min(100, (stats.fishLevel || 0) + item.effect.fishLevel) : stats.fishLevel;
            setStats(prev => ({ ...prev, inventory: newInv, fishLevel: newFishLevel }));

            const res = await consumeItemAPI(item.id);
            if (res) {
                // Determine structure based on backend response
                if (res.global) syncStats(res.global);
                else {
                    const mapped = {
                        inventory: res.items || res.inventory || newInv,
                        fishLevel: res.fishLevel ?? res.fish_level ?? newFishLevel
                    };
                    if (res.total_hp !== undefined) mapped.hp = res.total_hp;
                    if (res.session_hp !== undefined) mapped.sessionHp = res.session_hp;
                    syncStats(mapped);
                }
            }
            return true;
        } catch (err) {
            console.error('Failed to use item API:', err);
            return false;
        }
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

    const completeTutorial = async () => {
        try {
            await completeTutorialAPI();
            setIsTutorialCompleted(true);
        } catch (error) {
            console.error("Failed to complete tutorial:", error);
        }
    };

    const value = {
        // Expose all stats directly
        ...stats,

        isTutorialCompleted,
        completeTutorial,

        // Expose Game Data
        npcData: gameData.npcData,
        mapData: gameData.mapData,
        floorData: gameData.floorData,
        scheduleData: gameData.scheduleData,
        isLoading,

        // Day / Period System
        currentDay: stats.currentDay ?? 0,
        currentPeriod: stats.currentPeriod ?? 'morning',
        plusHp: stats.plusHp ?? 0,
        PERIOD_LABELS,
        PERIOD_CLOCK,
        PERIOD_ORDER,
        setDay,
        setPeriod,
        advancePeriod,
        getNpcsForRoom,

        // HP Action Cost System
        ACTION_COSTS,
        PLUS_HP_CAP,
        spendHp,
        getHpCostPreview,
        rest,
        sectionTransition,
        completeSectionTransition,
        activeConversationNpcId,
        setActiveConversationNpcId,

        // Expose setters
        setFishLevel,
        setUmiLevel,
        setHp,
        setTrust,

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
        updateStatsBackend,

        // Save Slot System
        gameInitialized,
        currentSlotId,
        initNewGame,
        loadGame,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};
