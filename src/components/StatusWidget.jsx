import React from 'react';
import { useGame } from '../context/GameContext';
import { motion } from 'framer-motion';
import { Heart, Activity, Fish, Droplets } from 'lucide-react';

const StatusWidget = ({ className }) => {
    const { fishLevel, umiLevel, hp, maxHp, trust, maxTrust, maxFishLevel, maxUmiLevel } = useGame();

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`flex items-center justify-between space-x-2 bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 shadow-2xl text-white pointer-events-none ${className || 'absolute bottom-20 left-4 right-4'}`}
        >
            {/* HP Group */}
            <div className="flex flex-col items-center min-w-[60px]">
                <div className="flex items-center space-x-1 mb-1">
                    <Heart className="w-3 h-3 text-red-500 fill-current" />
                    <span className="text-[10px] font-bold tracking-wider text-red-200">HP</span>
                </div>
                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-red-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(hp / maxHp) * 100}%` }}
                    />
                </div>
                <span className="text-[9px] mt-0.5 font-mono text-gray-400">{hp}/{maxHp}</span>
            </div>

            {/* Trust Group (Removed) */}
            {/*
            <div className="flex flex-col items-center min-w-[60px]">
                 <div className="flex items-center space-x-1 mb-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold tracking-wider text-emerald-200">TRUST</span>
                </div>
                 <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(trust / maxTrust) * 100}%` }}
                    />
                </div>
                 <span className="text-[9px] mt-0.5 font-mono text-gray-400">{trust}%</span>
            </div>
            */}

            {/* Separator */}
            <div className="w-px h-8 bg-white/20 mx-2" />

            {/* Fish Level Group */}
            <div className="flex flex-col items-center min-w-[60px]">
                <div className="flex items-center space-x-1 mb-1">
                    <Fish className="w-3 h-3 text-blue-300" />
                    <span className="text-[10px] font-bold tracking-wider text-blue-200">FISH</span>
                </div>
                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(fishLevel / maxFishLevel) * 100}%` }}
                    />
                </div>
                <span className="text-[9px] mt-0.5 font-mono text-gray-400">{fishLevel}%</span>
            </div>

            {/* Umi Level Group */}
            <div className="flex flex-col items-center min-w-[60px]">
                <div className="flex items-center space-x-1 mb-1">
                    <Droplets className="w-3 h-3 text-purple-300" />
                    <span className="text-[10px] font-bold tracking-wider text-purple-200">UMI</span>
                </div>
                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(umiLevel / maxUmiLevel) * 100}%` }}
                    />
                </div>
                <span className="text-[9px] mt-0.5 font-mono text-gray-400">{umiLevel}%</span>
            </div>
        </motion.div>
    );
};

export default StatusWidget;
