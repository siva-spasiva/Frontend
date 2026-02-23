import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Key, AlertCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';

const RequirementModal = ({ isOpen, requirement, onClose }) => {
    const { ITEMS } = useGame();

    if (!requirement) return null;

    const isItemReq = requirement.type === 'item';
    const reqItem = isItemReq ? ITEMS[requirement.targetId] : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-gray-900 border border-red-500/20 rounded-2xl p-6 shadow-2xl overflow-hidden mx-4"
                    >
                        {/* Glow Effect */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/20 blur-3xl rounded-full" />

                        {/* Header */}
                        <div className="relative z-10 flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Lock className="text-red-400 w-6 h-6" />
                                    접근 불가
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">자격 증명이 필요하다.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Requirement Details */}
                        <div className="relative z-10 bg-black/40 rounded-xl p-6 mb-8 border border-white/5 flex flex-col items-center text-center">
                            <motion.div
                                initial={{ scale: 0.8, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                className="text-5xl mb-4 drop-shadow-lg"
                            >
                                {isItemReq ? (reqItem?.icon || '🔑') : '📈'}
                            </motion.div>

                            <h3 className="text-xl font-bold text-red-100 mb-2">
                                {isItemReq ? `필요한 아이템: ${reqItem?.name || requirement.targetId}` : `필요한 스탯: ${requirement.targetId} (Lv.${requirement.targetValue})`}
                            </h3>

                            <div className="flex items-center space-x-2 mb-4">
                                <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded font-bold bg-red-900/50 text-red-200 border border-red-700/50 flex gap-1 items-center">
                                    <AlertCircle className="w-3 h-3" />
                                    REQUIREMENT
                                </span>
                            </div>

                            <p className="text-gray-300 text-sm leading-relaxed max-w-[80%]">
                                {requirement.message || "굳게 닫혀있다. 무언가 필요한 것 같다."}
                            </p>
                        </div>

                        {/* Action Button */}
                        <div className="relative z-10">
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl shadow-lg border border-gray-600 flex items-center justify-center transition-all"
                            >
                                돌아가기
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RequirementModal;
