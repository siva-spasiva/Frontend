import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic, Save, AlertCircle, Check, List, FileText, Loader2 } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { saveRecording, fetchRecordingList, fetchRecording } from '../../api/records';

const RecorderApp = ({ onBack, chatLogs = [] }) => {
    const { spendHp, hp, ACTION_COSTS } = useGame();

    // Views: 'main' | 'list' | 'detail'
    const [view, setView] = useState('main');
    const [status, setStatus] = useState('idle'); // idle | saving | success | error
    const [errorMsg, setErrorMsg] = useState('');

    // List state
    const [recordings, setRecordings] = useState([]);
    const [listLoading, setListLoading] = useState(false);

    // Detail state
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // --- Save ---
    const handleSave = useCallback(async () => {
        if (!chatLogs || chatLogs.length === 0) {
            setErrorMsg('저장할 대화 내용이 없습니다.');
            setStatus('error');
            setTimeout(() => { setStatus('idle'); setErrorMsg(''); }, 2500);
            return;
        }

        const cost = ACTION_COSTS?.record ?? 10;
        if ((hp ?? 0) < cost) {
            setErrorMsg('HP가 부족합니다!');
            setStatus('error');
            setTimeout(() => { setStatus('idle'); setErrorMsg(''); }, 2500);
            return;
        }

        setStatus('saving');

        try {
            // Build messages payload
            const messages = chatLogs.map((log) => ({
                speaker: log.speaker || 'Unknown',
                text: log.text || '',
                type: log.type || 'system',
                ...(log.timestamp ? { timestamp: log.timestamp } : {}),
            }));

            // Build title from last NPC speaker
            const lastNpc = [...chatLogs].reverse().find(
                (l) => l.type === 'npc' || l.type === 'active_npc'
            );
            const title = lastNpc
                ? `${lastNpc.speaker}와의 대화`
                : '대화 기록';

            await saveRecording({ messages, title });

            // HP 차감
            if (spendHp) spendHp(cost);

            setStatus('success');
        } catch (err) {
            console.error('Recording save failed:', err);
            setErrorMsg('저장에 실패했습니다.');
            setStatus('error');
            setTimeout(() => { setStatus('idle'); setErrorMsg(''); }, 2500);
        }
    }, [chatLogs, hp, spendHp, ACTION_COSTS]);

    // --- List ---
    const loadList = useCallback(async () => {
        setListLoading(true);
        try {
            const data = await fetchRecordingList();
            setRecordings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch recordings list:', err);
            setRecordings([]);
        } finally {
            setListLoading(false);
        }
    }, []);

    const openList = useCallback(() => {
        setView('list');
        loadList();
    }, [loadList]);

    // --- Detail ---
    const openDetail = useCallback(async (recordId) => {
        setDetailLoading(true);
        setView('detail');
        try {
            const data = await fetchRecording(recordId);
            setSelectedRecord(data);
        } catch (err) {
            console.error('Failed to fetch recording detail:', err);
            setSelectedRecord(null);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const goBackFromDetail = () => {
        setSelectedRecord(null);
        setView('list');
    };

    const goBackFromList = () => {
        setView('main');
    };

    // --- Format ---
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // ========================
    // DETAIL VIEW
    // ========================
    if (view === 'detail') {
        return (
            <div className="w-full h-full bg-gray-900 text-white flex flex-col pt-12 relative overflow-hidden">
                <div className="px-4 pb-3 flex items-center gap-2 sticky top-0 bg-gray-900 border-b border-gray-800 z-10">
                    <button onClick={goBackFromDetail} className="p-1 -ml-1 hover:bg-gray-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-lg font-bold truncate">
                        {selectedRecord?.title || '녹음 상세'}
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {detailLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : !selectedRecord ? (
                        <p className="text-gray-500 text-sm text-center mt-8">데이터를 불러올 수 없습니다.</p>
                    ) : (
                        <>
                            <div className="text-xs text-gray-500 mb-2">
                                {formatDate(selectedRecord.created_at)}
                            </div>
                            {(selectedRecord.messages || []).map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`rounded-lg px-3 py-2 text-sm ${msg.type === 'user'
                                        ? 'bg-blue-600/30 border border-blue-500/30 ml-8'
                                        : msg.type === 'active_npc' || msg.type === 'npc'
                                            ? 'bg-gray-800 border border-gray-700 mr-8'
                                            : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 text-xs'
                                        }`}
                                >
                                    <span className="text-xs font-bold text-gray-400 block mb-1">
                                        {msg.speaker || '???'}
                                    </span>
                                    <span className="text-gray-200">{msg.text}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ========================
    // LIST VIEW
    // ========================
    if (view === 'list') {
        return (
            <div className="w-full h-full bg-gray-900 text-white flex flex-col pt-12 relative overflow-hidden">
                <div className="px-4 pb-3 flex items-center gap-2 sticky top-0 bg-gray-900 border-b border-gray-800 z-10">
                    <button onClick={goBackFromList} className="p-1 -ml-1 hover:bg-gray-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-lg font-bold">녹음 목록</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {listLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : recordings.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center mt-8">저장된 녹음이 없습니다.</p>
                    ) : (
                        recordings.map((rec) => (
                            <button
                                key={rec.record_id}
                                onClick={() => openDetail(rec.record_id)}
                                className="w-full text-left bg-gray-800/70 hover:bg-gray-700/70 border border-gray-700 rounded-xl px-4 py-3 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <span className="text-sm font-medium truncate">
                                            {rec.title || '제목 없음'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                        {formatDate(rec.created_at)}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // ========================
    // MAIN VIEW (Save)
    // ========================
    const saveCost = ACTION_COSTS?.record ?? 10;

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
                <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${(hp ?? 0) < saveCost ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-gray-400'}`}>
                    HP: {hp ?? 0}
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
                        현재 활성화된 대화 기록을<br />서버에 저장합니다.
                    </p>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 w-full">
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-400">저장 비용</span>
                        <span className="text-red-400 font-bold">-{saveCost} HP</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">대화 라인 수</span>
                        <span className="text-white font-bold">{chatLogs.length} 줄</span>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {status === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center text-red-400 text-sm font-bold bg-red-900/20 px-4 py-2 rounded-lg"
                        >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {errorMsg || 'HP가 부족합니다!'}
                        </motion.div>
                    )}
                </AnimatePresence>

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
                    <div className="w-full space-y-3">
                        <button
                            onClick={handleSave}
                            disabled={chatLogs.length === 0 || status === 'saving'}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${chatLogs.length === 0 || status === 'saving'
                                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-lg hover:shadow-red-900/50'
                                }`}
                        >
                            {status === 'saving' ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            <span>{status === 'saving' ? '저장 중...' : `저장하기 (${saveCost} HP)`}</span>
                        </button>

                        <button
                            onClick={openList}
                            className="w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-all"
                        >
                            <List className="w-5 h-5" />
                            <span>녹음 목록 보기</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecorderApp;
