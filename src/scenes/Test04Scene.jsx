import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useViewMode } from '../hooks/useViewMode';
import GameHUD from '../components/GameHUD';

import MapInteractiveLayer from '../components/MapInteractiveLayer';
import { useInteraction } from '../hooks/useInteraction';
import NavigationConfirmation from '../components/NavigationConfirmation';
import ItemPickupModal from '../components/ItemPickupModal';
import FishEyeEffect from '../components/FishEyeEffect';
import useFishVisuals from '../hooks/useFishVisuals';

const Test04Scene = ({ isPhoneOpen, onTogglePhone }) => {
    const { viewMode, setViewMode, handleToggleHidden, handleToggleExpand } = useViewMode('mini');
    const [inputText, setInputText] = useState('');

    // Start from outside01
    const [currentRoomId, setCurrentRoomId] = useState('outside01');

    const { mapData, floorData, isLoading, setCurrentLocationInfo, addItem, ITEMS, inventory: currentInventory } = useGame();

    const handleMove = (targetId) => {
        console.log("Test04 Moving to:", targetId);
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

    // Interaction hook
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
        inventory: currentInventory
    });

    // Map Info
    const mapInfo = mapData?.[currentRoomId] || {};

    const [isThinking, setIsThinking] = useState(false);

    // Fish Visual Effects
    const { fishTier, mapEffects, mapFilter, mapTransform, waveFilterId } = useFishVisuals();

    // Initialize location info
    useEffect(() => {
        if (floorData) {
            const floor = floorData.find(f => f.rooms.some(r => r.id === currentRoomId));
            if (floor) {
                setCurrentLocationInfo({
                    floorId: floor.id,
                    roomId: currentRoomId
                });
            }
        }
    }, [floorData]);

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
            <FishEyeEffect fishTier={fishTier} mapEffects={mapEffects} waveFilterId={waveFilterId} />

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
                onSend={() => { }}
                inputText={inputText}
                setInputText={setInputText}
                viewMode={viewMode}
                onToggleHidden={handleToggleHidden}
                onToggleExpand={handleToggleExpand}
                isPhoneOpen={isPhoneOpen}
                onTogglePhone={onTogglePhone}
                theme="basic"
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

export default Test04Scene;
