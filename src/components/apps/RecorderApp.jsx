import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Mic, Save, AlertCircle, Check } from 'lucide-react';
import { useGame } from '../../context/GameContext';

const RecorderApp = ({ onBack }) => {
    const {
        hp,
        updateHp,
        addCustomItem,
        currentLocationInfo, // To be added to GameContext
        npcData
    } = useGame();

    const chatLogs = []; // 전역 대화 로직 제거됨

    const [status, setStatus] = useState('idle'); // idle, processing, success, error

    const handleSave = () => {
        if (hp < 10) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
            return;
        }

        if (!chatLogs || chatLogs.length === 0) {
            alert("저장할 대화 내용이 없습니다.");
            return;
        }

        // Deduct HP
        updateHp(-10);

        // Determine NPC Name (from last active NPC or generic)
        const lastNpcLog = [...chatLogs].reverse().find(l => l.type === 'npc' || l.type === 'active_npc');
        const npcName = lastNpcLog ? lastNpcLog.speaker : '알 수 없음';

        // Determine Location
        const locationName = currentLocationInfo ? currentLocationInfo.highlightText : '알 수 없는 장소';

        // Create Item
        const timestamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        const newItem = {
            id: `transcript_${Date.now()}`,
            name: `[녹음] ${npcName}와의 대화`,
            description: `${locationName}에서 ${npcName}와(과) 나눈 대화 기록이다. (${timestamp})`,
            content: chatLogs, // Store full logs
            type: 'transcript',
            icon: '📼',
            timestamp: Date.now()
        };

        addCustomItem(newItem);
        setStatus('success');
    };

    return (
        <div className="w-full h-full bg-gray-900 text-white flex flex-col pt-12 relative overflow-hidden">
            {/* Header */}
            <div className="px-4 pb-4 flex items-center justify-between z-10 sticky top-0 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center space-x-2">
                    <button onClick={onBack} className="p-1 -ml-1 hover:bg-gray-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-xl font-bold flex items-center">
                        <Mic className="w-5 h-5 mr-2 text-red-500 animate-pulse" />
                        Recorder
                    </h1>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${hp < 10 ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-gray-400'}`}>
                    HP: {hp}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">

                <div className="w-32 h-32 rounded-full bg-gray-800 border-4 border-gray-700 flex items-center justify-center relative shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-full h-full absolute rounded-full bg-red-500/10"
                    />
                    <Mic className="w-12 h-12 text-gray-400" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-lg font-bold">대화 기록 저장</h2>
                    <p className="text-sm text-gray-400">
                        현재 활성화된 대화 기록을<br />인벤토리에 저장하시겠습니까?
                    </p>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 w-full">
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-400">저장 비용</span>
                        <span className="text-red-400 font-bold">-10 HP</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">대화 라인 수</span>
                        <span className="text-white font-bold">{chatLogs.length} 줄</span>
                    </div>
                </div>

                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center text-red-400 text-sm font-bold bg-red-900/20 px-4 py-2 rounded-lg"
                    >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        HP가 부족합니다!
                    </motion.div>
                )}

                {status === 'success' ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center text-green-400 space-y-2"
                    >
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6" />
                        </div>
                        <span className="font-bold">저장되었습니다!</span>
                        <button
                            onClick={onBack}
                            className="mt-4 text-xs underline text-gray-500 hover:text-white"
                        >
                            돌아가기
                        </button>
                    </motion.div>
                ) : (
                    <button
                        onClick={handleSave}
                        disabled={chatLogs.length === 0}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${chatLogs.length === 0
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-lg hover:shadow-red-900/50'
                            }`}
                    >
                        <Save className="w-5 h-5" />
                        <span>저장하기 (10 HP)</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default RecorderApp;
