import React from 'react';
import { useGame } from '../context/GameContext';
import { motion } from 'framer-motion';
import { Heart, Clock, Zap } from 'lucide-react';

const StatusWidget = ({ className }) => {
    const { hp, maxHp, plusHp, currentDay, currentPeriod, PERIOD_LABELS, PERIOD_CLOCK } = useGame();

    const dayLabel = currentDay === 0 ? 'Tutorial' : `Day ${currentDay}`;
    const periodLabel = PERIOD_LABELS?.[currentPeriod] || currentPeriod;
    const clockLabel = PERIOD_CLOCK?.[currentPeriod] || '';

    const effectivePlus = plusHp ?? 0;
    const totalHp = hp + effectivePlus;
    const hpPercent = (hp / maxHp) * 100;
    const plusPercent = (effectivePlus / maxHp) * 100;

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`flex flex-col items-center bg-black/70 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/20 shadow-2xl text-white pointer-events-none ${className || 'absolute bottom-20 left-1/2 -translate-x-1/2'}`}
        >
            {/* Day / Period Row */}
            <div className="flex items-center space-x-3 mb-2 text-xs">
                <span className="text-yellow-300 font-mono font-bold">{dayLabel}</span>
                <span className="text-gray-600">|</span>
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-gray-300">{periodLabel} {clockLabel && `(${clockLabel})`}</span>
            </div>

            {/* HP Group */}
            <div className="flex flex-col items-center w-full">
                <div className="flex items-center space-x-2 mb-2">
                    <Heart className="w-5 h-5 text-red-500 fill-current animate-pulse" />
                    <span className="text-sm font-bold tracking-wider text-red-100">HP</span>
                    {effectivePlus > 0 && (
                        <span className="flex items-center text-xs text-emerald-400 font-mono ml-1">
                            <Zap className="w-3 h-3 mr-0.5" />
                            +{effectivePlus}
                        </span>
                    )}
                </div>
                {/* HP Bar: red(base) + green(plus) */}
                <div className="w-64 h-3 bg-gray-800/80 rounded-full overflow-hidden border border-white/10 shadow-inner relative">
                    {/* Base HP (red) */}
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500 ease-out"
                        style={{ width: `${hpPercent}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20" />
                    </div>
                    {/* Plus HP (green, stacked after red) */}
                    {effectivePlus > 0 && (
                        <div
                            className="absolute inset-y-0 bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
                            style={{ left: `${hpPercent}%`, width: `${plusPercent}%` }}
                        >
                            <div className="absolute inset-0 bg-white/15" />
                        </div>
                    )}
                    {/* Section boundary markers at 10% (dawn), 40% (evening), 70% (afternoon) */}
                    {[10, 40, 70].map(boundary => (
                        <div
                            key={boundary}
                            className="absolute inset-y-0 w-px bg-white/40 z-10"
                            style={{ left: `${boundary}%` }}
                        >
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] text-gray-500 font-mono whitespace-nowrap">
                                {boundary}
                            </div>
                        </div>
                    ))}
                </div>
                <span className="text-xs mt-1.5 font-mono text-gray-300 font-medium">
                    {effectivePlus > 0 ? `${hp}+${effectivePlus} / ${maxHp}` : `${hp} / ${maxHp}`}
                </span>
            </div>
        </motion.div>
    );
};

export default StatusWidget;
