import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { motion } from 'framer-motion';
import { generateAIResponse } from '../utils/aiService';
import { useViewMode } from '../hooks/useViewMode';
import GameHUD from '../components/GameHUD';

const Test03Scene = ({ isPhoneOpen, onTogglePhone }) => {
    // viewMode: 'full' (Logs + Dialog + Input), 'mini' (Dialog + Input), 'hidden' (Button only)
    const { viewMode, setViewMode, handleToggleHidden, handleToggleExpand } = useViewMode('mini');
    const [inputText, setInputText] = useState('');

    // History logs
    const [logs, setLogs] = useState([]);

    // Current Dialog (Active Message)
    const [dialogContent, setDialogContent] = useState(null);

    const [isThinking, setIsThinking] = useState(false);

    // Access Global Stats and Data
    const { syncStats, npcData, mapData, isLoading } = useGame();

    // Item Presentation
    const { presentedItem, clearPresentation, setActiveNpcInField } = useGame();

    // NPC State
    const [activeNpc, setActiveNpc] = useState(null);

    // Initialize NPC from data once loaded
    React.useEffect(() => {
        if (!isLoading && npcData && !activeNpc) {
            setActiveNpc(npcData.npc_a);
        }
    }, [isLoading, npcData]);

    // Sync activeNpc to GameContext for InventoryApp presentation awareness
    React.useEffect(() => {
        setActiveNpcInField(activeNpc);
        return () => setActiveNpcInField(null); // Clear on unmount
    }, [activeNpc, setActiveNpcInField]);

    // Map Info
    const mapInfo = mapData?.umi_class || {}; // Safe access

    // Sync state to GameContext for RecorderApp
    const { setChatLogs, setCurrentLocationInfo } = useGame();

    React.useEffect(() => {
        // Include active dialog (response) in the synced logs so transcripts catch the latest message
        if (dialogContent) {
            setChatLogs([...logs, { ...dialogContent, id: 'active_last', type: 'npc' }]);
        } else {
            setChatLogs(logs);
        }
    }, [logs, dialogContent, setChatLogs]);

    React.useEffect(() => {
        if (mapInfo && mapInfo.namePrefix) {
            setCurrentLocationInfo(mapInfo);
        }
    }, [mapInfo, setCurrentLocationInfo]);


    const handleSend = async () => {
        if (!inputText.trim()) return;

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
                isPhoneOpen={isPhoneOpen}
                onTogglePhone={onTogglePhone}
                onToggleNpc={toggleNpc}
                theme="basic"
                presentedItem={presentedItem}
                onClearPresentation={clearPresentation}
            />
        </motion.div>
    );
};

export default Test03Scene;
