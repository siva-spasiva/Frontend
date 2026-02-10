import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useViewMode } from '../hooks/useViewMode';
import GameHUD from '../components/GameHUD';

import MapInteractiveLayer from '../components/MapInteractiveLayer';
import { useInteraction } from '../hooks/useInteraction';
import NavigationConfirmation from '../components/NavigationConfirmation';
import ItemPickupModal from '../components/ItemPickupModal';

const Test05Scene = ({ isPhoneOpen, onTogglePhone }) => {
    // viewMode: 'full' (Logs + Dialog + Input), 'mini' (Dialog + Input), 'hidden' (Button only)
    const { viewMode, setViewMode, handleToggleHidden, handleToggleExpand } = useViewMode('mini');
    const [inputText, setInputText] = useState('');

    // Active Room State - Starts in Warehouse Main
    const [currentRoomId, setCurrentRoomId] = useState('storage_main');

    const { npcData, mapData, floorData, isLoading, setCurrentLocationInfo, addItem, ITEMS, inventory: currentInventory } = useGame();

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

    const [isThinking, setIsThinking] = useState(false);

    // Active NPC State - Configured for Empty Room
    const [activeNpc, setActiveNpc] = useState(null);

    // Map Info (Dynamic based on currentRoomId)
    const mapInfo = mapData?.[currentRoomId] || {};

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full h-full relative bg-gray-900 text-white overflow-hidden"
            style={{
                backgroundImage: mapInfo.background,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Interactive Layer */}
            <MapInteractiveLayer
                mapInfo={mapInfo}
                onInteract={handleInteraction}
            />

            <GameHUD
                mapInfo={mapInfo}
                activeNpc={null}
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
