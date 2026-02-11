import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

/**
 * Fish Level Tier 변경 경고 오버레이
 * - 레벨업 시: 경고 메시지 표시 후 자동 소멸
 * - 게임오버 시: 영구 표시
 */
const FishLevelWarning = () => {
    const { fishLevelUpWarning, clearFishLevelUpWarning, isGameOver } = useGame();
    const [showWarning, setShowWarning] = useState(false);

    // 레벨업 경고 자동 소멸 (4초)
    useEffect(() => {
        if (fishLevelUpWarning) {
            setShowWarning(true);
            const timer = setTimeout(() => {
                setShowWarning(false);
                clearFishLevelUpWarning();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [fishLevelUpWarning, clearFishLevelUpWarning]);

    return (
        <>
            {/* 레벨업 경고 */}
            <AnimatePresence>
                {showWarning && fishLevelUpWarning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
                    >
                        {/* 배경 플래시 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.4, 0.2] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0 bg-cyan-900/40"
                        />

                        {/* 경고 메시지 */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', bounce: 0.4 }}
                            className="relative text-center px-8 py-6"
                        >
                            <motion.div
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-6xl mb-4"
                            >
                                🐟
                            </motion.div>
                            <h2 className="text-2xl font-black text-cyan-100 drop-shadow-lg mb-2"
                                style={{ textShadow: '0 0 20px rgba(0,200,255,0.8)' }}
                            >
                                변이 진행 중...
                            </h2>
                            <p className="text-lg text-cyan-200 font-bold drop-shadow-md">
                                Lv {fishLevelUpWarning.prevTier} → Lv {fishLevelUpWarning.newTier}
                            </p>
                            <p className="text-sm text-cyan-300/80 mt-1 italic">
                                [{fishLevelUpWarning.label}]
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 게임 오버 */}
            <AnimatePresence>
                {isGameOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2 }}
                        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md"
                    >
                        <div className="text-center">
                            <motion.div
                                initial={{ y: -40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 1 }}
                                className="text-8xl mb-8"
                            >
                                🐟
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5, duration: 1 }}
                                className="text-4xl font-black text-cyan-100 mb-4"
                                style={{ textShadow: '0 0 30px rgba(0,200,255,0.6)' }}
                            >
                                완전한 물고기
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.5, duration: 1 }}
                                className="text-lg text-gray-400 italic"
                            >
                                뻐끔... 뻐끔...
                            </motion.p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FishLevelWarning;
