import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useViewMode } from '../hooks/useViewMode';
import { sendChatMessage } from '../api/chat';
import { fetchRoom } from '../api/map';
import { startConversation, replyConversation, eavesdropMore, eavesdropRoom } from '../api/chat';
import { updateLocationStats } from '../api/stats';
import GameHUD from '../components/GameHUD';
import MapInteractiveLayer from '../components/MapInteractiveLayer';
import { useInteraction } from '../hooks/useInteraction';
import NavigationConfirmation from '../components/NavigationConfirmation';
import ItemPickupModal from '../components/ItemPickupModal';
import RequirementModal from '../components/RequirementModal';
import FishEyeEffect from '../components/FishEyeEffect';
import SectionTransitionOverlay from '../components/SectionTransitionOverlay';
import HpWarningModal from '../components/HpWarningModal';
import useFishVisuals from '../hooks/useFishVisuals';
import IngameSidebarMenu from '../components/IngameSidebarMenu';
import MapContainer from '../components/MapContainer';
import PortraitDisplay from '../components/PortraitDisplay';
import InteractionPopup from '../components/InteractionPopup';
import { EAVESDROP_MAX_COLOR_COUNT, getEavesdropColorIndexFromText, getEavesdropColorStyle } from '../utils/eavesdropColors';

const PERIOD_TO_INDEX = {
    morning: 1,
    afternoon: 2,
    evening: 3,
    night: 4,
};

const MAX_EAVESDROP_PARTICIPANTS = 5;

const normalizeNpcIds = (roomPayload) => {
    const fromRoom = Array.isArray(roomPayload?.room?.npcIds) ? roomPayload.room.npcIds : [];
    const fromNpcs = Array.isArray(roomPayload?.npcs)
        ? roomPayload.npcs.map((npc) => {
            if (!npc) return null;
            if (typeof npc === 'string') return npc;
            return npc.id || npc.npc_id || null;
        })
        : [];

    return [...new Set([...fromRoom, ...fromNpcs].filter(Boolean))];
};

const normalizeNpcDetailMap = (roomPayload) => {
    const map = {};
    const npcList = Array.isArray(roomPayload?.npcs) ? roomPayload.npcs : [];
    npcList.forEach((npc) => {
        if (!npc || typeof npc === 'string') return;
        const id = npc.id || npc.npc_id;
        if (!id) return;
        map[id] = {
            id,
            name: npc.name || npc.label || id,
            ...npc,
        };
    });
    return map;
};

const normalizeConversationPayload = (payload) => {
    if (Array.isArray(payload)) {
        return payload[0] || null;
    }
    return payload || null;
};

const MainGameScene = () => {
    // viewMode: 'full' (Logs + Dialog + Input), 'mini' (Dialog + Input), 'hidden' (Button only)
    const { viewMode, setViewMode, handleToggleHidden, handleToggleExpand } = useViewMode('mini');
    const [inputText, setInputText] = useState('');

    // GameContext에서 현재 진행 상태를 받아옴 (튜토리얼 종료 후 설정된 위치 등)
    const { syncStats, npcData, npcStats, mapData, floorData, currentLocationInfo, setCurrentLocationInfo, addItem, ITEMS, inventory: currentInventory, currentDay, currentPeriod, spendHp, rest, triggerEndSession, ACTION_COSTS, getHpCostPreview, PERIOD_LABELS, fishLevel, hp, presentedItem, clearPresentation, setActiveNpcInField } = useGame();

    // Active Room State - Context
    const [currentRoomId, setCurrentRoomId] = useState(currentLocationInfo?.roomId || 'room001');
    const [roomApiNpcIds, setRoomApiNpcIds] = useState([]);
    const [roomApiNpcMap, setRoomApiNpcMap] = useState({});
    const [roomTopic, setRoomTopic] = useState(null);
    const [roomSingleNpc, setRoomSingleNpc] = useState(null);
    const [roomPayload, setRoomPayload] = useState(null);
    const [pendingEavesdropTarget, setPendingEavesdropTarget] = useState(null); // { floorId, roomId, payload }
    const [eavesdropNpcIds, setEavesdropNpcIds] = useState([]);
    const [eavesdropTopic, setEavesdropTopic] = useState(null);
    const [eavesdropHistory, setEavesdropHistory] = useState([]);

    // History logs & Dialog handled by useInteraction hook
    const {
        logs,
        dialogContent,
        handleInteraction,
        pendingMove,
        confirmMove,
        cancelMove,
        pendingItem,
        resolveItem,
        pendingRequirement,
        setPendingRequirement,
        resolveRequirement,
        pendingInfoPopup,
        resolveInfoPopup,
        setDialogContent,
        setLogs,
        pendingHpWarning,
        confirmHpWarning,
        cancelHpWarning,
    } = useInteraction({
        viewMode,
        setViewMode,
        onMove: handleMove,
        onMovePreCheck: handleMovePreCheck,
        inventory: currentInventory, // Pass current inventory to check for existing items
        stats: { fishLevel, hp }, // Pass stats for interaction checks
        spendHp,
        rest,
        ACTION_COSTS,
        getHpCostPreview,
        PERIOD_LABELS,
        itemInteractionMode: 'popup',
    });

    const findFloorIdByRoom = (roomId) => {
        const floor = floorData?.find((f) => f.rooms?.some((r) => r.id === roomId));
        return floor?.id || null;
    };

    const buildRequirement = (rawRequirement) => {
        if (!rawRequirement) return null;

        if (typeof rawRequirement === 'string') {
            return {
                type: 'item',
                targetId: rawRequirement,
                message: '잠겨있다. 필요한 물건이 있어 보인다.',
            };
        }

        if (rawRequirement.type === 'item' && rawRequirement.targetId) {
            return {
                type: 'item',
                targetId: rawRequirement.targetId,
                message: rawRequirement.message || '잠겨있다. 필요한 물건이 있어 보인다.',
            };
        }

        return null;
    };

    const extractMoveRequirement = (moveZone, targetRoomPayload) => {
        const zoneRequirement = buildRequirement(moveZone?.locked);
        if (zoneRequirement) return zoneRequirement;

        const roomRequirement = buildRequirement(
            targetRoomPayload?.room?.locked
            || targetRoomPayload?.locked
            || targetRoomPayload?.required_item
            || targetRoomPayload?.requiredItem
            || targetRoomPayload?.required_item_id
            || targetRoomPayload?.requiredItemId,
        );

        return roomRequirement;
    };

    const applyRoomPayload = (payload) => {
        setRoomPayload(payload || null);
        setRoomApiNpcIds(normalizeNpcIds(payload));
        setRoomApiNpcMap(normalizeNpcDetailMap(payload));
        setRoomTopic(payload?.topic || null);
        setRoomSingleNpc(payload?.single_npc || null);
    };

    const getNpcName = (npcId) => {
        if (!npcId) return null;
        return npcData?.[npcId]?.name
            || roomApiNpcMap?.[npcId]?.name
            || roomSingleNpc?.name
            || npcId;
    };

    const resolveEavesdropColorIndex = useCallback((participantIds = [], speakerId = null, speakerName = '') => {
        if (speakerId) {
            const idIndex = participantIds.findIndex((id) => id === speakerId);
            if (idIndex >= 0) return idIndex % EAVESDROP_MAX_COLOR_COUNT;
        }

        if (speakerName) {
            const byNameIndex = participantIds.findIndex((id) => (getNpcName(id) || id) === speakerName);
            if (byNameIndex >= 0) return byNameIndex % EAVESDROP_MAX_COLOR_COUNT;
            return getEavesdropColorIndexFromText(speakerName, EAVESDROP_MAX_COLOR_COUNT);
        }

        return 0;
    }, [getNpcName]);

    const createEavesdropLog = useCallback(({
        id,
        speakerId = null,
        speakerName = 'NPC',
        text = '',
        type = 'eavesdrop_listen',
        participantIds = [],
    }) => ({
        id,
        speaker: speakerName,
        text,
        type,
        eavesdropParticipantIndex: resolveEavesdropColorIndex(participantIds, speakerId, speakerName),
    }), [resolveEavesdropColorIndex]);

    const openEavesdropPreview = async (payload, fallbackNpcIds = null, roomInfo = null) => {
        const npcIds = (fallbackNpcIds && fallbackNpcIds.length > 0)
            ? fallbackNpcIds
            : normalizeNpcIds(payload);
        if (npcIds.length < 2) return;

        // 프론트에서 HP 1 차감 (엿듣기 프리뷰)
        const hpResult = await spendHp(ACTION_COSTS.eavesdrop);
        if (!hpResult) {
            setDialogContent({ speaker: 'System', text: '체력이 부족하다...', type: 'system' });
            return;
        }
        if (hpResult.transitioned) return;

        const participantIds = npcIds.slice(0, MAX_EAVESDROP_PARTICIPANTS);
        setEavesdropNpcIds(participantIds);
        setEavesdropTopic(payload?.topic || '주변 수군거림');
        setEavesdropLogs([]);
        setEavesdropDialogContent(null);
        setEavesdropState('preview');
        setIsEavesdropThinking(true);
        if (viewMode !== 'full') setViewMode('full');

        const eavesFloorId = roomInfo?.floorId || currentLocationInfo?.floorId;
        const eavesRoomId = roomInfo?.roomId || currentRoomId;

        try {
            let response;
            if (eavesFloorId && eavesRoomId) {
                try {
                    response = await eavesdropRoom(eavesFloorId, eavesRoomId);
                } catch (roomErr) {
                    console.warn('eavesdropRoom failed, fallback to startConversation:', roomErr.message);
                    response = await startConversation({
                        npcIds: participantIds,
                        topic: payload?.topic || null,
                        numTurns: 4,
                        dayIndex: currentDay || null,
                        session: currentPeriod || null,
                    });
                }
            } else {
                response = await startConversation({
                    npcIds: participantIds,
                    topic: payload?.topic || null,
                    numTurns: 4,
                    dayIndex: currentDay || null,
                    session: currentPeriod || null,
                });
            }

            const conversation = normalizeConversationPayload(response);
            const turns = Array.isArray(conversation?.turns) ? conversation.turns : [];
            const previewTurns = turns.filter((turn) => turn?.speaker_id !== 'user');
            const previewLogs = previewTurns.map((turn, index) => createEavesdropLog({
                id: `${Date.now()}_preview_${index}`,
                speakerId: turn.speaker_id || null,
                speakerName: getNpcName(turn.speaker_id) || turn.speaker || 'NPC',
                text: turn.content,
                type: 'eavesdrop_preview',
                participantIds,
            }));

            setEavesdropLogs(previewLogs);
            setEavesdropHistory(previewTurns);

            // NPC 스탯 캡처 + 턴 delta 누적
            if (conversation?.npc_states) {
                setChatNpcStats(conversation.npc_states);
            }
            accumulateDeltas(previewTurns);

            if (conversation?.topic) {
                setEavesdropTopic(conversation.topic);
            }

            if (previewLogs.length > 0) {
                setEavesdropDialogContent(previewLogs[previewLogs.length - 1]);
            } else {
                setEavesdropDialogContent({
                    speaker: 'System',
                    text: '들려오는 대화가 없다.',
                    type: 'system',
                });
            }
        } catch (error) {
            console.error('Failed to start eavesdrop preview:', error);
            setEavesdropDialogContent({
                speaker: 'System',
                text: '엿듣기를 시작하지 못했다.',
                type: 'system',
            });
        } finally {
            setIsEavesdropThinking(false);
            setEavesdropState('choice');
        }
    };

    // === executeMove: 실제 이동 로직 (위치 갱신 + room payload 적용) ===
    async function executeMove(targetId, targetFloorId, targetRoomPayload) {
        setCurrentRoomId(targetId);
        setCurrentLocationInfo({ floorId: targetFloorId, roomId: targetId });

        try {
            await updateLocationStats(targetFloorId, targetId);
        } catch (error) {
            console.warn('Failed to sync location stats:', error);
        }

        if (targetRoomPayload) {
            applyRoomPayload(targetRoomPayload);
        } else {
            applyRoomPayload(null);
        }
    }

    // === handleMovePreCheck: 이동 전 사전 검사 (엿듣기 감지, 잠금 확인) ===
    // 순수 검사만 수행, 부수효과 없음 (결과 객체 반환)
    async function handleMovePreCheck(targetId, moveZone) {
        const targetFloorId = findFloorIdByRoom(targetId);
        if (!targetFloorId) {
            return { result: 'blocked', message: '이동할 수 없는 위치입니다.' };
        }

        let targetRoomPayload = null;
        try {
            targetRoomPayload = await fetchRoom(targetFloorId, targetId);
        } catch (error) {
            console.warn('Room fetch failed during pre-check:', error);
            return { result: 'normal' };
        }

        const requirement = extractMoveRequirement(moveZone, targetRoomPayload);
        if (requirement && !currentInventory?.includes(requirement.targetId)) {
            return {
                result: 'blocked',
                requirement,
                message: requirement.message || '잠겼습니다.',
            };
        }

        const npcs = normalizeNpcIds(targetRoomPayload);
        if (npcs.length >= 2) {
            return { result: 'eavesdrop', roomPayload: targetRoomPayload, npcs, targetFloorId };
        }

        return { result: 'normal' };
    }

    // === handleMove: 이동 요청 처리 (엿듣기 분기 포함) ===
    // options.cachedRoomPayload / cachedNpcs: preCheck에서 가져온 캐시 데이터
    async function handleMove(targetId, moveZone = null, options = {}) {
        const { cachedRoomPayload, cachedNpcs } = options;

        const targetFloorId = findFloorIdByRoom(targetId);
        if (!targetFloorId) {
            setDialogContent({ speaker: 'System', text: '이동할 수 없는 위치입니다.', type: 'system' });
            return false;
        }

        // 캐시된 데이터가 있으면 재사용, 없으면 새로 fetch
        let targetRoomPayload = cachedRoomPayload || null;
        if (!targetRoomPayload) {
            try {
                targetRoomPayload = await fetchRoom(targetFloorId, targetId);
            } catch (error) {
                console.warn('Room fetch failed before move:', error);
            }
        }

        // 캐시 경로가 아닐 때만 잠금 확인 (preCheck에서 이미 확인됨)
        if (!cachedRoomPayload) {
            const requirement = extractMoveRequirement(moveZone, targetRoomPayload);
            if (requirement && !currentInventory?.includes(requirement.targetId)) {
                setPendingRequirement(requirement);
                setDialogContent({
                    speaker: 'System',
                    text: requirement.message || '잠겼습니다.',
                    type: 'system',
                });
                return false;
            }
        }

        // HP는 useInteraction에서 이미 차감됨 (preCheck eavesdrop 또는 confirmMove)

        // NPC 2명 이상 → 이동 보류, 방 밖에서 엿듣기 프리뷰
        const npcs = cachedNpcs || normalizeNpcIds(targetRoomPayload);
        if (npcs.length >= 2) {
            setPendingEavesdropTarget({ floorId: targetFloorId, roomId: targetId, payload: targetRoomPayload });
            // room payload를 임시 적용 (버튼 표시용, 위치는 변경 안 함)
            applyRoomPayload(targetRoomPayload);
            await openEavesdropPreview(targetRoomPayload, npcs, { floorId: targetFloorId, roomId: targetId });
            return true; // 이동은 나중에 (끼어들기 시)
        }

        // NPC 0~1명 → 바로 이동
        await executeMove(targetId, targetFloorId, targetRoomPayload);
        return true;
    }

    // Active NPC State - Prefer backend room payload, fallback to local schedule
    const [activeNpc, setActiveNpc] = useState(null);

    const npcsInRoom = React.useMemo(() => {
        return roomApiNpcIds;
    }, [roomApiNpcIds]);

    const [isThinking, setIsThinking] = useState(false);
    const [isSidebarPanelOpen, setIsSidebarPanelOpen] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    // NPC Session State -> Free chat count logic
    const [freeChatCount, setFreeChatCount] = useState(0);

    // === Eavesdrop / Intercept System ===
    // eavesdropState: null | 'hp_warning_chat' | 'chatting' | 'preview' | 'choice' | 'intercepting' | 'listening' | 'done'
    const [eavesdropState, setEavesdropState] = useState(null);
    const [eavesdropLogs, setEavesdropLogs] = useState([]);
    const [eavesdropDialogContent, setEavesdropDialogContent] = useState(null);
    const [eavesdropInputText, setEavesdropInputText] = useState('');
    const [isEavesdropThinking, setIsEavesdropThinking] = useState(false);
    const [interceptTurnCount, setInterceptTurnCount] = useState(0);
    const MAX_INTERCEPT_TURNS = 10;
    const [eavesdropAutoIndex, setEavesdropAutoIndex] = useState(0);
    const eavesdropAutoRef = useRef(null);
    const [chatNpcStats, setChatNpcStats] = useState(null);
    const [npcStatDeltas, setNpcStatDeltas] = useState({});

    // npc_states 절대값 업데이트 헬퍼
    const updateNpcStatsAbsolute = useCallback((rawStats, fallbackNpcId = null) => {
        if (!rawStats) return;
        let stateMap = rawStats;
        if (typeof rawStats.friendly === 'number' || typeof rawStats.faith === 'number') {
            const npcId = fallbackNpcId || 'unknown';
            stateMap = { [npcId]: rawStats };
        }
        setChatNpcStats(stateMap);
    }, []);

    // 턴 analysis에서 delta 누적 헬퍼 (ConversationTurn.analysis.friendly_delta / faith_delta)
    const accumulateDeltas = useCallback((turns, fallbackNpcId = null) => {
        if (!Array.isArray(turns) || turns.length === 0) return;
        setNpcStatDeltas(prev => {
            const next = { ...prev };
            turns.forEach(turn => {
                const analysis = turn.analysis;
                if (!analysis) return;
                const npcId = turn.speaker_id || fallbackNpcId || 'unknown';
                const existing = next[npcId] || { friendly: 0, faith: 0 };
                next[npcId] = {
                    friendly: existing.friendly + (analysis.friendly_delta ?? 0),
                    faith: existing.faith + (analysis.faith_delta ?? 0),
                };
            });
            return next;
        });
    }, []);

    // === Completed NPC Conversations (per period) ===
    const [completedNpcChats, setCompletedNpcChats] = useState({});

    // Cleanup old periods' data
    useEffect(() => {
        setCompletedNpcChats(prev => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach(key => {
                if (!key.includes(`_${currentDay}_${currentPeriod}`)) {
                    delete next[key];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [currentDay, currentPeriod]);

    const isNpcChatCompleted = (npcId) => {
        return completedNpcChats[`${npcId}_${currentDay}_${currentPeriod}`] || false;
    };

    const markNpcChatCompleted = (...npcIds) => {
        setCompletedNpcChats(prev => {
            const next = { ...prev };
            npcIds.forEach(id => { next[`${id}_${currentDay}_${currentPeriod}`] = true; });
            return next;
        });
    };

    // Secondary NPC (for dual portrait)
    const secondaryNpc = React.useMemo(() => {
        if (npcsInRoom.length < 2) return null;
        const id = npcsInRoom[1];
        if (npcData?.[id]) return npcData[id];
        if (roomApiNpcMap?.[id]) return roomApiNpcMap[id];
        return null;
    }, [npcsInRoom, npcData, roomApiNpcMap]);
    // Map Info (Dynamic based on currentRoomId)
    const mapInfo = mapData?.[currentRoomId] || {};

    // Update active NPC from room payload/schedule
    useEffect(() => {
        if (npcsInRoom.length > 0) {
            const primaryId = npcsInRoom[0];
            const primaryNpc = npcData?.[primaryId]
                || roomApiNpcMap?.[primaryId]
                || (primaryId ? { id: primaryId, name: getNpcName(primaryId) || primaryId } : null);
            setActiveNpc(primaryNpc);
            console.log(`[Schedule] Room: ${currentRoomId}, Day: ${currentDay}, Period: ${currentPeriod}, NPCs:`, npcsInRoom);
        } else if (roomSingleNpc) {
            const singleId = roomSingleNpc.id || roomSingleNpc.npc_id;
            const fallbackNpc = singleId ? {
                id: singleId,
                name: roomSingleNpc.name || getNpcName(singleId) || singleId,
                ...roomSingleNpc,
            } : null;
            setActiveNpc(fallbackNpc);
        } else {
            setActiveNpc(null);
        }

        // Reset chat session on move
        setFreeChatCount(0);
        // Reset eavesdrop on move
        setEavesdropState(null);
        setEavesdropLogs([]);
        setEavesdropDialogContent(null);
        setEavesdropHistory([]);
        setEavesdropNpcIds([]);
        setEavesdropTopic(null);
        setInterceptTurnCount(0);
        setChatNpcStats(null);
        setNpcStatDeltas({});
        if (eavesdropAutoRef.current) {
            clearTimeout(eavesdropAutoRef.current);
            eavesdropAutoRef.current = null;
        }
    }, [currentRoomId, currentDay, currentPeriod, npcData, npcsInRoom, roomApiNpcMap, roomSingleNpc]);

    // Sync activeNpc to GameContext for InventoryApp presentation awareness
    useEffect(() => {
        setActiveNpcInField(activeNpc);
        return () => setActiveNpcInField(null); // Clear on unmount
    }, [activeNpc, setActiveNpcInField]);


    const handleSend = async () => {
        if (!inputText.trim() && !presentedItem) return;

        // HP 차감은 백엔드 chat API에서 자동 처리
        // freeChatCount는 handleConfirmStartChat에서 설정됨 (세션 턴 카운트)
        if (freeChatCount <= 0) {
            setDialogContent({
                speaker: 'System',
                text: '대화 세션이 종료되었습니다.',
                type: 'system'
            });
            return;
        }
        setFreeChatCount(prev => prev - 1);

        const userMsg = inputText.trim();
        setInputText(''); // Clear input

        setIsThinking(true);

        // 1. Archive current dialog if exists
        const newLogs = [...logs];
        if (dialogContent) {
            newLogs.push({
                ...dialogContent,
                id: Date.now() + '_prev_npc',
                type: dialogContent.type || 'npc'
            });
        }

        // 2. Add User Message
        if (userMsg) {
            newLogs.push({
                id: Date.now() + '_user',
                speaker: 'You',
                text: userMsg,
                type: 'user'
            });
        }

        // 2.5. If presenting an item, add presentation log
        if (presentedItem) {
            newLogs.push({
                id: Date.now() + '_presentation',
                speaker: 'System',
                text: `${presentedItem.name}을(를) 제시했습니다.`,
                itemName: presentedItem.name,
                icon: presentedItem.icon,
                type: 'item_presentation'
            });
        }

        setLogs(newLogs);

        // 3. Temporary clear dialog to show thinking state in the main box
        setDialogContent(null);

        // If hidden, auto-show to mini to see response
        if (viewMode === 'hidden') setViewMode('mini');

        try {
            // Default to NPC A if no active NPC, or use active NPC
            const targetNpc = activeNpc || npcData?.npc_a;

            if (!targetNpc) {
                setDialogContent({ speaker: 'System', text: '대화할 상대가 없습니다.', type: 'system' });
                setIsThinking(false);
                return;
            }

            const data = await sendChatMessage(
                userMsg,
                targetNpc.id,
                presentedItem ? (presentedItem.itemId || presentedItem.id) : null,
            );

            console.log('[Chat API Response]', JSON.stringify(data, null, 2));

            // 백엔드 응답에서 대화 텍스트 추출
            const responseText = data.response || data.message || data.reply || JSON.stringify(data);

            setDialogContent({
                speaker: targetNpc.name,
                text: responseText,
                type: 'active_npc'
            });

            // 글로벌 HP 동기화 (data.hp 객체만 사용)
            const hpData = data.hp || data.stats || data.global;
            if (hpData && typeof hpData === 'object') {
                syncStats({
                    hp: hpData.total_hp ?? hpData.hp,
                    sessionHp: hpData.session_hp ?? hpData.sessionHp,
                    plusHp: hpData.plus_hp ?? hpData.plusHp,
                });
            }

            // NPC 절대 스탯 업데이트 (data.currentStats 사용)
            const npcAbsolute = data.currentStats || data.current_stats
                || data.npc_states || data.npc_stats || data.npcStats;
            if (npcAbsolute) {
                updateNpcStatsAbsolute(npcAbsolute, targetNpc?.id);
                // GameContext에도 NPC 스탯 영구 반영
                const npcId = targetNpc?.id || data.npcId;
                if (npcId) {
                    const flat = (typeof npcAbsolute.friendly === 'number') ? npcAbsolute : npcAbsolute[npcId];
                    if (flat) {
                        syncStats({
                            npcStats: {
                                ...npcStats,
                                [npcId]: { ...npcStats?.[npcId], ...flat, npc_name: targetNpc?.name },
                            },
                        });
                    }
                }
            } else {
                console.warn('[Chat API] No NPC absolute stats in response. Keys:', Object.keys(data));
            }

            // NPC 변화량(delta) 누적 (data.updatedStats 사용)
            const npcDelta = data.updatedStats || data.updated_stats;
            if (npcDelta && (npcDelta.friendly !== undefined || npcDelta.faith !== undefined)) {
                accumulateDeltas([{
                    speaker_id: targetNpc?.id,
                    analysis: {
                        friendly_delta: npcDelta.friendly ?? 0,
                        faith_delta: npcDelta.faith ?? 0,
                    },
                }], targetNpc?.id);
            }

            // Clear presented item after it's been sent with the message
            if (presentedItem) {
                clearPresentation();
            }

        } catch (error) {
            console.error(error);
            setDialogContent({
                speaker: 'System',
                text: '...(시스템 오류: 응답 불가)...',
                type: 'system'
            });
            // Refund the free chat count if it failed? (Optional)
        } finally {
            setIsThinking(false);
        }
    };

    const toggleNpc = () => {
        if (!npcsInRoom || npcsInRoom.length === 0) return;

        const currentIndex = npcsInRoom.findIndex(id => id === activeNpc?.id);
        const nextIndex = (currentIndex + 1) % npcsInRoom.length;
        const nextId = npcsInRoom[nextIndex];
        setActiveNpc(
            npcData?.[nextId]
            || roomApiNpcMap?.[nextId]
            || { id: nextId, name: getNpcName(nextId) || nextId },
        );

        // Reset free chat session when manually switching NPC target
        setFreeChatCount(0);
    };

    // Fish Visual Effects
    const { fishTier, mapEffects, mapFilter, mapTransform, waveFilterId } = useFishVisuals();
    const currentFloorId = currentLocationInfo?.floorId || findFloorIdByRoom(currentRoomId);
    const isChatActive = eavesdropState === 'chatting' || eavesdropState === 'intercepting' || eavesdropState === 'listening';
    const isEavesdropOverlayActive = ['preview', 'choice', 'intercepting', 'listening', 'done'].includes(eavesdropState);
    const eavesdropParticipantIds = (eavesdropNpcIds.length > 0 ? eavesdropNpcIds : npcsInRoom).slice(0, MAX_EAVESDROP_PARTICIPANTS);
    const eavesdropParticipants = eavesdropParticipantIds.map((npcId, index) => ({
        id: npcId,
        name: getNpcName(npcId) || npcId,
        colorIndex: index % EAVESDROP_MAX_COLOR_COUNT,
    }));
    const isMapInteractionLocked = isSidebarPanelOpen || !!pendingMove || !!pendingItem || !!pendingRequirement || !!pendingHpWarning || isChatActive || isEavesdropOverlayActive;
    const hudLogs = isEavesdropOverlayActive ? eavesdropLogs : logs;
    const hudDialogContent = isEavesdropOverlayActive ? eavesdropDialogContent : dialogContent;
    const hudIsThinking = isEavesdropOverlayActive ? isEavesdropThinking : isThinking;
    const hudViewMode = isEavesdropOverlayActive
        ? 'full'
        : (eavesdropState === 'chatting' ? viewMode : (isChatActive ? 'hidden' : viewMode));

    const handleSidebarPanelStateChange = useCallback((panelState) => {
        setIsSidebarPanelOpen(!!panelState?.isOpen);
    }, []);

    const handleSidebarVisibleChange = useCallback((visible) => {
        setIsSidebarVisible(visible);
    }, []);

    // ========================
    // === NPC 대화 시작 UI ===
    // ========================
    const handleStartChatClick = () => {
        if (!activeNpc) return;
        if (isNpcChatCompleted(activeNpc.id)) {
            setDialogContent({ speaker: 'System', text: '이미 대화를 나누었습니다. 다른 시간대에 만나면 다시 대화할 수 있습니다.', type: 'system' });
            if (viewMode === 'hidden') setViewMode('mini');
            return;
        }
        // HP 차감은 handleConfirmStartChat에서 직접 처리
        handleConfirmStartChat();
    };

    const handleConfirmStartChat = async () => {
        // 프론트에서 HP 10 차감
        const hpResult = await spendHp(ACTION_COSTS.npcChat);
        if (!hpResult) {
            setDialogContent({ speaker: 'System', text: '체력이 부족하다...', type: 'system' });
            setEavesdropState(null);
            return;
        }
        if (hpResult.transitioned) {
            setEavesdropState(null);
            return;
        }
        // GameContext의 npcStats에서 현재 NPC 스탯 표시 (없으면 첫 메시지 후 서버에서 받아서 갱신됨)
        if (activeNpc?.id) {
            const existingStats = npcStats?.[activeNpc.id];
            if (existingStats) {
                setChatNpcStats({ [activeNpc.id]: { ...existingStats, npc_name: activeNpc.name } });
            }
            // existingStats가 없으면 chatNpcStats=null 상태로 둘 -> 첫 메시지 후 서버 응답에서 갱신
        }
        setNpcStatDeltas({});
        setEavesdropState(null);
        setFreeChatCount(MAX_INTERCEPT_TURNS);
        setEavesdropState('chatting');
        setDialogContent({
            speaker: activeNpc.name,
            text: '무슨 일이야?',
            type: 'active_npc'
        });
        markNpcChatCompleted(activeNpc.id);
        if (viewMode === 'hidden') setViewMode('mini');
    };

    // ========================
    // === 엿듣기 시작 ===
    // ========================
    const handleEavesdropClick = async () => {
        if (npcsInRoom.length < 2) return;
        const allCompleted = npcsInRoom.every(id => isNpcChatCompleted(id));
        if (allCompleted) {
            setDialogContent({ speaker: 'System', text: '이미 대화를 나눈 NPC들입니다.', type: 'system' });
            if (viewMode === 'hidden') setViewMode('mini');
            return;
        }
        await openEavesdropPreview(
            roomPayload || { topic: roomTopic, room: { npcIds: npcsInRoom } },
            npcsInRoom,
            { floorId: currentLocationInfo?.floorId, roomId: currentRoomId },
        );
    };


    const handleInterceptChoice = async () => {
        // 프론트에서 HP 10 추가 차감 (끼어들기)
        const hpResult = await spendHp(ACTION_COSTS.eavesdropJoin);
        if (!hpResult) {
            setDialogContent({ speaker: 'System', text: '체력이 부족하다...', type: 'system' });
            return;
        }
        if (hpResult.transitioned) {
            handleCloseEavesdrop();
            return;
        }

        // 끼어들기: 방 입장 후 3인 대화 시작 (이동 HP 추가 차감 없음)
        if (pendingEavesdropTarget) {
            const { floorId, roomId, payload } = pendingEavesdropTarget;
            await executeMove(roomId, floorId, payload);
            setPendingEavesdropTarget(null);
        }
        setEavesdropState('intercepting');
        setInterceptTurnCount(0);
        setEavesdropDialogContent({
            speaker: 'System',
            text: '대화에 끼어들었습니다. 대화를 시작하세요.',
            type: 'system'
        });
        markNpcChatCompleted(...(eavesdropNpcIds.length > 0 ? eavesdropNpcIds : npcsInRoom).slice(0, MAX_EAVESDROP_PARTICIPANTS));
        if (viewMode !== 'full') setViewMode('full');
    };


    const handleInterceptSend = async () => {
        if (!eavesdropInputText.trim() || isEavesdropThinking) return;
        if (interceptTurnCount >= MAX_INTERCEPT_TURNS) return;

        const userMsg = eavesdropInputText;
        setEavesdropInputText('');
        setIsEavesdropThinking(true);

        const activeNpcIds = (eavesdropNpcIds.length > 0 ? eavesdropNpcIds : npcsInRoom).slice(0, MAX_EAVESDROP_PARTICIPANTS);

        const newLogs = [...eavesdropLogs];
        if (eavesdropDialogContent) {
            newLogs.push({ ...eavesdropDialogContent, id: Date.now() + '_prev' });
        }
        newLogs.push({ id: Date.now() + '_user', speaker: 'You', text: userMsg, type: 'user' });
        setEavesdropLogs(newLogs);
        setEavesdropDialogContent(null);

        try {
            const response = await replyConversation({
                topic: eavesdropTopic || roomTopic || '주변 수군거림',
                npcIds: activeNpcIds,
                userMessage: userMsg,
                history: eavesdropHistory,
            });
            const conversation = normalizeConversationPayload(response);
            const turns = Array.isArray(conversation?.turns) ? conversation.turns : [];
            const npcTurns = turns.filter((turn) => turn?.speaker_id !== 'user');

            npcTurns.forEach((turn, index) => {
                newLogs.push(createEavesdropLog({
                    id: Date.now() + '_reply_' + index,
                    speakerId: turn.speaker_id || null,
                    speakerName: getNpcName(turn.speaker_id) || turn.speaker || 'NPC',
                    text: turn.content,
                    type: 'intercept_npc',
                    participantIds: activeNpcIds,
                }));
            });

            setEavesdropLogs([...newLogs]);
            setEavesdropHistory((prev) => [...prev, ...turns]);

            const updatedStats = response.updatedStats || response.hp || response.stats || response.global;
            if (updatedStats) {
                syncStats(typeof updatedStats === 'object' ? updatedStats : { hp: updatedStats });
            }

            // NPC 스탯 업데이트 (절대값 + 턴 delta)
            const interceptNpcStates = conversation?.npc_states || response?.npc_states || response?.npc_stats || response?.npcStats;
            if (interceptNpcStates) {
                updateNpcStatsAbsolute(interceptNpcStates);
            }
            accumulateDeltas(npcTurns);

            if (npcTurns.length > 0) {
                const last = npcTurns[npcTurns.length - 1];
                setEavesdropDialogContent(createEavesdropLog({
                    id: Date.now() + '_dialog',
                    speakerId: last.speaker_id || null,
                    speakerName: getNpcName(last.speaker_id) || last.speaker || 'NPC',
                    text: last.content,
                    type: 'intercept_npc',
                    participantIds: activeNpcIds,
                }));
            }

            const newCount = interceptTurnCount + 1;
            setInterceptTurnCount(newCount);

            if (newCount >= MAX_INTERCEPT_TURNS) {
                setTimeout(() => {
                    setEavesdropState('done');
                    setEavesdropDialogContent({ speaker: 'System', text: '대화가 끝났습니다.', type: 'system' });
                }, 1000);
            }
        } catch (err) {
            console.error('Intercept error:', err);
            setEavesdropDialogContent({ speaker: 'System', text: '...(시스템 오류)...', type: 'system' });
        } finally {
            setIsEavesdropThinking(false);
        }
    };

    const handleListenChoice = () => {
        handleConfirmListen();
    };

    const handleConfirmListen = async () => {
        // 프론트에서 HP 5 추가 차감 (엿듣기 계속)
        const hpResult = await spendHp(ACTION_COSTS.eavesdropContinue);
        if (!hpResult) {
            setDialogContent({ speaker: 'System', text: '체력이 부족하다...', type: 'system' });
            return;
        }
        if (hpResult.transitioned) {
            handleCloseEavesdrop();
            return;
        }

        setEavesdropState('listening');
        setEavesdropAutoIndex(0);
        setIsEavesdropThinking(true);
        if (viewMode !== 'full') setViewMode('full');

        const activeNpcIds = (eavesdropNpcIds.length > 0 ? eavesdropNpcIds : npcsInRoom).slice(0, MAX_EAVESDROP_PARTICIPANTS);
        markNpcChatCompleted(...activeNpcIds);
        let turns = [];

        try {
            const response = await eavesdropMore({
                dayIndex: currentDay,
                sessionIndex: PERIOD_TO_INDEX[currentPeriod] || 1,
                roomId: currentRoomId,
            });
            const conversation = normalizeConversationPayload(response);
            turns = Array.isArray(conversation?.turns) ? conversation.turns : [];
        } catch (error) {
            console.warn('eavesdropMore failed, fallback to conversation/start:', error);
        }

        if (turns.length === 0) {
            try {
                const fallbackFloorId = pendingEavesdropTarget?.floorId || currentLocationInfo?.floorId;
                const fallbackRoomId = pendingEavesdropTarget?.roomId || currentRoomId;
                let fallback;
                if (fallbackFloorId && fallbackRoomId) {
                    fallback = await eavesdropRoom(fallbackFloorId, fallbackRoomId);
                } else {
                    fallback = await startConversation({
                        npcIds: activeNpcIds,
                        topic: eavesdropTopic || roomTopic || null,
                        numTurns: 4,
                        dayIndex: currentDay || null,
                        session: currentPeriod || null,
                    });
                }
                const conversation = normalizeConversationPayload(fallback);
                turns = Array.isArray(conversation?.turns) ? conversation.turns : [];
            } catch (error) {
                console.error('Failed to continue eavesdrop:', error);
            }
        }

        const npcTurns = turns.filter((turn) => turn?.speaker_id !== 'user').slice(0, 10);
        runAutoEavesdrop(0, [...eavesdropLogs], npcTurns, activeNpcIds);
    };

    const runAutoEavesdrop = (index, currentLogs, pendingTurns, activeNpcIds) => {
        if (!pendingTurns || index >= pendingTurns.length) {
            setEavesdropState('done');
            setEavesdropDialogContent({ speaker: 'System', text: '대화가 끝났습니다.', type: 'system' });
            setIsEavesdropThinking(false);
            return;
        }

        const turn = pendingTurns[index];
        const newLog = createEavesdropLog({
            id: Date.now() + '_auto_' + index,
            speakerId: turn.speaker_id || null,
            speakerName: getNpcName(turn.speaker_id) || turn.speaker || 'NPC',
            text: turn.content,
            type: 'eavesdrop_listen',
            participantIds: activeNpcIds || [],
        });
        const updatedLogs = [...currentLogs, newLog];
        setEavesdropLogs(updatedLogs);
        setEavesdropDialogContent(newLog);
        setEavesdropAutoIndex(index + 1);
        setIsEavesdropThinking(false);
        setEavesdropHistory((prev) => [...prev, turn]);

        if (eavesdropAutoRef.current) {
            clearTimeout(eavesdropAutoRef.current);
        }
        eavesdropAutoRef.current = setTimeout(() => {
            runAutoEavesdrop(index + 1, updatedLogs, pendingTurns, activeNpcIds);
        }, 2000);
    };

    const handleCloseEavesdrop = () => {
        const shouldRestorePreviewRoom = !!pendingEavesdropTarget;

        setEavesdropState(null);
        setEavesdropLogs([]);
        setEavesdropDialogContent(null);
        setEavesdropInputText('');
        setEavesdropHistory([]);
        setIsEavesdropThinking(false);
        setInterceptTurnCount(0);
        setFreeChatCount(0);
        setEavesdropAutoIndex(0);
        setEavesdropNpcIds([]);
        setEavesdropTopic(null);
        setChatNpcStats(null);
        setNpcStatDeltas({});
        if (eavesdropAutoRef.current) {
            clearTimeout(eavesdropAutoRef.current);
            eavesdropAutoRef.current = null;
        }

        if (shouldRestorePreviewRoom) {
            setPendingEavesdropTarget(null);
            applyRoomPayload(null);
        }

        const threshold = { morning: 70, afternoon: 40, evening: 10, night: 0 }[currentPeriod];
        if (threshold !== undefined && hp <= threshold) {
            triggerEndSession().catch(e => console.warn('Failed to auto trigger end session:', e));
        }
    };


    // 떠나기: 엿듣기 세션 종료, 이동 취소 (방 밖 유지)
    const handleLeaveEavesdrop = () => {
        handleCloseEavesdrop();
    };

    // End 1:1 chat session
    const handleEndChat = async () => {
        if (activeNpc) {
            const threshold = { morning: 70, afternoon: 40, evening: 10, night: 0 }[currentPeriod];
            if (threshold !== undefined && hp <= threshold) {
                try {
                    await triggerEndSession(activeNpc.id);
                } catch (error) {
                    console.warn('Failed to trigger end chat session:', error);
                }
            }
        }
        setFreeChatCount(0);
        setChatNpcStats(null);
        setNpcStatDeltas({});
        setEavesdropState(null);
        setDialogContent({ speaker: 'System', text: '대화가 종료되었습니다.', type: 'system' });
    };

    // === Section Transition 완료: 맵 이동 처리 ===
    const handleSectionTransitionComplete = useCallback(async (transitionData) => {
        if (!transitionData?.targetRoom) return;
        const targetRoomId = transitionData.targetRoom;
        const targetFloorId = findFloorIdByRoom(targetRoomId);
        if (!targetFloorId) {
            console.warn('Section transition target room not found:', targetRoomId);
            return;
        }

        let targetRoomPayload = null;
        try {
            targetRoomPayload = await fetchRoom(targetFloorId, targetRoomId);
        } catch (error) {
            console.warn('Failed to fetch room for section transition:', error);
        }

        // 엿듣기/대화 상태 초기화
        setEavesdropState(null);
        setEavesdropLogs([]);
        setEavesdropDialogContent(null);
        setFreeChatCount(0);
        setChatNpcStats(null);
        setNpcStatDeltas({});

        // 대화 로그 초기화
        setLogs([]);
        setDialogContent(null);

        await executeMove(targetRoomId, targetFloorId, targetRoomPayload);
    }, [findFloorIdByRoom, fetchRoom, executeMove, setLogs, setDialogContent]);

    // HP Warning modal helper
    const getHpWarningConfig = () => {
        if (eavesdropState === 'hp_warning_chat') {
            return {
                title: 'HP 소모 경고',
                cost: ACTION_COSTS.npcChat,
                desc: `${activeNpc?.name || 'NPC'}와(과) 대화합니다.`,
                onConfirm: handleConfirmStartChat,
            };
        }
        return null;
    };
    const hpWarningConfig = getHpWarningConfig();

    return (
        <div className="w-full h-full relative bg-black overflow-hidden">
            <MapContainer aspectRatio={16 / 9}>
                <div
                    className="w-full h-full relative bg-gray-900 text-white overflow-hidden"
                    style={{
                        backgroundImage: mapInfo.background,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: mapFilter !== 'none' ? mapFilter : undefined,
                        transform: mapTransform !== 'none' ? mapTransform : undefined,
                        transformOrigin: 'center center',
                    }}
                >
                    {/* Fish Eye Effect Overlay */}
                    <FishEyeEffect fishTier={fishTier} mapEffects={mapEffects} waveFilterId={waveFilterId} />

                    {/* Interactive Layer */}
                    <MapInteractiveLayer
                        mapInfo={mapInfo}
                        onInteract={handleInteraction}
                        isInteractionLocked={isMapInteractionLocked}
                    />

                    {!isEavesdropOverlayActive && (
                        <IngameSidebarMenu
                            currentFloorId={currentFloorId}
                            currentRoomId={currentRoomId}
                            onNavigate={handleMove}
                            onPanelStateChange={handleSidebarPanelStateChange}
                            onSidebarVisibleChange={handleSidebarVisibleChange}
                            chatLogs={logs}
                        />
                    )}

                    {/* Interaction Panel */}
                    {npcsInRoom.length > 0 && !isChatActive && !isEavesdropOverlayActive && (
                        <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20 flex flex-col gap-2 min-w-[200px]">
                            <span className="text-xs text-gray-400 mb-1">
                                현재 방: {npcsInRoom.map(id => npcData?.[id]?.name || id).join(', ')}
                            </span>

                            {/* 1:1 대화하기 */}
                            <button
                                onClick={handleStartChatClick}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                            >
                                💬 {activeNpc?.name}와(과) 대화하기                                <span className="text-xs text-blue-200">({ACTION_COSTS.npcChat} HP)</span>
                            </button>

                            {/* NPC 전환 */}
                            {npcsInRoom.length > 1 && (
                                <>
                                    <button
                                        onClick={toggleNpc}
                                        className="w-full py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
                                    >
                                        대상 변경
                                    </button>

                                    {/* 엿듣기 */}
                                    <button
                                        onClick={handleEavesdropClick}
                                        className="w-full py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        👂 엿듣기
                                        <span className="text-xs text-purple-200">({ACTION_COSTS.eavesdrop} HP)</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* NPC Chat Status Panel (우상단) */}
                    {isChatActive && (
                        <div className="absolute top-4 right-4 z-20 flex flex-col gap-3 min-w-[280px]">
                            {/* 대화 컨트롤 헤더 */}
                            <div className="bg-black/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20 shadow-lg shadow-black/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-white flex items-center gap-2">
                                        💬 대화 중
                                    </span>
                                    <span className="text-xs font-mono bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full border border-blue-500/50">
                                        남은 횟수: {eavesdropState === 'chatting' ? freeChatCount : (10 - interceptTurnCount)}/10
                                    </span>
                                </div>
                                <button
                                    onClick={eavesdropState === 'chatting' ? handleEndChat : handleCloseEavesdrop}
                                    className="w-full py-2 bg-red-600/80 hover:bg-red-500 rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    🚪 대화 종료
                                </button>
                            </div>

                            {/* 다중 NPC 스탯 표시 */}
                            {(chatNpcStats || activeNpc) && (
                                <div className="flex flex-col gap-2">
                                    {Object.entries(chatNpcStats || { [activeNpc?.id || 'unknown']: { ...npcStats?.[activeNpc?.id], npc_name: activeNpc?.name } }).map(([id, stats]) => {
                                        const npcName = stats.npc_name || stats.name || getNpcName(id) || id;
                                        const delta = npcStatDeltas[id] || {};
                                        return (
                                            <div key={id} className={`bg-gray-900/90 backdrop-blur-md px-3 py-2.5 rounded-xl border-l-4 shadow-md ${(stats.friendly ?? 0) > 50 ? 'border-l-blue-500' : 'border-l-yellow-500'}`}>
                                                <h4 className="text-xs font-bold text-gray-200 mb-1.5 truncate">{npcName}</h4>
                                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono text-gray-400">
                                                    <div className="flex justify-between items-center">
                                                        <span>친밀도</span>
                                                        <span className="text-white font-bold flex items-center gap-1">
                                                            {stats.friendly ?? '?'}
                                                            {delta.friendly !== undefined && delta.friendly !== 0 && (
                                                                <span className={`text-[9px] font-bold ${delta.friendly > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                                                    {delta.friendly > 0 ? `+${delta.friendly}` : delta.friendly}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span>신앙심</span>
                                                        <span className="text-white font-bold flex items-center gap-1">
                                                            {stats.faith ?? '?'}
                                                            {delta.faith !== undefined && delta.faith !== 0 && (
                                                                <span className={`text-[9px] font-bold ${delta.faith > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                                                    {delta.faith > 0 ? `+${delta.faith}` : delta.faith}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    {stats.stress !== undefined && (
                                                        <div className="flex justify-between items-center col-span-2 mt-0.5 pt-0.5 border-t border-white/10">
                                                            <span>스트레스</span>
                                                            <span className={stats.stress > 70 ? 'text-red-400 font-bold' : 'text-white'}>{stats.stress}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <GameHUD
                        mapInfo={mapInfo}
                        activeNpc={activeNpc}
                        secondaryNpc={npcsInRoom.length > 1 ? secondaryNpc : undefined}
                        logs={hudLogs}
                        dialogContent={hudDialogContent}
                        isThinking={hudIsThinking}
                        onSend={eavesdropState === 'chatting' ? handleSend : undefined}
                        inputText={eavesdropState === 'chatting' ? inputText : ''}
                        setInputText={eavesdropState === 'chatting' ? setInputText : undefined}
                        inputPlaceholder={eavesdropState === 'chatting' ? 'Type dialogue...' : '대화 작성중...'}
                        inputForceDisabled={eavesdropState !== 'chatting'}
                        viewMode={hudViewMode}
                        onToggleHidden={handleToggleHidden}
                        onToggleExpand={handleToggleExpand}
                        isPhoneOpen={false}
                        theme="corrupted"
                        onToggleNpc={npcsInRoom.length > 1 && !isChatActive && !isEavesdropOverlayActive ? toggleNpc : undefined}
                        presentedItem={presentedItem}
                        onClearPresentation={clearPresentation}
                        showViewControls={!isEavesdropOverlayActive}
                        isSidebarVisible={isSidebarVisible}
                        chatRightInset="24px"
                        inputSlot={isEavesdropOverlayActive ? (
                            <div className="px-6 pt-3 pb-5 border-t border-white/10 bg-black/20 space-y-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {eavesdropParticipants.length > 0 ? eavesdropParticipants.map((participant) => (
                                        <span
                                            key={participant.id}
                                            className={`px-2 py-0.5 rounded-full text-xs border ${getEavesdropColorStyle(participant.colorIndex).chipClass}`}
                                        >
                                            {participant.name}
                                        </span>
                                    )) : (
                                        <span className="text-xs text-gray-300">참여자 없음</span>
                                    )}
                                </div>

                                <p className="text-xs text-gray-300">
                                    {eavesdropState === 'choice' && '행동을 선택하세요. 취소 버튼을 누르면 메뉴로 돌아갑니다.'}
                                    {eavesdropState === 'intercepting' && '대화에 끼어드는 중입니다.'}
                                    {eavesdropState === 'listening' && `엿듣는 중입니다... (${eavesdropAutoIndex}/10)`}
                                    {eavesdropState === 'done' && '대화가 끝났습니다.'}
                                    {eavesdropState === 'preview' && '대화를 불러오는 중입니다...'}
                                </p>

                                {eavesdropState === 'choice' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <button
                                            onClick={handleInterceptChoice}
                                            className="py-3 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-bold text-white transition-colors shadow-lg"
                                        >
                                            끼어들기 ({ACTION_COSTS.eavesdropJoin} HP)
                                        </button>
                                        <button
                                            onClick={handleListenChoice}
                                            className="py-3 bg-purple-700 hover:bg-purple-600 rounded-xl text-sm font-bold text-white transition-colors shadow-lg"
                                        >
                                            더 계속 엿듣기 ({ACTION_COSTS.eavesdropContinue} HP)
                                        </button>
                                        <button
                                            onClick={handleLeaveEavesdrop}
                                            className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-bold text-white transition-colors shadow-lg"
                                        >
                                            취소
                                        </button>
                                    </div>
                                )}

                                {eavesdropState === 'intercepting' && (
                                    <>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={eavesdropInputText}
                                                onChange={(e) => setEavesdropInputText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleInterceptSend()}
                                                placeholder={`끼어들기... (${interceptTurnCount}/${MAX_INTERCEPT_TURNS})`}
                                                className="flex-1 bg-transparent border border-white/20 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                                                disabled={isEavesdropThinking || interceptTurnCount >= MAX_INTERCEPT_TURNS}
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleInterceptSend}
                                                disabled={isEavesdropThinking || typeof eavesdropInputText !== 'string' || eavesdropInputText.trim().length === 0}
                                                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-bold text-white disabled:opacity-50 transition-colors"
                                            >
                                                전송
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleLeaveEavesdrop}
                                            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold text-white transition-colors"
                                        >
                                            취소
                                        </button>
                                    </>
                                )}

                                {eavesdropState === 'listening' && (
                                    <button
                                        onClick={handleLeaveEavesdrop}
                                        className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold text-white transition-colors"
                                    >
                                        그만 듣기
                                    </button>
                                )}

                                {eavesdropState === 'preview' && (
                                    <button
                                        onClick={handleLeaveEavesdrop}
                                        className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold text-white transition-colors"
                                    >
                                        취소
                                    </button>
                                )}

                                {eavesdropState === 'done' && (
                                    <button
                                        onClick={handleLeaveEavesdrop}
                                        className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold text-white transition-colors"
                                    >
                                        닫기
                                    </button>
                                )}
                            </div>
                        ) : null}
                    />

                    {/* Navigation Confirmation Popup */}
                    <NavigationConfirmation
                        isOpen={!!pendingMove}
                        targetLabel={pendingMove?.label}
                        onConfirm={confirmMove}
                        onCancel={cancelMove}
                    />

                    {/* Section Transition Overlay */}
                    <SectionTransitionOverlay onTransitionComplete={handleSectionTransitionComplete} />

                    {/* HP Boundary Warning Modal */}
                    <HpWarningModal
                        isOpen={!!pendingHpWarning}
                        warning={pendingHpWarning}
                        onConfirm={confirmHpWarning}
                        onCancel={cancelHpWarning}
                    />

                    {/* Item Pickup Modal */}
                    <ItemPickupModal
                        isOpen={!!pendingItem}
                        item={pendingItem ? ITEMS[pendingItem] : null}
                        onClose={resolveItem}
                        onCollect={() => {
                            if (pendingItem) {
                                addItem(pendingItem);
                                resolveItem();
                            }
                        }}
                    />

                    {/* Locked Requirement Check Modal */}
                    <RequirementModal
                        isOpen={!!pendingRequirement}
                        requirement={pendingRequirement}
                        onClose={resolveRequirement}
                    />

                    {/* 1:1 Chat end button (when chatting) */}
                    {eavesdropState === 'chatting' && freeChatCount <= 0 && (
                        <div className="absolute bottom-4 right-4 z-30">
                            <button
                                onClick={handleEndChat}
                                className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-xl text-sm font-bold text-white transition-colors shadow-lg"
                            >
                                대화 종료
                            </button>
                        </div>
                    )}

                    {/* HP Warning Modals for Eavesdrop Actions */}
                    {hpWarningConfig && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="bg-gray-900/95 border border-yellow-500/40 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-yellow-400 text-lg">⚠️</span>
                                    <span className="text-sm font-bold text-yellow-300">{hpWarningConfig.title}</span>
                                </div>
                                <p className="text-sm text-gray-300 mb-1">{hpWarningConfig.desc}</p>
                                <p className="text-sm text-yellow-300 font-bold mb-4">소모 HP: {hpWarningConfig.cost}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEavesdropState(null)}
                                        className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={hpWarningConfig.onConfirm}
                                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition-colors"
                                    >
                                        확인
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <InteractionPopup 
                    isOpen={!!pendingInfoPopup} 
                    messages={pendingInfoPopup || []} 
                    onComplete={resolveInfoPopup} 
                />
            </MapContainer>
        </div>
    );
};

export default MainGameScene;

