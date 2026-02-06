import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateAIResponse } from '../utils/aiService';
import { useGame } from '../context/GameContext';
import ContractModal from '../components/ContractModal';
import { FileText } from 'lucide-react';
import { useViewMode } from '../hooks/useViewMode';
import GameHUD from '../components/GameHUD';

const Test01Scene = ({ isPhoneOpen, onTogglePhone }) => {
    // viewMode: 'full' (Logs + Dialog + Input), 'mini' (Dialog + Input), 'hidden' (Button only)
    const { viewMode, setViewMode, handleToggleHidden, handleToggleExpand } = useViewMode('mini');
    const [inputText, setInputText] = useState('');

    // History logs
    const [logs, setLogs] = useState([]);

    // Current Dialog (Active Message)
    const [dialogContent, setDialogContent] = useState(null);

    const [isThinking, setIsThinking] = useState(false);

    // Contract Interaction State
    const [showContract, setShowContract] = useState(false);
    const [shake, setShake] = useState(false);

    const { npcData, mapData, isLoading, inventoryItems, addItem } = useGame();

    // Check if user already has contract
    const hasContract = inventoryItems && inventoryItems.some(i => i.id === 'item004' || i.isContract);

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

    const toggleNpc = () => {
        if (activeNpc) setActiveNpc(null);
        else setActiveNpc(npcData.npc_a);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`w-full h-full relative bg-gray-900 text-white overflow-hidden ${shake ? 'animate-shake' : ''}`}
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
            />

            {/* Contract Object (Clickable) - Rendered AFTER GameHUD to ensure access? Actually GameHUD has overlay in it. 
                If GameHUD has overlay, putting this here means it is ON TOP of overlay but maybe under phone. 
                Z-20 is safer.
            */}
            {!hasContract && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowContract(true)}
                    className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group"
                >
                    <div className="relative">
                        <div className="absolute -inset-4 bg-yellow-400/30 rounded-full blur-xl animate-pulse group-hover:bg-yellow-400/50 transition-all"></div>
                        <FileText className="w-16 h-16 text-yellow-100 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-yellow-400 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            살펴보기
                        </div>
                    </div>
                </motion.button>
            )}

            <ContractModal
                isOpen={showContract}
                onClose={() => setShowContract(false)}
                onSign={() => {
                    addItem('item004');
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                }}
            />
        </motion.div>
    );
};

export default Test01Scene;
