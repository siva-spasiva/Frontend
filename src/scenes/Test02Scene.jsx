import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateAIResponse } from '../utils/aiService';
import { useGame } from '../context/GameContext';
import { useViewMode } from '../hooks/useViewMode';
import GameHUD from '../components/GameHUD';

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

    // Active NPC State - Configured for Reporter in Test02
    const [activeNpc, setActiveNpc] = useState(null);

    useEffect(() => {
        if (!isLoading && npcData && !activeNpc) {
            setActiveNpc(npcData.reporter);
        }
    }, [isLoading, npcData]);

    // Map Info
    const mapInfo = mapData?.test02 || {};

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
            const targetNpc = activeNpc || npcData.reporter;
            const data = await generateAIResponse(userMsg, {
                npcId: targetNpc?.id || 'reporter'
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

    const toggleNpc = () => {
        if (activeNpc) setActiveNpc(null);
        else setActiveNpc(npcData.reporter);
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
                theme="corrupted"
            />
        </motion.div>
    );
};

export default Test02Scene;
