import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useViewMode } from '../hooks/useViewMode';
import { generateAIResponse } from '../utils/aiService';
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

const MainGameScene = () => {
    // viewMode: 'full' (Logs + Dialog + Input), 'mini' (Dialog + Input), 'hidden' (Button only)
    const { viewMode, setViewMode, handleToggleHidden, handleToggleExpand } = useViewMode('mini');
    const [inputText, setInputText] = useState('');

    // Active Room State - Starts in Warehouse Main
    const [currentRoomId, setCurrentRoomId] = useState('storage_main');

    const { syncStats, npcData, mapData, floorData, scheduleData, setCurrentLocationInfo, addItem, ITEMS, inventory: currentInventory, currentDay, currentPeriod, spendHp, rest, ACTION_COSTS, getHpCostPreview, PERIOD_LABELS, fishLevel, umiLevel, hp, presentedItem, clearPresentation, setActiveNpcInField } = useGame();

    const handleMove = (targetId) => {
        console.log("Moving to:", targetId);
        setCurrentRoomId(targetId);

        // Sync to GameContext for MapApp
        if (floorData) {
            const floor = floorData.find(f => f.rooms.some(r => r.id === targetId));
            if (floor) {
                setCurrentLocationInfo({
                    floorId: floor.id,
                    roomId: targetId
                });
            }
        }
    };

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
        resolveRequirement,
        setDialogContent,
        setLogs,
        pendingHpWarning,
        confirmHpWarning,
        cancelHpWarning,
    } = useInteraction({
        viewMode,
        setViewMode,
        onMove: handleMove,
        inventory: currentInventory, // Pass current inventory to check for existing items
        stats: { fishLevel, umiLevel, hp }, // Pass stats for interaction checks
        spendHp,
        rest,
        ACTION_COSTS,
        getHpCostPreview,
        PERIOD_LABELS,
        itemInteractionMode: 'popup',
    });

    // Active NPC State - Driven by schedule
    const [activeNpc, setActiveNpc] = useState(null);
    // All NPCs in current room (for future multi-NPC support)
    const npcsInRoom = React.useMemo(() => {
        if (!scheduleData || !currentRoomId) return [];

        const ids = [];
        for (const npcId in scheduleData) {
            const npcSchedule = scheduleData[npcId];
            if (!npcSchedule) continue;
            const daySchedule = npcSchedule[currentDay] ?? npcSchedule.default;
            if (!daySchedule) continue;

            if (daySchedule[currentPeriod] === currentRoomId) {
                ids.push(npcId);
            }
        }

        return ids;
    }, [scheduleData, currentRoomId, currentDay, currentPeriod]);

    const [isThinking, setIsThinking] = useState(false);
    const [isSidebarPanelOpen, setIsSidebarPanelOpen] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    
    // NPC Session State -> Free chat count logic
    const [freeChatCount, setFreeChatCount] = useState(0);

    // === Eavesdrop / Intercept System ===
    // eavesdropState: null | 'hp_warning_chat' | 'chatting' | 'hp_warning_eavesdrop' | 'preview' | 'choice' | 'hp_warning_intercept' | 'intercepting' | 'hp_warning_listen' | 'listening' | 'done'
    const [eavesdropState, setEavesdropState] = useState(null);
    const [eavesdropLogs, setEavesdropLogs] = useState([]);
    const [eavesdropDialogContent, setEavesdropDialogContent] = useState(null);
    const [eavesdropInputText, setEavesdropInputText] = useState('');
    const [isEavesdropThinking, setIsEavesdropThinking] = useState(false);
    const [interceptTurnCount, setInterceptTurnCount] = useState(0);
    const MAX_INTERCEPT_TURNS = 10;
    const [eavesdropAutoIndex, setEavesdropAutoIndex] = useState(0);
    const eavesdropAutoRef = useRef(null);

    // === Completed NPC Conversations (per period) ===
    const [completedNpcChats, setCompletedNpcChats] = useState({});
    // Key: `${npcId}_${currentDay}_${currentPeriod}`, Value: true

    // Reset completed chats on period change
    useEffect(() => {
        setCompletedNpcChats({});
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
        if (npcsInRoom.length < 2 || !npcData) return null;
        return npcData[npcsInRoom[1]] || null;
    }, [npcsInRoom, npcData]);
    // Map Info (Dynamic based on currentRoomId)
    const mapInfo = mapData?.[currentRoomId] || {};

    // Update active NPC from computed room schedule
    useEffect(() => {
        if (npcsInRoom.length > 0 && npcData) {
            const primaryNpc = npcData[npcsInRoom[0]] || null;
            setActiveNpc(primaryNpc);
            console.log(`[Schedule] Room: ${currentRoomId}, Day: ${currentDay}, Period: ${currentPeriod}, NPCs:`, npcsInRoom);
        } else {
            setActiveNpc(null);
        }
        
        // Reset chat session on move
        setFreeChatCount(0);
        // Reset eavesdrop on move
        setEavesdropState(null);
        setEavesdropLogs([]);
        setEavesdropDialogContent(null);
        setInterceptTurnCount(0);
        if (eavesdropAutoRef.current) {
            clearTimeout(eavesdropAutoRef.current);
            eavesdropAutoRef.current = null;
        }
    }, [currentRoomId, currentDay, currentPeriod, npcData, npcsInRoom]);

    // Sync activeNpc to GameContext for InventoryApp presentation awareness
    useEffect(() => {
        setActiveNpcInField(activeNpc);
        return () => setActiveNpcInField(null); // Clear on unmount
    }, [activeNpc, setActiveNpcInField]);


    const handleSend = async () => {
        if (!inputText.trim()) return;

        // Check HP Cost
        if (freeChatCount === 0) {
            if (spendHp && ACTION_COSTS) {
                const ok = spendHp(ACTION_COSTS.npcChat);
                if (!ok) {
                    setDialogContent({
                        speaker: 'System',
                        text: '체력이 부족하여 말을 걸 수 없다...',
                        type: 'system'
                    });
                    return;
                }
                // Paid! Give 10 free chats for the ensuing conversation
                setFreeChatCount(10);
            }
        } else {
            // Use one free chat
            setFreeChatCount(prev => prev - 1);
        }

        const userMsg = inputText;
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
        newLogs.push({
            id: Date.now() + '_user',
            speaker: 'You',
            text: userMsg,
            type: 'user'
        });

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

            const data = await generateAIResponse(userMsg, {
                npcId: targetNpc.id,
                presentedItem: presentedItem || undefined,
            });

            setDialogContent({
                speaker: targetNpc.name,
                text: data.response,
                type: 'active_npc'
            });

            // Update Stats locally since backend already processed it
            if (data.updatedStats) {
                syncStats(data.updatedStats);
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
        
        const currentIndex = npcsInRoom.findIndex(id => npcData[id]?.id === activeNpc?.id);
        const nextIndex = (currentIndex + 1) % npcsInRoom.length;
        setActiveNpc(npcData[npcsInRoom[nextIndex]]);
        
        // Reset free chat session when manually switching NPC target
        setFreeChatCount(0);
    };

    // Fish Visual Effects
    const { fishTier, mapEffects, mapFilter, mapTransform, waveFilterId } = useFishVisuals();
    const currentFloorId = floorData?.find((floor) => floor.rooms.some((room) => room.id === currentRoomId))?.id;
    const isChatActive = eavesdropState === 'chatting' || eavesdropState === 'intercepting' || eavesdropState === 'listening';
    const isMapInteractionLocked = isSidebarPanelOpen || !!pendingMove || !!pendingItem || !!pendingRequirement || !!pendingHpWarning || isChatActive || eavesdropState === 'preview';

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
            setDialogContent({ speaker: 'System', text: '이미 대화를 나눴습니다. 다른 시간대에 만나면 다시 대화할 수 있습니다.', type: 'system' });
            if (viewMode === 'hidden') setViewMode('mini');
            return;
        }
        setEavesdropState('hp_warning_chat');
    };

    const handleConfirmStartChat = async () => {
        setEavesdropState(null);
        const ok = await spendHp(ACTION_COSTS.npcChat);
        if (!ok) {
            setDialogContent({ speaker: 'System', text: '체력이 부족하여 말을 걸 수 없다...', type: 'system' });
            if (viewMode === 'hidden') setViewMode('mini');
            return;
        }
        setFreeChatCount(MAX_INTERCEPT_TURNS);
        setEavesdropState('chatting');
        setDialogContent({
            speaker: activeNpc.name,
            text: '무슨 일이야?',
            type: 'active_npc'
        });
        if (viewMode === 'hidden') setViewMode('mini');
    };

    // ========================
    // === 엿듣기 시작 ===
    // ========================
    const handleEavesdropClick = () => {
        if (npcsInRoom.length < 2) return;
        const allCompleted = npcsInRoom.every(id => isNpcChatCompleted(id));
        if (allCompleted) {
            setDialogContent({ speaker: 'System', text: '이미 대화를 나눈 NPC들입니다.', type: 'system' });
            if (viewMode === 'hidden') setViewMode('mini');
            return;
        }
        setEavesdropState('hp_warning_eavesdrop');
    };

    const handleConfirmEavesdrop = async () => {
        setEavesdropState(null);
        const ok = await spendHp(ACTION_COSTS.eavesdrop);
        if (!ok) {
            setDialogContent({ speaker: 'System', text: '체력이 부족합니다.', type: 'system' });
            if (viewMode === 'hidden') setViewMode('mini');
            return;
        }
        // Start preview: 4 lines (2 pairs of NPC1 <-> NPC2)
        setEavesdropState('preview');
        setEavesdropLogs([]);
        setEavesdropDialogContent(null);
        if (viewMode === 'hidden') setViewMode('mini');
        await runEavesdropPreview();
    };

    const runEavesdropPreview = async () => {
        const npc1 = npcData[npcsInRoom[0]];
        const npc2 = npcData[npcsInRoom[1]];
        if (!npc1 || !npc2) return;

        setIsEavesdropThinking(true);
        const previewLogs = [];
        try {
            // Pair 1: NPC1 speaks, NPC2 responds
            const r1 = await generateAIResponse('(NPC간 자유 대화를 시작하세요)', { npcId: npc1.id });
            previewLogs.push({ id: Date.now() + '_ep1', speaker: npc1.name, text: r1.response, type: 'eavesdrop_preview' });
            setEavesdropLogs([...previewLogs]);

            const r2 = await generateAIResponse(r1.response, { npcId: npc2.id });
            previewLogs.push({ id: Date.now() + '_ep2', speaker: npc2.name, text: r2.response, type: 'eavesdrop_preview' });
            setEavesdropLogs([...previewLogs]);

            // Pair 2
            const r3 = await generateAIResponse(r2.response, { npcId: npc1.id });
            previewLogs.push({ id: Date.now() + '_ep3', speaker: npc1.name, text: r3.response, type: 'eavesdrop_preview' });
            setEavesdropLogs([...previewLogs]);

            const r4 = await generateAIResponse(r3.response, { npcId: npc2.id });
            previewLogs.push({ id: Date.now() + '_ep4', speaker: npc2.name, text: r4.response, type: 'eavesdrop_preview' });
            setEavesdropLogs([...previewLogs]);

            setEavesdropDialogContent({ speaker: npc2.name, text: r4.response, type: 'eavesdrop_preview' });
        } catch (err) {
            console.error('Eavesdrop preview error:', err);
        } finally {
            setIsEavesdropThinking(false);
            setEavesdropState('choice');
        }
    };

    // ========================
    // === 끼어들기 ===
    // ========================
    const handleInterceptChoice = () => {
        setEavesdropState('hp_warning_intercept');
    };

    const handleConfirmIntercept = async () => {
        setEavesdropState(null);
        const ok = await spendHp(ACTION_COSTS.eavesdropJoin);
        if (!ok) {
            setDialogContent({ speaker: 'System', text: '체력이 부족합니다.', type: 'system' });
            if (viewMode === 'hidden') setViewMode('mini');
            return;
        }
        setEavesdropState('intercepting');
        setInterceptTurnCount(0);
        setEavesdropDialogContent({
            speaker: 'System',
            text: '대화에 끼어들었습니다. 말을 걸어보세요.',
            type: 'system'
        });
        if (viewMode === 'hidden') setViewMode('mini');
    };

    const handleInterceptSend = async () => {
        if (!eavesdropInputText.trim() || isEavesdropThinking) return;
        if (interceptTurnCount >= MAX_INTERCEPT_TURNS) return;

        const userMsg = eavesdropInputText;
        setEavesdropInputText('');
        setIsEavesdropThinking(true);

        const npc1 = npcData[npcsInRoom[0]];
        const npc2 = npcData[npcsInRoom[1]];

        // Archive current
        const newLogs = [...eavesdropLogs];
        if (eavesdropDialogContent) {
            newLogs.push({ ...eavesdropDialogContent, id: Date.now() + '_prev' });
        }
        newLogs.push({ id: Date.now() + '_user', speaker: 'You', text: userMsg, type: 'user' });
        setEavesdropLogs(newLogs);
        setEavesdropDialogContent(null);

        try {
            // NPC1 responds
            const r1 = await generateAIResponse(userMsg, { npcId: npc1.id });
            newLogs.push({ id: Date.now() + '_npc1', speaker: npc1.name, text: r1.response, type: 'active_npc' });
            setEavesdropLogs([...newLogs]);

            // NPC2 responds
            const r2 = await generateAIResponse(r1.response, { npcId: npc2.id });
            newLogs.push({ id: Date.now() + '_npc2', speaker: npc2.name, text: r2.response, type: 'active_npc' });
            setEavesdropLogs([...newLogs]);

            setEavesdropDialogContent({ speaker: npc2.name, text: r2.response, type: 'active_npc' });

            const newCount = interceptTurnCount + 1;
            setInterceptTurnCount(newCount);

            if (newCount >= MAX_INTERCEPT_TURNS) {
                setTimeout(() => {
                    setEavesdropState('done');
                    setEavesdropDialogContent({ speaker: 'System', text: '대화가 종료되었습니다.', type: 'system' });
                    markNpcChatCompleted(npc1.id, npc2.id);
                }, 1000);
            }
        } catch (err) {
            console.error('Intercept error:', err);
            setEavesdropDialogContent({ speaker: 'System', text: '...(오류)...', type: 'system' });
        } finally {
            setIsEavesdropThinking(false);
        }
    };

    // ========================
    // === 엿듣기 계속 ===
    // ========================
    const handleListenChoice = () => {
        setEavesdropState('hp_warning_listen');
    };

    const handleConfirmListen = async () => {
        setEavesdropState(null);
        const ok = await spendHp(ACTION_COSTS.eavesdropContinue);
        if (!ok) {
            setDialogContent({ speaker: 'System', text: '체력이 부족합니다.', type: 'system' });
            if (viewMode === 'hidden') setViewMode('mini');
            return;
        }
        setEavesdropState('listening');
        setEavesdropAutoIndex(0);
        runAutoEavesdrop(0, [...eavesdropLogs]);
    };

    const runAutoEavesdrop = async (index, currentLogs) => {
        if (index >= 10) {
            const npc1 = npcData[npcsInRoom[0]];
            const npc2 = npcData[npcsInRoom[1]];
            setEavesdropState('done');
            setEavesdropDialogContent({ speaker: 'System', text: '엿듣기가 종료되었습니다.', type: 'system' });
            markNpcChatCompleted(npc1.id, npc2.id);
            return;
        }

        const npc1 = npcData[npcsInRoom[0]];
        const npc2 = npcData[npcsInRoom[1]];
        const isNpc1Turn = index % 2 === 0;
        const speaker = isNpc1Turn ? npc1 : npc2;
        const lastMsg = currentLogs.length > 0 ? currentLogs[currentLogs.length - 1].text : '(대화를 계속 진행하세요)';

        setIsEavesdropThinking(true);
        try {
            const r = await generateAIResponse(lastMsg, { npcId: speaker.id });
            const newLog = { id: Date.now() + `_auto_${index}`, speaker: speaker.name, text: r.response, type: 'eavesdrop_listen' };
            const updatedLogs = [...currentLogs, newLog];
            setEavesdropLogs(updatedLogs);
            setEavesdropDialogContent(newLog);
            setEavesdropAutoIndex(index + 1);

            eavesdropAutoRef.current = setTimeout(() => {
                runAutoEavesdrop(index + 1, updatedLogs);
            }, 1500);
        } catch (err) {
            console.error('Auto eavesdrop error:', err);
            setEavesdropState('done');
            setEavesdropDialogContent({ speaker: 'System', text: '...(오류)...', type: 'system' });
        } finally {
            setIsEavesdropThinking(false);
        }
    };

    // End eavesdrop session
    const handleCloseEavesdrop = () => {
        setEavesdropState(null);
        setEavesdropLogs([]);
        setEavesdropDialogContent(null);
        setInterceptTurnCount(0);
        if (eavesdropAutoRef.current) {
            clearTimeout(eavesdropAutoRef.current);
            eavesdropAutoRef.current = null;
        }
    };

    // End 1:1 chat session
    const handleEndChat = () => {
        if (activeNpc) markNpcChatCompleted(activeNpc.id);
        setFreeChatCount(0);
        setEavesdropState(null);
        setDialogContent({ speaker: 'System', text: '대화가 종료되었습니다.', type: 'system' });
    };

    // HP Warning modal helper
    const getHpWarningConfig = () => {
        switch (eavesdropState) {
            case 'hp_warning_chat':
                return { title: '대화 시작 확인', cost: ACTION_COSTS.npcChat, desc: `${activeNpc?.name || 'NPC'}와 대화합니다.`, onConfirm: handleConfirmStartChat };
            case 'hp_warning_eavesdrop':
                return { title: '엿듣기 확인', cost: ACTION_COSTS.eavesdrop, desc: 'NPC들의 대화를 엿듣습니다.', onConfirm: handleConfirmEavesdrop };
            case 'hp_warning_intercept':
                return { title: '끼어들기 확인', cost: ACTION_COSTS.eavesdropJoin, desc: '대화에 끼어듭니다. 추가 HP가 소모됩니다.', onConfirm: handleConfirmIntercept };
            case 'hp_warning_listen':
                return { title: '엿듣기 계속 확인', cost: ACTION_COSTS.eavesdropContinue, desc: 'NPC들의 대화를 더 엿듣습니다.', onConfirm: handleConfirmListen };
            default: return null;
        }
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

                    <IngameSidebarMenu
                        currentFloorId={currentFloorId}
                        currentRoomId={currentRoomId}
                        onNavigate={handleMove}
                        onPanelStateChange={handleSidebarPanelStateChange}
                        onSidebarVisibleChange={handleSidebarVisibleChange}
                    />

            {/* NPC Interaction Panel */}
            {npcsInRoom.length > 0 && !isChatActive && eavesdropState !== 'preview' && eavesdropState !== 'choice' && eavesdropState !== 'done' && (
                <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20 flex flex-col gap-2 min-w-[200px]">
                    <span className="text-xs text-gray-400 mb-1">
                        현재 방: {npcsInRoom.map(id => npcData?.[id]?.name || id).join(', ')}
                    </span>

                    {/* 1:1 대화하기 */}
                    <button
                        onClick={handleStartChatClick}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                    >
                        💬 {activeNpc?.name}와 대화하기
                        <span className="text-xs text-blue-200">({ACTION_COSTS.npcChat} HP)</span>
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

            <GameHUD
                mapInfo={mapInfo}
                activeNpc={activeNpc}
                secondaryNpc={npcsInRoom.length > 1 ? secondaryNpc : undefined}
                logs={logs}
                dialogContent={dialogContent}
                isThinking={isThinking}
                onSend={eavesdropState === 'chatting' ? handleSend : undefined}
                inputText={eavesdropState === 'chatting' ? inputText : ''}
                setInputText={eavesdropState === 'chatting' ? setInputText : () => {}}
                viewMode={eavesdropState === 'chatting' ? viewMode : (isChatActive ? 'hidden' : viewMode)}
                onToggleHidden={handleToggleHidden}
                onToggleExpand={handleToggleExpand}
                isPhoneOpen={false}
                theme="corrupted"
                onToggleNpc={npcsInRoom.length > 1 && !isChatActive ? toggleNpc : undefined}
                presentedItem={presentedItem}
                onClearPresentation={clearPresentation}
                showViewControls={true}
                isSidebarVisible={isSidebarVisible}
                chatRightInset="24px"
            />

            {/* Navigation Confirmation Popup */}
            <NavigationConfirmation
                isOpen={!!pendingMove}
                targetLabel={pendingMove?.label}
                onConfirm={confirmMove}
                onCancel={cancelMove}
            />

            {/* Section Transition Overlay */}
            <SectionTransitionOverlay />

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

            {/* === Eavesdrop / Intercept Chat UI === */}
            {(eavesdropState === 'preview' || eavesdropState === 'choice' || eavesdropState === 'intercepting' || eavesdropState === 'listening' || eavesdropState === 'done') && (
                <div className="absolute inset-0 z-30 flex flex-col pointer-events-none">
                    {/* Eavesdrop Logs */}
                    <div className="flex-1" />
                    <div className="pointer-events-auto max-h-[60%] flex flex-col" style={{ marginLeft: '340px', marginRight: '24px', marginBottom: '24px' }}>
                        {/* Log area */}
                        <div className="flex-1 overflow-y-auto bg-gradient-to-t from-gray-900/95 to-gray-900/70 rounded-t-xl p-4 backdrop-blur-sm" style={{ maxHeight: '300px' }}>
                            {eavesdropLogs.map(log => (
                                <div key={log.id} className={`mb-2 px-3 py-2 rounded-lg ${log.type === 'eavesdrop_preview' || log.type === 'eavesdrop_listen' ? 'bg-purple-900/30 border-l-2 border-purple-500 italic' : log.type === 'user' ? 'bg-blue-900/30 text-right' : 'bg-gray-800/50'}`}>
                                    <span className="text-xs text-gray-400 font-bold">{log.speaker}</span>
                                    <p className="text-sm text-white/90">{log.text}</p>
                                </div>
                            ))}
                            {isEavesdropThinking && <div className="text-xs text-purple-300 animate-pulse px-3">생각 중...</div>}
                        </div>

                        {/* Dialog Box */}
                        {eavesdropDialogContent && (
                            <div className="bg-black/90 backdrop-blur-sm border-t border-white/20 px-6 py-4 rounded-b-xl">
                                <span className="text-xs text-purple-300 font-bold">{eavesdropDialogContent.speaker}</span>
                                <p className="text-base text-white/90 mt-1">{eavesdropDialogContent.text}</p>
                            </div>
                        )}

                        {/* Choice Buttons */}
                        {eavesdropState === 'choice' && (
                            <div className="flex gap-3 mt-3">
                                <button
                                    onClick={handleInterceptChoice}
                                    className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-bold text-white transition-colors shadow-lg"
                                >
                                    🗣️ 끼어들기 ({ACTION_COSTS.eavesdropJoin} HP)
                                </button>
                                <button
                                    onClick={handleListenChoice}
                                    className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 rounded-xl text-sm font-bold text-white transition-colors shadow-lg"
                                >
                                    👂 엿듣기 계속 ({ACTION_COSTS.eavesdropContinue} HP)
                                </button>
                            </div>
                        )}

                        {/* Intercept Input */}
                        {eavesdropState === 'intercepting' && (
                            <div className="flex gap-2 mt-2 bg-black/80 p-3 rounded-xl">
                                <input
                                    type="text"
                                    value={eavesdropInputText}
                                    onChange={(e) => setEavesdropInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleInterceptSend()}
                                    placeholder={`대화에 끼어들기... (${interceptTurnCount}/${MAX_INTERCEPT_TURNS})`}
                                    className="flex-1 bg-transparent border border-white/20 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                                    disabled={isEavesdropThinking || interceptTurnCount >= MAX_INTERCEPT_TURNS}
                                    autoFocus
                                />
                                <button
                                    onClick={handleInterceptSend}
                                    disabled={isEavesdropThinking || !eavesdropInputText.trim()}
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-bold text-white disabled:opacity-50 transition-colors"
                                >
                                    전송
                                </button>
                            </div>
                        )}

                        {/* Listening progress */}
                        {eavesdropState === 'listening' && (
                            <div className="mt-2 bg-black/60 p-3 rounded-xl text-center">
                                <span className="text-sm text-purple-300">엿듣는 중... ({eavesdropAutoIndex}/10)</span>
                            </div>
                        )}

                        {/* Done */}
                        {eavesdropState === 'done' && (
                            <div className="flex justify-center mt-3">
                                <button
                                    onClick={handleCloseEavesdrop}
                                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-bold text-white transition-colors"
                                >
                                    닫기
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
            </MapContainer>
        </div>
    );
};

export default MainGameScene;

