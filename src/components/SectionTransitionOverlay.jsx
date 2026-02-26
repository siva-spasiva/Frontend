import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { Clock, AlertTriangle, Moon, Sun, Sunset, Sunrise } from 'lucide-react';

const PERIOD_ICONS = {
    morning: Sun,
    afternoon: Sunset,
    evening: Moon,
    night: Sunrise,
};

const PERIOD_BG = {
    morning: 'from-amber-900/90 to-yellow-800/80',
    afternoon: 'from-orange-900/90 to-amber-800/80',
    evening: 'from-indigo-900/90 to-purple-900/80',
    night: 'from-gray-900/95 to-slate-900/90',
};

// 시간대별 분위기 텍스트
const PERIOD_ATMOSPHERE_TEXT = {
    morning: '...아침 햇살이 눈을 찌른다...',
    afternoon: '...오후의 나른함이 밀려온다...',
    evening: '...어둠이 내려앉기 시작한다...',
    night: '...깊은 밤, 정적이 감싼다...',
};

// 전환 단계: 'blackout' → 'atmosphere' → 'info' → 'ready'
const PHASE_BLACKOUT = 'blackout';
const PHASE_ATMOSPHERE = 'atmosphere';
const PHASE_INFO = 'info';
const PHASE_READY = 'ready';

const SectionTransitionOverlay = ({ onTransitionComplete }) => {
    const { sectionTransition, completeSectionTransition, PERIOD_LABELS } = useGame();
    const [phase, setPhase] = useState(PHASE_BLACKOUT);

    // 단계별 타이머
    useEffect(() => {
        if (!sectionTransition) {
            setPhase(PHASE_BLACKOUT);
            return;
        }

        // Reset on new transition
        setPhase(PHASE_BLACKOUT);

        // blackout → atmosphere (1.5초 후)
        const t1 = setTimeout(() => setPhase(PHASE_ATMOSPHERE), 1500);
        // atmosphere → info (4초 후)
        const t2 = setTimeout(() => setPhase(PHASE_INFO), 4000);
        // info → ready (5.5초 후)
        const t3 = setTimeout(() => setPhase(PHASE_READY), 5500);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [sectionTransition]);

    const handleContinue = useCallback(() => {
        const transitionData = completeSectionTransition();
        if (onTransitionComplete && transitionData) {
            onTransitionComplete(transitionData);
        }
    }, [completeSectionTransition, onTransitionComplete]);

    const nextPeriod = sectionTransition?.nextPeriod || 'morning';
    const PeriodIcon = PERIOD_ICONS[nextPeriod] || Clock;
    const bgGradient = PERIOD_BG[nextPeriod] || PERIOD_BG.morning;
    const periodLabel = PERIOD_LABELS?.[nextPeriod] || nextPeriod;
    const atmosphereText = PERIOD_ATMOSPHERE_TEXT[nextPeriod] || '...시간이 흘러간다...';

    return (
        <AnimatePresence>
            {sectionTransition && (
                <motion.div
                    key="section-transition"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
                    style={{ backdropFilter: 'blur(8px)' }}
                >
                    {/* Phase 1: 완전 암전 */}
                    <motion.div
                        className="absolute inset-0 bg-black"
                        initial={{ opacity: 1 }}
                        animate={{
                            opacity: phase === PHASE_BLACKOUT || phase === PHASE_ATMOSPHERE ? 1 : 0,
                        }}
                        transition={{ duration: 1.5 }}
                    />

                    {/* Phase 2: 분위기 배경 그라데이션 */}
                    <motion.div
                        className={`absolute inset-0 bg-gradient-to-b ${bgGradient}`}
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: phase === PHASE_INFO || phase === PHASE_READY ? 1 : 0,
                        }}
                        transition={{ duration: 1.5 }}
                    />

                    {/* === 암전 텍스트 (튜토리얼 fadeout 스타일) === */}
                    <AnimatePresence>
                        {(phase === PHASE_BLACKOUT || phase === PHASE_ATMOSPHERE) && (
                            <motion.div
                                key="blackout-text"
                                className="absolute inset-0 flex flex-col items-center justify-center z-10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.2 }}
                            >
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 1.5 }}
                                    className="text-white/80 text-xl font-serif italic tracking-wider"
                                >
                                    ...정신이 아득해진다...
                                </motion.p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* === 분위기 전환 텍스트 === */}
                    <AnimatePresence>
                        {phase === PHASE_ATMOSPHERE && (
                            <motion.div
                                key="atmosphere-text"
                                className="absolute inset-0 flex flex-col items-center justify-center z-10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.8 } }}
                                transition={{ delay: 0.5, duration: 1.2 }}
                            >
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 0.6, 0] }}
                                    transition={{ delay: 1.5, duration: 2.5, ease: 'easeInOut' }}
                                    className="text-white/60 text-lg font-serif tracking-wide mt-16"
                                >
                                    {atmosphereText}
                                </motion.p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* === 정보 표시 단계 === */}
                    <AnimatePresence>
                        {(phase === PHASE_INFO || phase === PHASE_READY) && (
                            <motion.div
                                key="info-content"
                                className="relative z-10 flex flex-col items-center justify-center gap-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                {/* Period Icon */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                                >
                                    <PeriodIcon className="w-16 h-16 text-white/80 mb-4" />
                                </motion.div>

                                {/* Transition Message */}
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-white text-lg font-medium text-center max-w-md px-6 leading-relaxed"
                                >
                                    {sectionTransition.message}
                                </motion.p>

                                {/* Next Day indicator */}
                                {sectionTransition.nextDay !== undefined && (
                                    <motion.p
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="text-yellow-300/80 text-sm mt-2 font-mono"
                                    >
                                        Day {sectionTransition.nextDay} — {periodLabel}
                                    </motion.p>
                                )}

                                {/* Next Period (same day) */}
                                {sectionTransition.nextDay === undefined && (
                                    <motion.p
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="text-white/60 text-sm mt-2 font-mono"
                                    >
                                        → {periodLabel}
                                    </motion.p>
                                )}

                                {/* Fatigue Penalty Warning */}
                                {sectionTransition.penalty && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.8 }}
                                        className="mt-4 flex items-center space-x-2 bg-red-900/50 border border-red-500/30 px-4 py-2 rounded-lg"
                                    >
                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                        <span className="text-red-300 text-sm">
                                            {sectionTransition.penalty.message} (HP -{sectionTransition.penalty.amount})
                                        </span>
                                    </motion.div>
                                )}

                                {/* Continue Button */}
                                <AnimatePresence>
                                    {phase === PHASE_READY && (
                                        <motion.button
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: 0.1 }}
                                            onClick={handleContinue}
                                            className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 
                                                text-white text-sm font-medium rounded-full transition-all duration-300
                                                backdrop-blur-md cursor-pointer active:scale-95"
                                        >
                                            계속하기
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SectionTransitionOverlay;
