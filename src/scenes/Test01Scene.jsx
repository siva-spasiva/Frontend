import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateAIResponse } from '../utils/aiService';
import { useGame } from '../context/GameContext';
import SmartphoneMenu from '../components/SmartphoneMenu';

const Test01Scene = ({ isPhoneOpen, onTogglePhone }) => {
    // viewMode: 'full' (Logs + Dialog + Input), 'mini' (Dialog + Input), 'hidden' (Button only)
    const [viewMode, setViewMode] = useState('mini');
    const [inputText, setInputText] = useState('');

    // History logs
    const [logs, setLogs] = useState([]);

    // Current Dialog (Active Message)
    const [dialogContent, setDialogContent] = useState(null);

    const [isThinking, setIsThinking] = useState(false);

    const { npcData, mapData, isLoading } = useGame();

    // Active NPC State
    const [activeNpc, setActiveNpc] = useState(null);

    useEffect(() => {
        if (!isLoading && npcData && !activeNpc) {
            setActiveNpc(npcData.npc_a);
        }
    }, [isLoading, npcData]);

    // Map Info
    const mapInfo = mapData?.test01 || {};

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
            // Use the prompt from the active NPC
            const targetNpc = activeNpc || npcData.npc_a;
            const data = await generateAIResponse(userMsg, {
                npcId: targetNpc?.id // e.g. 'npc_a'
            });

            setDialogContent({
                speaker: activeNpc.name,
                text: data.response,
                type: 'active_npc'
            });
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

    const toggleViewMode = () => {
        if (viewMode === 'full') setViewMode('mini');
        else if (viewMode === 'mini') setViewMode('hidden');
        else setViewMode('full');
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full h-full relative bg-gray-900 text-white overflow-hidden"
        >
            {/* Location Info */}
            <motion.div
                className="absolute top-8 z-10 pointer-events-none"
                animate={{ left: isPhoneOpen ? '450px' : '40px' }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-mono tracking-widest uppercase">Location Information</span>
                </div>
                <h1 className="text-4xl font-extrabold text-gray-200 mb-2 tracking-tighter">
                    {mapInfo.namePrefix} <span className={mapInfo.highlightColor}>{mapInfo.highlightText}</span>
                </h1>
                <p className="text-sm text-gray-400 max-w-md leading-relaxed border-l-2 border-gray-700 pl-4">
                    {mapInfo.description}
                </p>
            </motion.div>

            {/* Portrait Area */}
            <div className="absolute right-0 top-0 h-full w-96 bg-gray-800/20 border-l border-gray-700/30 flex items-end justify-center pointer-events-none z-0 backdrop-blur-[2px]">
                <AnimatePresence mode="wait">
                    {activeNpc && (
                        <motion.img
                            key={activeNpc.id}
                            src={activeNpc.portraits?.default || activeNpc.initialPortrait}
                            alt={activeNpc.name}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="max-h-[80%] max-w-full object-contain mb-0 shadow-2xl drop-shadow-2xl"
                        />
                    )}
                </AnimatePresence>
            </div>

            <SmartphoneMenu
                logs={logs}
                dialogContent={dialogContent}
                isThinking={isThinking}
                onSend={handleSend}
                inputText={inputText}
                setInputText={setInputText}
                viewMode={viewMode}
                onToggleViewMode={toggleViewMode}
                isPhoneOpen={isPhoneOpen}
                onTogglePhone={onTogglePhone}
                theme="basic"
            />
        </motion.div>
    );
};

export default Test01Scene;
