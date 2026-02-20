import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { Clock, AlertTriangle, Moon, Sun, Sunset, Sunrise } from 'lucide-react';

const PERIOD_ICONS = {
    morning: Sun,
    afternoon: Sunset,
    evening: Moon,
    dawn: Sunrise,
};

const PERIOD_BG = {
    morning: 'from-amber-900/90 to-yellow-800/80',
    afternoon: 'from-orange-900/90 to-amber-800/80',
    evening: 'from-indigo-900/90 to-purple-900/80',
    dawn: 'from-gray-900/95 to-slate-900/90',
};

const SectionTransitionOverlay = () => {
    const { sectionTransition, completeSectionTransition, PERIOD_LABELS } = useGame();
    const [showContinue, setShowContinue] = useState(false);

    // Delay showing continue button for dramatic effect
    useEffect(() => {
        if (sectionTransition) {
            setShowContinue(false);
            const timer = setTimeout(() => setShowContinue(true), 1200);
            return () => clearTimeout(timer);
        }
    }, [sectionTransition]);

    const handleContinue = () => {
        completeSectionTransition();
    };

    const nextPeriod = sectionTransition?.nextPeriod || 'morning';
    const PeriodIcon = PERIOD_ICONS[nextPeriod] || Clock;
    const bgGradient = PERIOD_BG[nextPeriod] || PERIOD_BG.morning;
    const periodLabel = PERIOD_LABELS?.[nextPeriod] || nextPeriod;

    return (
        <AnimatePresence>
            {sectionTransition && (
                <motion.div
                    key="section-transition"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-gradient-to-b ${bgGradient}`}
                    style={{ backdropFilter: 'blur(8px)' }}
                >
                    {/* Period Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
                    >
                        <PeriodIcon className="w-16 h-16 text-white/80 mb-6" />
                    </motion.div>

                    {/* Transition Message */}
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-white text-lg font-medium text-center max-w-md px-6 leading-relaxed"
                    >
                        {sectionTransition.message}
                    </motion.p>

                    {/* Next Day indicator */}
                    {sectionTransition.nextDay !== undefined && (
                        <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-yellow-300/80 text-sm mt-3 font-mono"
                        >
                            Day {sectionTransition.nextDay} — {periodLabel}
                        </motion.p>
                    )}

                    {/* Next Period (same day) */}
                    {sectionTransition.nextDay === undefined && (
                        <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-white/60 text-sm mt-3 font-mono"
                        >
                            → {periodLabel}
                        </motion.p>
                    )}

                    {/* Fatigue Penalty Warning */}
                    {sectionTransition.penalty && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="mt-6 flex items-center space-x-2 bg-red-900/50 border border-red-500/30 px-4 py-2 rounded-lg"
                        >
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-red-300 text-sm">
                                {sectionTransition.penalty.message} (HP -{sectionTransition.penalty.amount})
                            </span>
                        </motion.div>
                    )}

                    {/* Continue Button */}
                    <AnimatePresence>
                        {showContinue && (
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.1 }}
                                onClick={handleContinue}
                                className="mt-10 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 
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
    );
};

export default SectionTransitionOverlay;
