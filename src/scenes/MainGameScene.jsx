import React, { useState, useEffect } from 'react';
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
    
    // NPC Session State -> Free chat count logic
    const [freeChatCount, setFreeChatCount] = useState(0);



    // Map Info (Dynamic based on currentRoomId)
    const mapInfo = mapData?.[currentRoomId] || {};

    // Update active NPC from computed room schedule
    useEffect(() => {
        if (npcsInRoom.length > 0 && npcData) {
            // First NPC becomes active (primary interaction target)
            const primaryNpc = npcData[npcsInRoom[0]] || null;
            setActiveNpc(primaryNpc);
            console.log(`[Schedule] Room: ${currentRoomId}, Day: ${currentDay}, Period: ${currentPeriod}, NPCs:`, npcsInRoom);
        } else {
            setActiveNpc(null);
        }
        
        // Reset chat session on move
        setFreeChatCount(0);
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
            />

            <IngameSidebarMenu
                currentFloorId={currentFloorId}
                currentRoomId={currentRoomId}
                onNavigate={handleMove}
            />

            {/* Multi-NPC indicator */}
            {npcsInRoom.length > 1 && (
                <div className="absolute top-4 right-4 z-20 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                    <span className="text-xs text-gray-300">
                        현재 방에 {npcsInRoom.length}명: {npcsInRoom.map(id => npcData?.[id]?.name || id).join(', ')}
                    </span>
                    <button 
                        onClick={toggleNpc}
                        className="ml-2 px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-xs"
                    >
                        대상 변경
                    </button>
                </div>
            )}

            <GameHUD
                mapInfo={mapInfo}
                activeNpc={activeNpc}
                logs={logs}
                dialogContent={dialogContent}
                isThinking={isThinking}
                onSend={handleSend}
                inputText={inputText}
                setInputText={setInputText}
                viewMode={viewMode}
                onToggleHidden={handleToggleHidden}
                onToggleExpand={handleToggleExpand}
                isPhoneOpen={false}
                theme="corrupted"
                onToggleNpc={npcsInRoom.length > 1 ? toggleNpc : undefined}
                presentedItem={presentedItem}
                onClearPresentation={clearPresentation}
                showViewControls={false}
                locationLeftInset="340px"
                chatLeftInset="340px"
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
                        // Add log for item pickup
                        setLogs(prev => [...prev, {
                            id: Date.now() + '_item_pickup',
                            speaker: 'System',
                            text: `[${ITEMS[pendingItem]?.name}] 을(를) 획득했습니다.`,
                            type: 'system_action'
                        }]);
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
                </div>
            </MapContainer>
        </div>
    );
};

export default MainGameScene;

