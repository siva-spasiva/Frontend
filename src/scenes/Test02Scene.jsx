import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateAIResponse } from '../utils/aiService';
import { useGame } from '../context/GameContext';
import { useViewMode } from '../hooks/useViewMode';
import GameHUD from '../components/GameHUD';

import MapInteractiveLayer from '../components/MapInteractiveLayer';
import { useInteraction } from '../hooks/useInteraction';
import NavigationConfirmation from '../components/NavigationConfirmation';

const Test02Scene = ({ isPhoneOpen, onTogglePhone }) => {
    // viewMode: 'full' (Logs + Dialog + Input), 'mini' (Dialog + Input), 'hidden' (Button only)
    const { viewMode, setViewMode, handleToggleHidden, handleToggleExpand } = useViewMode('mini');
    const [inputText, setInputText] = useState('');

    // Active Room State
    const [currentRoomId, setCurrentRoomId] = useState('room001');

    const handleMove = (targetId) => {
        console.log("Moving to:", targetId);
        setCurrentRoomId(targetId);
        
        // Sync to GameContext for MapApp
        // We find the floor that contains this room
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
        setDialogContent, // Exposed if needed for chat
        setLogs // Exposed if needed for chat
    } = useInteraction({ viewMode, setViewMode, onMove: handleMove });

    const [isThinking, setIsThinking] = useState(false);

    const { npcData, mapData, floorData, isLoading, setCurrentLocationInfo } = useGame();

    // Active NPC State - Configured for Empty Room
    const [activeNpc, setActiveNpc] = useState(null);

    // Map Info (Dynamic based on currentRoomId)
    const mapInfo = mapData?.[currentRoomId] || {};

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg = inputText;
        setInputText(''); // Clear input
        
        // ... (rest of logic can stay, or we disable chat if no NPC)
        // If there's no NPC, we probably shouldn't be chatting, but leaving logic for future use is fine.
        // Or we can simple make it "System" response if no activeNpc.
        /* 
        Chat Logic...
        */
       
    };
    
    // ...

    // Interaction handled by useInteraction hook

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
                onSend={() => {}} // Disabled Chat
                inputText={inputText}
                setInputText={setInputText}
                viewMode={viewMode}
                onToggleHidden={handleToggleHidden}
                onToggleExpand={handleToggleExpand}
                isPhoneOpen={isPhoneOpen}
                onTogglePhone={onTogglePhone}
                // No onToggleNpc
                theme="corrupted"
            />

            {/* Navigation Confirmation Popup */}
            <NavigationConfirmation
                isOpen={!!pendingMove}
                targetLabel={pendingMove?.label}
                onConfirm={confirmMove}
                onCancel={cancelMove}
            />
        </motion.div>
    );
};

export default Test02Scene;
