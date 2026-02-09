import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateAIResponse } from '../utils/aiService';
import { useGame } from '../context/GameContext';
import { useViewMode } from '../hooks/useViewMode';
import GameHUD from '../components/GameHUD';

import MapInteractiveLayer from '../components/MapInteractiveLayer';

const Test02Scene = ({ isPhoneOpen, onTogglePhone }) => {
    // viewMode: 'full' (Logs + Dialog + Input), 'mini' (Dialog + Input), 'hidden' (Button only)
    const { viewMode, setViewMode, handleToggleHidden, handleToggleExpand } = useViewMode('mini');
    const [inputText, setInputText] = useState('');

    // History logs
    const [logs, setLogs] = useState([]);

    // Current Dialog (Active Message)
    const [dialogContent, setDialogContent] = useState(null);

    const [isThinking, setIsThinking] = useState(false);

    const { npcData, mapData, isLoading } = useGame();

    // Active NPC State - Configured for Empty Room
    const [activeNpc, setActiveNpc] = useState(null);

    // Map Info
    const mapInfo = mapData?.room001 || {};

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

    const handleInteraction = (zone) => {
        console.log("Interacted with zone:", zone);

        // Add interaction log
        const timestamp = Date.now();
        const newLogs = [...logs];

        // Archive current dialog if exists
        if (dialogContent) {
            newLogs.push({
                ...dialogContent,
                id: timestamp + '_prev_npc',
                type: 'npc'
            });
            setDialogContent(null);
        }

        // Add System/Interaction Log
        newLogs.push({
            id: timestamp + '_interaction',
            speaker: 'System',
            text: `[${zone.label}] 을(를) 조사합니다.`,
            type: 'system_action'
        });

        // Show feedback in Dialog Box
        let responseText = zone.message || '특별한 것은 없어 보인다.';

        if (zone.type === 'move') {
            responseText = `[${zone.label}] 로 이동을 시도합니다... (구현 예정)`;
        }

        setDialogContent({
            speaker: 'System',
            text: responseText,
            type: 'system'
        });

        setLogs(newLogs);

        if (viewMode === 'hidden') setViewMode('mini');
    };

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
        </motion.div>
    );
};

export default Test02Scene;
