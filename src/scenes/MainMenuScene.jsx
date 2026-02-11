import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Save, Settings, FileText, Grid, Map, Mic, MessageCircle } from 'lucide-react';
import MessengerApp from '../components/apps/MessengerApp';
import InventoryApp from '../components/apps/InventoryApp';
import FishPhoneOverlay from '../components/FishPhoneOverlay';
import useFishVisuals from '../hooks/useFishVisuals';

// --- Components ---

const PhoneFrame = ({ children, header, isBroken }) => {
    const { fishTier, phoneEffects } = useFishVisuals();

    // Fish-tier에 따른 폰 테두리 색상
    const fishBorderClass = fishTier > 0 && !isBroken ? phoneEffects.borderColor : '';
    const borderClass = isBroken ? 'border-red-900/30' : (fishBorderClass || 'border-white/20');

    // Fish-tier에 따른 그림자 색상
    const fishShadow = fishTier >= 2
        ? `0 25px 50px -12px rgba(0, 100, 180, ${0.15 + fishTier * 0.05}), 0 0 ${fishTier * 8}px rgba(0, 180, 216, ${fishTier * 0.06})`
        : '0 25px 50px -12px rgba(0, 0, 0, 0.25)';

    return (
        <div className="w-full h-full flex items-center justify-center font-sans">
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className={`w-full max-w-sm h-[95vh] max-h-[800px] bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border overflow-hidden relative flex flex-col transition-all duration-500 ${borderClass}`}
                style={isBroken ? { boxShadow: '0 0 20px rgba(0,0,0,0.8)' } : { boxShadow: fishShadow }}
            >
                {/* Cracks & Damage Overlays */}
                {isBroken && (
                    <div className="absolute inset-0 z-40 pointer-events-none">
                        {/* Spiderweb Crack Top-Right */}
                        <svg className="absolute top-0 right-0 w-full h-full opacity-60 mix-blend-overlay pointer-events-none" viewBox="0 0 400 800">
                            <path d="M400,0 L320,80 L350,120 L300,150" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none" filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.5))" />
                            <path d="M320,80 L250,50" stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" />
                            <path d="M320,80 L280,120" stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" />
                            <path d="M350,120 L400,180" stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" />

                            {/* Bottom Cracks - Intensified */}
                            <path d="M0,800 L200,600 L100,500" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="none" filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.7))" />
                            <path d="M200,600 L300,650 L400,620" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" />
                            <path d="M200,600 L250,550" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none" />
                            <path d="M100,500 L50,450" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />

                            {/* Crossing Crack */}
                            <path d="M0,300 L400,400" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" fill="none" />
                        </svg>

                        {/* Screen Glare / Dirt */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.2),transparent_40%)] mix-blend-hard-light"></div>

                        {/* Scanlines / Interference - Flickering */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.15)_3px)] pointer-events-none animate-pulse"></div>
                    </div>
                )}

                {/* Content */}
                <div
                    className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-500`}
                    style={isBroken ? {
                        filter: 'contrast(1.2) brightness(0.85) grayscale(0.4) blur(0.6px)',
                        transform: 'scale(1.005)' // Subtle zoom to feel 'off'
                    } : {
                        filter: phoneEffects.filter !== 'none' ? phoneEffects.filter : undefined,
                    }}
                >
                    {children}

                    {/* Fish Phone Overlay — 물고기화 효과 */}
                    <FishPhoneOverlay fishTier={fishTier} phoneEffects={phoneEffects} />

                    {/* Color Channel Split (Chromatic Aberration Simulation) for Broken State - simplified overlay */}
                    {isBroken && (
                        <div className="absolute inset-0 bg-red-500 mix-blend-screen opacity-10 pointer-events-none translate-x-[1px]"></div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

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





const MainMenu = ({ onAppOpen }) => {
    return (
        <div className="w-full h-full flex flex-col pt-12 px-6">
            {/* Status Bar Placeholder */}
            <div className="flex justify-between items-center text-xs font-semibold text-gray-800 mb-8 px-2">
                <span>9:41</span>
                <div className='flex space-x-1'>
                    <span>5G</span>
                    <span>100%</span>
                </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-10 px-2">Home</h1>

            <div className="grid grid-cols-4 gap-4">
                <AppIcon icon={Play} label="Start" color="bg-blue-500" onClick={() => onAppOpen('test04')} />
                <AppIcon icon={Save} label="Load" color="bg-green-500" onClick={() => { }} />

                <AppIcon icon={FileText} label="Credits" color="bg-purple-500" onClick={() => { }} />
                <AppIcon icon={Grid} label="Test01" color="bg-indigo-600" onClick={() => onAppOpen('test01')} />
                <AppIcon icon={Grid} label="Test02" color="bg-pink-600" onClick={() => onAppOpen('test02')} />
                <AppIcon icon={Grid} label="Test03" color="bg-cyan-600" onClick={() => onAppOpen('test03')} />
                <AppIcon icon={Grid} label="Test04" color="bg-teal-600" onClick={() => onAppOpen('test04')} />
                <AppIcon icon={Grid} label="Test05" color="bg-orange-500" onClick={() => onAppOpen('test05')} />
                <AppIcon icon={Grid} label="DEBUG 00" color="bg-orange-600" onClick={() => onAppOpen('debug00')} />
                <AppIcon icon={Grid} label="DEBUG 01" color="bg-red-600" onClick={() => onAppOpen('debug01')} />
                {/* <AppIcon icon={FileText} label="Inventory" color="bg-orange-500" onClick={() => onAppOpen('inventory')} /> */}
                {/* Dummies to fill space if needed, or leave empty */}
            </div>
        </div>
    );
};



import { IngameHomeScreen, Ingame02HomeScreen, Ingame03HomeScreen, IngameCorruptedHomeScreen } from '../components/PhoneHomeScreens';
import MapApp from '../components/apps/MapApp';
import RecorderApp from '../components/apps/RecorderApp';


const MainMenuScene = ({ onNext, onTestStart, onTest02Start, onTest03Start, onTest04Start, onTest05Start, onDebug00Start, onDebug01Start, onHome, currentPhase }) => {
    // 'menu' | 'messenger' | 'ingame_home' | 'ingame02_home' | 'ingame03_home' | 'map_app'
    const [internalPhase, setInternalPhase] = useState('menu');

    // Context for overrides
    const { phoneScreenOverride, setPhoneScreenOverride, currentLocationInfo, setIsPhoneCentered } = useGame();

    useEffect(() => {
        if (phoneScreenOverride) {
            setInternalPhase(phoneScreenOverride);
            return;
        }

        if (currentPhase === 'mainGame') {
            setInternalPhase('ingame_home');
        } else if (currentPhase === 'test02') {
            setInternalPhase('ingame02_home');
        } else if (currentPhase === 'test03') {
            setInternalPhase('ingame03_home');
        } else if (currentPhase === 'test04') {
            setInternalPhase('ingame03_home');
        } else if (currentPhase === 'test05') {
            setInternalPhase('ingame03_home');
        } else if (currentPhase === 'mainMenu') {
            setInternalPhase('menu');
        }
    }, [currentPhase, phoneScreenOverride]);

    // Initialize position logic: When on Home Screen, move Phone to Left (Initialize Position)
    useEffect(() => {
        const homeScreens = ['menu', 'ingame_home', 'ingame02_home', 'ingame03_home'];
        if (homeScreens.includes(internalPhase)) {
            setIsPhoneCentered(false);
        }
    }, [internalPhase, setIsPhoneCentered]);

    const handleAppOpen = (appName) => {
        if (appName === 'test01') {
            onTestStart && onTestStart();
        } else if (appName === 'test02') {
            onTest02Start && onTest02Start();
        } else if (appName === 'test03') {
            onTest03Start && onTest03Start();
        } else if (appName === 'test04') {
            onTest04Start && onTest04Start();
        } else if (appName === 'test05') {
            onTest05Start && onTest05Start(); // New Handler
        } else if (appName === 'debug00') {
            onDebug00Start && onDebug00Start();
        } else if (appName === 'debug01') {
            onDebug01Start && onDebug01Start();
        } else if (appName === 'umi_class') { // Alias for test03
            onTest03Start && onTest03Start();
        } else {
            setInternalPhase(appName);
        }
    };

    const isBroken = currentPhase === 'test02';

    return (
        <PhoneFrame isBroken={isBroken}>
            <AnimatePresence mode="wait">
                {internalPhase === 'menu' && (
                    <motion.div
                        key="menu"
                        className="w-full h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <MainMenu onAppOpen={handleAppOpen} />
                    </motion.div>
                )}

                {internalPhase === 'ingame_home' && (
                    <motion.div
                        key="ingame_home"
                        className="w-full h-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <IngameHomeScreen onAppOpen={handleAppOpen} onBack={onHome} />
                    </motion.div>
                )}

                {internalPhase === 'ingame02_home' && (
                    <motion.div
                        key="ingame02_home"
                        className="w-full h-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <IngameCorruptedHomeScreen onAppOpen={handleAppOpen} onBack={onHome} />
                    </motion.div>
                )}

                {internalPhase === 'ingame03_home' && (
                    <motion.div
                        key="ingame03_home"
                        className="w-full h-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Ingame03HomeScreen onAppOpen={handleAppOpen} onBack={onHome} />
                    </motion.div>
                )}

                {internalPhase === 'map_app' && (
                    <motion.div
                        key="map_app"
                        className="w-full h-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <MapApp
                            currentFloorId={
                                currentLocationInfo?.floorId ||
                                (currentPhase === 'test02' ? 'B2' : (currentPhase === 'test03' ? '1F' : (currentPhase === 'test05' ? '2F' : (currentPhase === 'mainGame' ? 'DEBUG' : 'B4'))))
                            }
                            currentRoomId={
                                currentLocationInfo?.roomId ||
                                (currentPhase === 'test02' ? 'room001' : (currentPhase === 'test03' ? 'umi_class' : (currentPhase === 'test05' ? 'storage_main' : (currentPhase === 'mainGame' ? 'test01' : 'ocean_gate'))))
                            }
                            onNavigate={(roomId) => {
                                // Simplified Navigation Map
                                const roomToScene = {
                                    'room001': 'test02', // Mapped to room001 (B2)
                                    'umi_class': 'test03', // Assuming test03 is 1F/Umi Class
                                    'test01': 'test01',
                                    'ocean_gate': 'crash', // Fallback or crash
                                    // Add other mappings as needed
                                };

                                const targetScene = roomToScene[roomId];
                                if (targetScene) {
                                    handleAppOpen(targetScene);
                                } else {
                                    console.log(`No scene mapped for room: ${roomId}`);
                                    // Optional: Feedback for unimplemented rooms
                                }
                            }}
                            onBack={() => {
                                setPhoneScreenOverride(null);
                                // Return to appropriate home screen based on currentPhase
                                if (currentPhase === 'test02') setInternalPhase('ingame02_home');
                                else if (currentPhase === 'test03') setInternalPhase('ingame03_home');
                                else if (currentPhase === 'test04') setInternalPhase('ingame03_home');
                                else if (currentPhase === 'test05') setInternalPhase('ingame03_home');
                                else setInternalPhase('ingame_home');
                            }}
                        />
                    </motion.div>
                )}

                {internalPhase === 'messenger' && (
                    <motion.div
                        key="messenger"
                        className="w-full h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <MessengerApp onComplete={onNext} onBack={() => {
                            setPhoneScreenOverride(null);
                            if (currentPhase === 'test02') setInternalPhase('ingame02_home');
                            else if (currentPhase === 'test03') setInternalPhase('ingame03_home');
                            else if (currentPhase === 'test04') setInternalPhase('ingame03_home');
                            else if (currentPhase === 'test05') setInternalPhase('ingame03_home');
                            else if (currentPhase === 'mainGame') setInternalPhase('ingame_home');
                            else setInternalPhase('menu');
                        }} />
                    </motion.div>
                )}

                {internalPhase === 'inventory' && (
                    <motion.div
                        key="inventory"
                        className="w-full h-full"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <InventoryApp onBack={() => {
                            // Return to appropriate home screen
                            if (currentPhase === 'test02') setInternalPhase('ingame02_home');
                            else if (currentPhase === 'test03') setInternalPhase('ingame03_home');
                            else if (currentPhase === 'test04') {
                                setPhoneScreenOverride(null);
                                onTest03Start && onTest03Start();
                            }
                            else if (currentPhase === 'test05') setInternalPhase('ingame03_home');
                            else if (currentPhase === 'mainGame') setInternalPhase('ingame_home');
                            else setInternalPhase('menu');
                        }} />
                    </motion.div>
                )}

                {internalPhase === 'recorder_app' && (
                    <motion.div
                        key="recorder_app"
                        className="w-full h-full"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <RecorderApp onBack={() => {
                            setPhoneScreenOverride(null);
                            // Return to appropriate home screen
                            if (currentPhase === 'test02') setInternalPhase('ingame02_home');
                            else if (currentPhase === 'test03') setInternalPhase('ingame03_home');
                            else if (currentPhase === 'test04') setInternalPhase('ingame03_home');
                            else if (currentPhase === 'test05') setInternalPhase('ingame03_home');
                            else if (currentPhase === 'mainGame') setInternalPhase('ingame_home');
                            else setInternalPhase('menu');
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </PhoneFrame>
    );
};

export default MainMenuScene;
