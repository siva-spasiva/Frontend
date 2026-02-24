import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { generateAIResponse } from '../utils/aiService';
import { useViewMode } from '../hooks/useViewMode';
import GameHUD from '../components/GameHUD';
import FishEyeEffect from '../components/FishEyeEffect';
import SectionTransitionOverlay from '../components/SectionTransitionOverlay';
import useFishVisuals from '../hooks/useFishVisuals';
import IngameSidebarMenu from '../components/IngameSidebarMenu';
import MapContainer from '../components/MapContainer';

const Test03Scene = () => {
    // viewMode: 'full' (Logs + Dialog + Input), 'mini' (Dialog + Input), 'hidden' (Button only)
    const { viewMode, setViewMode, handleToggleHidden, handleToggleExpand } = useViewMode('mini');
    const [inputText, setInputText] = useState('');
    const [currentRoomId, setCurrentRoomId] = useState('umi_class');

    // History logs
    const [logs, setLogs] = useState([]);

    // Current Dialog (Active Message)
    const [dialogContent, setDialogContent] = useState(null);

    const [isThinking, setIsThinking] = useState(false);

    // Access Global Stats and Data
    const { syncStats, npcData, mapData, floorData, isLoading, spendHp, ACTION_COSTS, setCurrentLocationInfo } = useGame();

    // Item Presentation
    const { presentedItem, clearPresentation, setActiveNpcInField } = useGame();

    // Fish Visual Effects
    const { fishTier, mapEffects, mapFilter, mapTransform, waveFilterId } = useFishVisuals();

    // NPC State
    const [activeNpc, setActiveNpc] = useState(null);

    // Initialize NPC from data once loaded
    React.useEffect(() => {
        if (!isLoading && npcData && !activeNpc) {
            setActiveNpc(npcData.npc_a);
        }
    }, [isLoading, npcData, activeNpc]);

    // Sync activeNpc to GameContext for InventoryApp presentation awareness
    React.useEffect(() => {
        setActiveNpcInField(activeNpc);
        return () => setActiveNpcInField(null); // Clear on unmount
    }, [activeNpc, setActiveNpcInField]);

    // Map Info
    const mapInfo = mapData?.[currentRoomId] || {};
    const currentFloorId = floorData?.find((floor) => floor.rooms.some((room) => room.id === currentRoomId))?.id || '1F';

    React.useEffect(() => {
        setCurrentLocationInfo({
            floorId: currentFloorId,
            roomId: currentRoomId,
        });
    }, [currentFloorId, currentRoomId, setCurrentLocationInfo]);

    const handleMove = (targetRoomId) => {
        if (!targetRoomId) return;
        setCurrentRoomId(targetRoomId);
    };


    const handleSend = async () => {
        if (!inputText.trim()) return;

        // HP cost for NPC chat
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
                type: 'npc'
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
            const targetNpc = activeNpc || npcData.npc_a;

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

            // Auto-spawn NPC if not present when they speak
            if (!activeNpc) {
                setActiveNpc(targetNpc);
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
        } finally {
            setIsThinking(false);
        }
    };

    const toggleNpc = () => {
        if (activeNpc) setActiveNpc(null);
        else setActiveNpc(npcData.npc_a);
    };

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

            {/* Section Transition Overlay */}
            <SectionTransitionOverlay />

            <IngameSidebarMenu
                currentFloorId={currentFloorId}
                currentRoomId={currentRoomId}
                onNavigate={handleMove}
            />

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
                onToggleNpc={toggleNpc}
                theme="basic"
                presentedItem={presentedItem}
                onClearPresentation={clearPresentation}
                showViewControls={false}
                locationLeftInset="340px"
                chatLeftInset="340px"
                chatRightInset="24px"
            />
                </div>
            </MapContainer>
        </div>
    );
};

export default Test03Scene;
