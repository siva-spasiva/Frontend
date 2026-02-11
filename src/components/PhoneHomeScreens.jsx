import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Map, FileText, Mic, Settings, Camera, MessageCircle, Info, Package, Fish } from 'lucide-react';
import StatusWidget from './StatusWidget';
import { useGame } from '../context/GameContext';
import useFishVisuals from '../hooks/useFishVisuals';

const AppIcon = ({ icon: Icon, label, color, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex flex-col items-center space-y-2 p-4"
    >
        <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-md text-white`}>
            <Icon className="w-8 h-8" />
        </div>
        <span className="text-xs font-medium text-gray-700">{label}</span>
    </motion.button>
);

export const IngameHomeScreen = ({ onAppOpen, onBack }) => {
    return (
        <div className="w-full h-full flex flex-col pt-12 px-6 relative">
            {/* Back Button */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-12 left-4 z-20 p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
            )}

            {/* Status Bar Placeholder */}
            <div className="flex justify-between items-center text-xs font-semibold text-gray-800 mb-8 px-2 pl-8">
                <span>10:24</span>
                <div className='flex space-x-1'>
                    <span>5G</span>
                    <span>98%</span>
                </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-10 px-2">Test01 Menu</h1>

            <div className="grid grid-cols-4 gap-4">
                <AppIcon icon={Map} label="Map" color="bg-green-600" onClick={() => onAppOpen('map_app')} />

                <AppIcon icon={Mic} label="Rec" color="bg-red-500" onClick={() => onAppOpen('recorder_app')} />
                <AppIcon icon={Package} label="Inventory" color="bg-orange-500" onClick={() => onAppOpen('inventory')} />
                <AppIcon icon={MessageCircle} label="Messenger" color="bg-green-600" onClick={() => onAppOpen('messenger')} />
            </div>

            <StatusWidget className="absolute bottom-6 left-6 right-6" />
        </div>
    );
};

export const Ingame02HomeScreen = ({ onAppOpen, onBack }) => {
    return (
        <div className="w-full h-full flex flex-col pt-12 px-6 relative">
            {/* Back Button */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-12 left-4 z-20 p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
            )}

            {/* Status Bar Placeholder */}
            <div className="flex justify-between items-center text-xs font-semibold text-gray-800 mb-8 px-2 pl-8">
                <span>12:00</span>
                <div className='flex space-x-1'>
                    <span className="text-red-600 animate-pulse">!</span>
                    <span>No Signal</span>
                </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-10 px-2 flex items-center">
                Test02 Menu
                <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">OFFLINE</span>
            </h1>

            <div className="grid grid-cols-4 gap-4 opacity-80">
                {/* Different apps for Test02 context */}
                <AppIcon icon={Map} label="Minimap" color="bg-gray-700" onClick={() => { }} />
                <AppIcon icon={Mic} label="Voice" color="bg-red-900" onClick={() => { }} />
                <AppIcon icon={FileText} label="Log" color="bg-orange-700" onClick={() => { }} />

                {/* Glitched Icon */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center space-y-2 p-4 relative overflow-hidden"
                >
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-md text-white animate-pulse">
                        <span className="font-mono text-xs">ERR</span>
                    </div>
                    <span className="text-xs font-medium text-gray-400">System</span>
                </motion.button>
            </div>

            <div className="mt-8 p-4 bg-gray-100 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 font-mono">
                    &gt; CONNECTION LOST<br />
                    &gt; LOCAL MODE ACTIVE<br />
                    &gt; SYNC FAILED
                </p>
            </div>

            <StatusWidget className="absolute bottom-6 left-6 right-6" />
        </div>
    );
};

export const Ingame03HomeScreen = ({ onAppOpen, onBack }) => {
    const { currentDay, currentPeriod, PERIOD_LABELS, PERIOD_CLOCK } = useGame();
    const { fishTier, phoneEffects, hasFishEffect, isHeavilyFishy } = useFishVisuals();
    const dayLabel = currentDay === 0 ? 'Tutorial' : `Day ${currentDay}`;
    const periodLabel = PERIOD_LABELS?.[currentPeriod] || '아침';
    const clockDisplay = PERIOD_CLOCK?.[currentPeriod] || '08:00';

    // Fish-tier에 따른 아이콘 색상 변화
    const mapIconColor = fishTier >= 3 ? 'bg-teal-600' : fishTier >= 1 ? 'bg-blue-500' : 'bg-blue-400';
    const invIconColor = fishTier >= 3 ? 'bg-teal-500' : 'bg-orange-500';
    const recIconColor = fishTier >= 3 ? 'bg-cyan-700' : 'bg-red-500';
    const settIconColor = fishTier >= 2 ? 'bg-slate-500' : 'bg-gray-400';

    // Fish-tier 제목 색상
    const titleColor = fishTier >= 3 ? 'text-teal-900' : 'text-blue-900';
    const subtitleExtra = fishTier >= 2 ? (fishTier >= 4 ? ' 🐟' : ' 🫧') : '';

    // 알림 카드 색상
    const notifBg = fishTier >= 3 ? 'bg-teal-50' : 'bg-blue-50';
    const notifBorder = fishTier >= 3 ? 'border-teal-200' : 'border-blue-100';
    const notifIconBg = fishTier >= 3 ? 'bg-teal-200' : 'bg-blue-200';
    const notifIconColor = fishTier >= 3 ? 'text-teal-600' : 'text-blue-600';
    const notifTitleColor = fishTier >= 3 ? 'text-teal-900' : 'text-blue-900';
    const notifTextColor = fishTier >= 3 ? 'text-teal-600' : 'text-blue-600';
    const notifText = fishTier >= 4 ? '물이... 차갑다...'
        : fishTier >= 3 ? '수업 시작... 10분 전...'
            : 'Class starts in 10 mins.';

    return (
        <div className="w-full h-full flex flex-col pt-12 px-6 relative">
            {/* Back Button */}
            {onBack && (
                <button
                    onClick={onBack}
                    className={`absolute top-12 left-4 z-20 p-2 -ml-2 rounded-full hover:bg-blue-50 active:bg-blue-100 transition-colors ${isHeavilyFishy ? 'opacity-80' : ''}`}
                >
                    <ChevronLeft className={`w-6 h-6 ${titleColor}`} />
                </button>
            )}

            {/* Status Bar — Fish Tier에 따라 변화 */}
            <div className="flex justify-between items-center text-xs font-semibold text-gray-800 mb-8 px-2 pl-8">
                <span className={isHeavilyFishy ? 'animate-pulse' : ''}>
                    {phoneEffects.clockDistort ? clockDisplay.split('').map((c, i) =>
                        Math.random() > 0.7 ? String.fromCharCode(c.charCodeAt(0) + Math.floor(Math.random() * 3 - 1)) : c
                    ).join('') : clockDisplay}
                </span>
                <div className='flex space-x-1'>
                    <span>{phoneEffects.statusBarText}</span>
                    <span>{phoneEffects.batteryText}</span>
                </div>
            </div>

            <h1 className={`text-3xl font-bold ${titleColor} mb-2 px-2`}>{dayLabel}</h1>
            <p className="text-sm text-gray-500 mb-8 px-2">{periodLabel} | 우미 원데이 클래스{subtitleExtra}</p>

            <div className={`grid grid-cols-4 gap-4 ${isHeavilyFishy ? 'animate-[fishwave_6s_ease-in-out_infinite]' : ''}`}>
                {isHeavilyFishy && (
                    <style>{`
                        @keyframes fishwave {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-2px); }
                        }
                    `}</style>
                )}
                <AppIcon icon={fishTier >= 4 ? Fish : Map} label={fishTier >= 4 ? '해역' : 'Map'} color={mapIconColor} onClick={() => onAppOpen('map_app')} />
                <AppIcon icon={Package} label={fishTier >= 4 ? '비늘' : 'Inventory'} color={invIconColor} onClick={() => onAppOpen('inventory')} />
                <AppIcon icon={Mic} label={fishTier >= 4 ? '노래' : 'Recorder'} color={recIconColor} onClick={() => onAppOpen('recorder_app')} />
                <AppIcon icon={Settings} label="Settings" color={settIconColor} onClick={() => { }} />
            </div>

            <div className={`mt-8 p-4 ${notifBg} rounded-xl border ${notifBorder} transition-colors duration-500`}>
                <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-10 h-10 rounded-full ${notifIconBg} flex items-center justify-center`}>
                        {fishTier >= 3
                            ? <Fish className={`w-5 h-5 ${notifIconColor}`} />
                            : <MessageCircle className={`w-5 h-5 ${notifIconColor}`} />
                        }
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${notifTitleColor}`}>
                            {fishTier >= 4 ? '물 속에서...' : fishTier >= 3 ? '알림' : 'New Notification'}
                        </p>
                        <p className={`text-xs ${notifTextColor}`}>{notifText}</p>
                    </div>
                </div>
            </div>

            <StatusWidget className="absolute bottom-6 left-6 right-6" />
        </div>
    );
};
// Corrupted Home Screen for Test02
export const IngameCorruptedHomeScreen = ({ onAppOpen, onBack }) => {
    const { hp, maxHp, currentDay, currentPeriod, PERIOD_LABELS, PERIOD_CLOCK } = useGame();
    const dayLabel = currentDay === 0 ? 'Tutorial' : `Day ${currentDay}`;
    const periodLabel = PERIOD_LABELS?.[currentPeriod] || '아침';
    const clockDisplay = PERIOD_CLOCK?.[currentPeriod] || '08:00';

    return (
        <div className="w-full h-full flex flex-col pt-12 px-6 relative overflow-hidden bg-white text-gray-800">

            {/* Dark & CRT Filter Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 mix-blend-multiply bg-gray-400/50"></div>
            <div className="absolute inset-0 pointer-events-none z-50 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.1),rgba(0,0,0,0.1)_1px,transparent_1px,transparent_2px)]"></div>
            <div className="absolute inset-0 pointer-events-none z-50 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]"></div>

            {/* Main Container with Tilt & Shake */}
            <div className="w-full h-full flex flex-col relative z-40 transform origin-center rotate-1 animate-[shake_4s_ease-in-out_infinite]">
                <style jsx>{`
                    @keyframes shake {
                        0%, 100% { transform: rotate(1deg) translate(0, 0); }
                        2% { transform: rotate(1.5deg) translate(-1px, 1px); }
                        4% { transform: rotate(0.5deg) translate(1px, -1px); }
                        6% { transform: rotate(1deg) translate(0, 0); }
                    }
                `}</style>

                {/* Back Button */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="absolute top-0 left-0 z-20 p-2 -ml-2 rounded-full hover:bg-blue-50 active:bg-blue-100 transition-colors grayscale"
                    >
                        <ChevronLeft className="w-6 h-6 text-blue-900" />
                    </button>
                )}

                {/* Status Bar */}
                <div className="flex justify-between items-center text-xs font-semibold text-gray-800 mb-8 px-2 pl-8 opacity-70">
                    <span>{clockDisplay}</span>
                    <div className='flex space-x-1'>
                        <span>5G</span>
                        <span>84%</span>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-blue-900 mb-2 px-2 opacity-80">{dayLabel}</h1>
                <p className="text-sm text-gray-500 mb-8 px-2 opacity-80">{periodLabel} | 우미 원데이 클래스</p>

                {/* Identical Grid to 03, but visually dimmer/grayscaled via parent filters */}
                <div className="grid grid-cols-4 gap-4 filter saturate-50 contrast-125 brightness-90">
                    <AppIcon icon={Map} label="Map" color="bg-blue-400" onClick={() => onAppOpen('map_app')} />
                    <AppIcon icon={Package} label="Inventory" color="bg-orange-500" onClick={() => onAppOpen('inventory')} />
                    <AppIcon icon={Camera} label="Photo" color="bg-pink-400" onClick={() => { }} />
                    <AppIcon icon={Settings} label="Settings" color="bg-gray-400" onClick={() => { }} />
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 opacity-60 filter blur-[0.3px]">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-900">New Notification</p>
                            <p className="text-xs text-blue-600">Class starts in 10 mins.</p>
                        </div>
                    </div>
                </div>

                {/* Corrupted Status Widget (Custom Fish Logic) */}
                <div className="absolute bottom-10 left-0 right-0 px-4 filter contrast-125 brightness-90">
                    <div className="flex flex-col items-center justify-center bg-black/70 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/20 shadow-2xl text-white">
                        <div className="flex flex-col items-center w-full">
                            <div className="flex items-center space-x-2 mb-2">
                                <Fish className="w-5 h-5 text-blue-300 fill-current animate-bounce" />
                                <span className="text-sm font-bold tracking-wider text-blue-100">HP (Action Points)</span>
                            </div>
                            <div className="w-64 h-3 bg-gray-800/80 rounded-full overflow-hidden border border-white/10 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full relative"
                                    style={{ width: `${(hp / maxHp) * 100}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20" />
                                </div>
                            </div>
                            <span className="text-xs mt-1.5 font-mono text-gray-300 font-medium">{hp} / {maxHp}</span>
                        </div>
                    </div>
                </div>

                {/* Cracks Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 mix-blend-overlay" viewBox="0 0 100 200" preserveAspectRatio="none">
                    <path d="M0,0 L40,60 L20,100" fill="none" stroke="black" strokeWidth="0.5" />
                    <path d="M100,180 L70,140 L90,100" fill="none" stroke="black" strokeWidth="0.5" />
                </svg>
            </div>
        </div>
    );
};
