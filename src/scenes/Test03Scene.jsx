import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { generateAIResponse } from '../utils/aiService';
import { UserPlus, UserMinus } from 'lucide-react';
import SmartphoneMenu from '../components/SmartphoneMenu';
import PortraitDisplay from '../components/PortraitDisplay';

const Test03Scene = ({ isPhoneOpen, onTogglePhone }) => {
    // viewMode: 'full' (Logs + Dialog + Input), 'mini' (Dialog + Input), 'hidden' (Button only)
    const [viewMode, setViewMode] = useState('mini');
    const [inputText, setInputText] = useState('');

    // History logs
    const [logs, setLogs] = useState([]);

    // Current Dialog (Active Message)
    const [dialogContent, setDialogContent] = useState(null);

    const [isThinking, setIsThinking] = useState(false);

    // Access Global Stats and Data
    const { syncStats, npcData, mapData, isLoading } = useGame();

    // NPC State
    const [activeNpc, setActiveNpc] = useState(null);

    // Initialize NPC from data once loaded
    // Using useEffect to set initial NPC if not set
    React.useEffect(() => {
        if (!isLoading && npcData && !activeNpc) {
            setActiveNpc(npcData.npc_a);
        }
    }, [isLoading, npcData]);

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

        setLogs(newLogs);

        // 3. Temporary clear dialog to show thinking state in the main box
        setDialogContent(null);

        // If hidden, auto-show to mini to see response
        if (viewMode === 'hidden') setViewMode('mini');

        try {
            // Default to NPC A if no active NPC, or use active NPC
            const targetNpc = activeNpc || npcData.npc_a;

            const data = await generateAIResponse(userMsg, {
                npcId: targetNpc.id
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

    const handleToggleHidden = () => {
        if (viewMode === 'hidden') setViewMode('mini');
        else setViewMode('hidden');
    };

    const handleToggleExpand = () => {
        if (viewMode === 'full') setViewMode('mini');
        else setViewMode('full');
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
            {/* Dark Overlay for Readability */}
            <div className={`absolute inset-0 ${mapInfo.overlayColor} pointer-events-none`} />

            {/* Location Info */}
            <motion.div
                className="absolute top-8 z-10 pointer-events-none"
                animate={{ left: isPhoneOpen ? '450px' : '40px' }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                <div className="flex items-center space-x-2 text-gray-400 mb-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-mono tracking-widest uppercase shadow-black drop-shadow-md">Location Information</span>
                </div>
                {/* Updated Map Name */}
                <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tighter drop-shadow-lg shadow-black">
                    {mapInfo.namePrefix} <span className={mapInfo.highlightColor}>{mapInfo.highlightText}</span>
                </h1>
                <p className={`text-sm text-gray-300 max-w-md leading-relaxed border-l-2 ${mapInfo.highlightColor.replace('text', 'border')} pl-4 bg-black/30 p-2 rounded-r backdrop-blur-sm`}>
                    {mapInfo.description}
                </p>
            </motion.div>

            {/* Portrait Placeholder - Conditional Rendering */}
            <PortraitDisplay activeNpc={activeNpc} />

            <SmartphoneMenu
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
                theme="basic"
            >
                {/* Debug Button to Toggle NPC passed as child */}
                <motion.button
                    onClick={toggleNpc}
                    className={`w-12 h-12 flex items-center justify-center bg-blue-500/30 hover:bg-blue-500/50 text-white rounded-full backdrop-blur-md border border-white/20 shadow-lg`}
                >
                    {activeNpc ? <UserMinus className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </motion.button>
            </SmartphoneMenu>
        </motion.div>
    );
};

export default Test03Scene;
