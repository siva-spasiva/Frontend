import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchGameStats, updateGameStats, transferItem, spendHpBackend, restBackend, fetchStaticStats } from '../api/stats';
import { loginNewSave, createSaveSlot, activateSlot, touchSaveSlot, getSaveSlots, setTokens } from '../api/auth';
import { fetchAllMaps, fetchFloor } from '../api/map';
import { fetchInventory, addItemAPI, consumeItemAPI } from '../api/inventory';
import { getNpcDataResolved } from '../data/npcData';
import NPC_SCHEDULE from '../data/npcSchedule';
import { ITEM_DEFINITIONS } from '../data/items';
import { endSession } from '../api/chat';

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
const DEFAULT_INVENTORY_IDS = ['item001', 'item002', 'item003'];

const mergeDefaultInventoryIds = (ids = []) => {
    return [...new Set([...DEFAULT_INVENTORY_IDS, ...ids])];
};

const normalizeInventoryIds = (rawInventory) => {
    if (!Array.isArray(rawInventory)) return null;

    const ids = rawInventory
        .map((entry) => {
            if (typeof entry === 'string') return entry;
            if (!entry || typeof entry !== 'object') return null;

            const itemId = entry.id ?? entry.item_id ?? null;
            if (!itemId || typeof itemId !== 'string') return null;
            if (entry.owned === false) return null;
            return itemId;
        })
        .filter(Boolean);

    const normalizedIds = [...new Set(ids)];
    const mergedIds = mergeDefaultInventoryIds(normalizedIds);

    const missingDefaultIds = DEFAULT_INVENTORY_IDS.filter((id) => !normalizedIds.includes(id));
    if (missingDefaultIds.length > 0) {
        console.warn('[Inventory] Backend response missing default items:', missingDefaultIds);
    }

    return mergedIds;
};


const GameContext = createContext();

// Removed local URL constants in favor of API adapter


export const useGame = () => {
    return useContext(GameContext);
};

export const GameProvider = ({ children }) => {
    // Stats State
    const [stats, setStats] = useState({
        fishLevel: 0,
        hp: 100,
        plusHp: 0,
        trust: 10,
        currentDay: 0,
        currentPeriod: 'morning',
        npcStats: {},
        inventory: DEFAULT_INVENTORY_IDS,
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
            updateStatsBackend({
                inventory: newInv,
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
    const mapServerStats = (data, fallbackInventory = DEFAULT_INVENTORY_IDS) => {
        const normalizedInventory = normalizeInventoryIds(data?.inventory);
        const result = {
            fishLevel: data.fishLevel ?? data.fish_level ?? 0,
            hp: data.total_hp ?? data.hp ?? 100,
            sessionHp: data.session_hp ?? 30,
            plusHp: data.plus_hp ?? data.plusHp ?? 0,
            trust: data.trust ?? 10,
            currentDay: data.current_day ?? data.currentDay ?? 0,
            currentPeriod: data.current_session ?? data.currentPeriod ?? 'morning',
            inventory: normalizedInventory ?? data.inventory ?? fallbackInventory,
            floorId: data.floor_id ?? null,
            roomId: data.room_id ?? null,
        };
        // npcStats는 서버가 실제로 반환한 경우에만 포함 (실서버 StatsResponse에는 npcStats 필드 없음)
        if (data.npcStats !== undefined) {
            result.npcStats = data.npcStats;
        }
        return result;
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
            await Promise.all([
                fetchStats(),
                fetchMapData(),
                fetchInventoryData(),
            ]);

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
            await Promise.all([
                fetchStats(),
                fetchMapData(),
                fetchInventoryData(),
            ]);

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
            setStats(prev => {
                const mapped = mapServerStats(data, prev.inventory);
                console.log('Fetched Stats (mapped):', mapped);
                return { ...prev, ...mapped };
            });
            // 서버에서 위치 정보가 있으면 currentLocationInfo 동기화
            const serverFloorId = data.floor_id ?? null;
            const serverRoomId = data.room_id ?? null;
            if (serverFloorId || serverRoomId) {
                setCurrentLocationInfo(prev => ({
                    ...prev,
                    floorId: serverFloorId ?? prev?.floorId ?? null,
                    roomId: serverRoomId ?? prev?.roomId ?? null,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch game stats:', error);
        }
    };

    const fetchInventoryData = async () => {
        try {
            const data = await fetchInventory();
            console.log('Fetched Inventory (raw):', data);
            const normalizedInventory = normalizeInventoryIds(data?.items ?? data?.inventory);
            setStats(prev => ({
                ...prev,
                inventory: normalizedInventory ?? prev.inventory,
            }));
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
            setStats(prev => ({
                ...prev,
                ...mapServerStats(newFullData || {}, prev.inventory),
                npcStats: newFullData?.npcStats ?? prev.npcStats,
            }));

        } catch (error) {
            console.error("Failed to update stats:", error);
            // Ideally rollback optimistic update here
        }
    };

    // Sync without backend call (used when backend already returned updated stats)
    const syncStats = (newStats) => {
        console.log("Syncing Stats:", newStats);
        setStats(prev => ({
            ...prev,
            ...newStats,
            inventory: normalizeInventoryIds(newStats?.inventory) ?? newStats?.inventory ?? prev.inventory,
        }));
    };

    // Helper functions maintaining original API
    const updateHp = (amount) => updateStatsBackend({ hp: stats.hp + amount });
    // const updateTrust = (amount) => updateStatsBackend({ trust: stats.trust + amount }); // Removed
    const updateFishLevel = (amount) => updateStatsBackend({ fishLevel: stats.fishLevel + amount });

    // Explicit setters if needed
    const setFishLevel = (val) => updateStatsBackend({ fishLevel: typeof val === 'function' ? val(stats.fishLevel) : val });
    const setHp = (val) => updateStatsBackend({ hp: typeof val === 'function' ? val(stats.hp) : val });
    const setTrust = (val) => updateStatsBackend({ trust: typeof val === 'function' ? val(stats.trust) : val });

    // === Day / Period System ===
    const PERIOD_ORDER = ['morning', 'afternoon', 'evening', 'night'];
    const PERIOD_LABELS = { morning: '아침', afternoon: '오후', evening: '저녁', night: '심야' };
    const PERIOD_CLOCK = { morning: '08:00', afternoon: '14:00', evening: '20:00', night: '24:00' };
    const PERIOD_TO_INDEX = { morning: 1, afternoon: 2, evening: 3, night: 4 };

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
        morning: { next: 'afternoon', message: '점심 시간입니다. 식당으로 이동합니다.', targetRoom: 'cafeteria' },
        afternoon: { next: 'evening', message: '저녁 시간입니다. 진리의 방으로 이동합니다.', targetRoom: 'truth_room001' },
        evening: { next: 'night', message: '심야 시간입니다. 예배당으로 이동합니다.', targetRoom: 'chapel' },
        night: { next: null, message: '더 이상 행동할 수 없다.', targetRoom: 'room001' }, // 다음 날 아침엔 자신의 방
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
     * 프론트엔드 주도: HP 계산과 세션 전환 모두 프론트에서 수행한다.
     * backend의 session_hp / transitionEvent / total_hp 에 의존하지 않는다.
     * @param {number} cost - 소모할 HP
     * @returns {Promise<{success:boolean, transitioned:boolean}|false>}
     */
    const spendHp = async (cost) => {
        const baseHp = stats.hp;
        const currentPlus = stats.plusHp || 0;
        const totalHp = baseHp + currentPlus;

        if (totalHp < cost) return false;

        // Frontend-authoritative HP calculation
        let remainingCost = cost;
        let newPlus = currentPlus;
        if (newPlus > 0) {
            const fromPlus = Math.min(remainingCost, newPlus);
            newPlus -= fromPlus;
            remainingCost -= fromPlus;
        }
        const newHp = Math.max(0, baseHp - remainingCost);

        const currentPer = stats.currentPeriod;
        const detectedPer = getPeriodFromHp(newHp);

        // Frontend-driven transition detection via HP thresholds
        const willTransition = detectedPer === null || (detectedPer !== currentPer);

        if (willTransition) {
            const transitionInfo = SECTION_TRANSITIONS[currentPer] || {};
            const nextPeriod = transitionInfo.next || 'morning';
            const penalty = currentRoomHasRest() ? 0 : 5;
            const adjustedHp = penalty > 0 ? Math.max(0, newHp - penalty) : newHp;

            // Tell backend to advance session (resets session_hp)
            try {
                await endSession({
                    dayIndex: stats.currentDay,
                    sessionIndex: PERIOD_TO_INDEX[currentPer] || 1,
                });
            } catch (e) {
                console.warn('endSession call failed during transition:', e);
            }

            syncStats({
                hp: adjustedHp,
                plusHp: 0,
                currentPeriod: nextPeriod,
            });

            setSectionTransition({
                message: transitionInfo.message || '시간이 흘러갑니다...',
                targetRoom: transitionInfo.targetRoom || 'room001',
                nextPeriod,
                penalty: penalty > 0 ? { amount: penalty, message: '피곤하다...' } : null,
            });

            setActiveConversationNpcId(null);
            return { success: true, transitioned: true };
        }

        // No transition — inform backend of HP spend
        try {
            await spendHpBackend(cost);
        } catch (error) {
            console.warn('spendHpBackend failed, proceeding with frontend HP:', error);
        }

        syncStats({ hp: newHp, plusHp: newPlus });
        setActiveConversationNpcId(null);
        return { success: true, transitioned: false };
    };

    /**
     * 휴식 함수: 즉시 endSession을 호출하여 다음 시간대로 전환한다.
     * room001의 침대 등 rest 존과 상호작용 시 호출됨.
     */
    const rest = async () => {
        try {
            const currentPer = stats.currentPeriod;
            const transitionInfo = SECTION_TRANSITIONS[currentPer] || {};
            const nextPeriod = transitionInfo.next || 'morning';

            // 백엔드에 세션 종료 알림
            try {
                await endSession({
                    dayIndex: stats.currentDay,
                    sessionIndex: PERIOD_TO_INDEX[currentPer] || 1,
                });
            } catch (e) {
                console.warn('endSession call failed during rest:', e);
            }

            // night → 다음 날 morning, HP 리셋
            const isNight = currentPer === 'night';
            const nextDay = isNight ? Math.min(stats.currentDay + 1, 5) : stats.currentDay;
            const nextHp = isNight ? 100 : stats.hp; // night 후에는 완전 회복

            syncStats({
                hp: nextHp,
                plusHp: 0,
                currentPeriod: isNight ? 'morning' : nextPeriod,
                currentDay: nextDay,
            });

            setSectionTransition({
                message: transitionInfo.message || '잠시 눈을 붙였습니다...',
                targetRoom: transitionInfo.targetRoom || 'room001',
                nextPeriod: isNight ? 'morning' : nextPeriod,
            });

            setActiveConversationNpcId(null);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    /**
     * 섹션 전환 완료 로직
     * 전환 데이터를 반환한 후 모달을 닫음. 호출부에서 targetRoom으로 이동 처리.
     */
    const completeSectionTransition = () => {
        const data = sectionTransition;
        setSectionTransition(null);
        return data;
    };

    /**
     * 외부(MainGameScene의 커스텀 조건 등)에서 수동으로 엔드세션을 호출하고 모달을 띄움
     * (채팅이나 엿듣기가 종료된 시점에 HP 임계값을 채웠을 경우 사용)
     */
    const triggerEndSession = async (npcId = null) => {
        try {
            const endSessionResult = await endSession({
                dayIndex: stats.currentDay,
                sessionIndex: PERIOD_TO_INDEX[stats.currentPeriod] || 1,
                npcId: npcId,
            });
            const after = await fetchGameStats();
            
            const advance = endSessionResult?.advance;
            if (advance) {
                setSectionTransition({
                    message: advance.message || endSessionResult?.message || '일정이 끝났습니다.',
                    targetRoom: SECTION_TRANSITIONS[stats.currentPeriod]?.targetRoom || 'room001',
                    nextPeriod: advance.current_session || null,
                });
            }
            syncStats(mapServerStats(after));
            return true;
        } catch(e) {
            console.error('triggerEndSession failed:', e);
            return false;
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

    const addItem = async (itemId) => {
        console.log("Adding item API:", itemId);
        try {
            // Optimistic
            const currentInventory = stats.inventory || [];
            if (!currentInventory.includes(itemId)) {
                setStats(prev => ({ ...prev, inventory: [...currentInventory, itemId] }));
            }
            const res = await addItemAPI(itemId);
            if (res && (res.items || res.inventory)) {
                const normalizedInventory = normalizeInventoryIds(res.items ?? res.inventory);
                if (normalizedInventory) {
                    syncStats({ inventory: normalizedInventory });
                }
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
                    const normalizedInventory = normalizeInventoryIds(res.items ?? res.inventory);
                    const mapped = {
                        inventory: normalizedInventory ?? newInv,
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
        .map(entry => (typeof entry === 'string' ? entry : entry?.id))
        .filter(Boolean)
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
            const normalizedInventory = normalizeInventoryIds(data?.inventory);
            setStats(prev => ({
                ...prev,
                ...data,
                inventory: normalizedInventory ?? prev.inventory,
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
            const normalizedInventory = normalizeInventoryIds(data?.inventory);
            setStats(prev => ({
                ...prev,
                ...data,
                inventory: normalizedInventory ?? prev.inventory,
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
            await endSession({ dayIndex: 0, sessionIndex: 1 });
            
            // 튜토리얼 종료 후 로컬 정보 동기화를 위해 스탯 재조회
            const updated = await fetchGameStats();
            syncStats(mapServerStats(updated));
        } catch (error) {
            console.error("Failed to complete tutorial:", error);
        }
    };

    const value = {
        // Expose all stats directly
        ...stats,

        isTutorialCompleted: (stats.currentDay ?? 0) >= 1,
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
        triggerEndSession,
        sectionTransition,
        completeSectionTransition,
        activeConversationNpcId,
        setActiveConversationNpcId,

        // Expose setters
        setFishLevel,
        setHp,
        setTrust,

        // Expose updaters
        updateHp,
        updateTrust: (amount) => updateStatsBackend({ trust: stats.trust + amount }), // Re-enabled
        updateFishLevel,
        incrementFishLevel,
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
