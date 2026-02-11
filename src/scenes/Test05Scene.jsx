import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useViewMode } from '../hooks/useViewMode';
import GameHUD from '../components/GameHUD';

import PortraitDisplay from '../components/PortraitDisplay';
import MapInteractiveLayer from '../components/MapInteractiveLayer';
import { useInteraction } from '../hooks/useInteraction';
import NavigationConfirmation from '../components/NavigationConfirmation';
import ItemPickupModal from '../components/ItemPickupModal';
import FishEyeEffect from '../components/FishEyeEffect';
import useFishVisuals from '../hooks/useFishVisuals';

const Test05Scene = ({ isPhoneOpen, onTogglePhone }) => {
    // viewMode: 'full' (Logs + Dialog + Input), 'mini' (Dialog + Input), 'hidden' (Button only)
    const { viewMode, setViewMode, handleToggleHidden, handleToggleExpand } = useViewMode('mini');
    const [inputText, setInputText] = useState('');

    // Active Room State - Starts in Warehouse Main
    const [currentRoomId, setCurrentRoomId] = useState('storage_main');

    const { npcData, mapData, floorData, isLoading, setCurrentLocationInfo, addItem, ITEMS, inventory: currentInventory, getNpcsForRoom, currentDay, currentPeriod } = useGame();

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
        setDialogContent,
        setLogs
    } = useInteraction({
        viewMode,
        setViewMode,
        onMove: handleMove,
        inventory: currentInventory // Pass current inventory to check for existing items
    });

    // Active NPC State - Driven by schedule
    const [activeNpc, setActiveNpc] = useState(null);
    // All NPCs in current room (for future multi-NPC support)
    const [npcsInRoom, setNpcsInRoom] = useState([]);

    // Map Info (Dynamic based on currentRoomId)
    const mapInfo = mapData?.[currentRoomId] || {};

    // Update NPC presence when room, day, or period changes
    useEffect(() => {
        const npcIds = getNpcsForRoom(currentRoomId);
        setNpcsInRoom(npcIds);

        if (npcIds.length > 0 && npcData) {
            // First NPC becomes active (primary interaction target)
            const primaryNpc = npcData[npcIds[0]] || null;
            setActiveNpc(primaryNpc);
            console.log(`[Schedule] Room: ${currentRoomId}, Day: ${currentDay}, Period: ${currentPeriod}, NPCs:`, npcIds);
        } else {
            setActiveNpc(null);
        }
    }, [currentRoomId, currentDay, currentPeriod, npcData]);

    const [isThinking, setIsThinking] = useState(false);

    // Fish Visual Effects
    const { fishTier, mapEffects, mapFilter, mapTransform } = useFishVisuals();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
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
            <FishEyeEffect fishTier={fishTier} mapEffects={mapEffects} />

            {/* Interactive Layer */}
            <MapInteractiveLayer
                mapInfo={mapInfo}
                onInteract={handleInteraction}
            />

            {/* NPC Portrait */}
            <PortraitDisplay
                activeNpc={activeNpc}
                viewMode={viewMode}
                isPhoneOpen={isPhoneOpen}
            />

            {/* Multi-NPC indicator */}
            {npcsInRoom.length > 1 && (
                <div className="absolute top-4 right-4 z-20 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                    <span className="text-xs text-gray-300">
                        현재 방에 {npcsInRoom.length}명: {npcsInRoom.map(id => npcData?.[id]?.name || id).join(', ')}
                    </span>
                </div>
            )}

            <GameHUD
                mapInfo={mapInfo}
                activeNpc={activeNpc}
                logs={logs}
                dialogContent={dialogContent}
                isThinking={isThinking}
                onSend={() => { }} // Disabled Chat
                inputText={inputText}
                setInputText={setInputText}
                viewMode={viewMode}
                onToggleHidden={handleToggleHidden}
                onToggleExpand={handleToggleExpand}
                isPhoneOpen={isPhoneOpen}
                onTogglePhone={onTogglePhone}
                theme="corrupted"
            />

            {/* Navigation Confirmation Popup */}
            <NavigationConfirmation
                isOpen={!!pendingMove}
                targetLabel={pendingMove?.label}
                onConfirm={confirmMove}
                onCancel={cancelMove}
            />

            {/* Item Pickup Modal */}
            <ItemPickupModal
                isOpen={!!pendingItem}
                item={pendingItem ? ITEMS[pendingItem] : null}
                onClose={resolveItem}
                onCollect={() => {
                    if (pendingItem) {
                        addItem(pendingItem);
                        // Optional: Add log for item pickup
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
        </motion.div>
    );
};

export default Test05Scene;
