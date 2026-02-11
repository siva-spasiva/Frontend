import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import IntroBg from '../assets/map/mainmenu01.png';
import ClassroomBg from '../assets/map/1F_class02.png';
import GameStartSequence from './GameStartSequence';
import GameHUD from '../components/GameHUD';
import FishEyeEffect from '../components/FishEyeEffect';
import useFishVisuals from '../hooks/useFishVisuals';

// Wrapper component for FishEyeEffect that uses the hook
const FishEyeEffectWrapper = () => {
    const { fishTier, mapEffects, waveFilterId } = useFishVisuals();
    return <FishEyeEffect fishTier={fishTier} mapEffects={mapEffects} waveFilterId={waveFilterId} />;
};

const Test04Scene = ({ isPhoneOpen, onTogglePhone, onComplete }) => {
    // Phases: 'arrival' -> 'messenger' -> 'enter_room' -> 'contract'
    const [phase, setPhase] = useState('arrival');
    const [viewMode, setViewMode] = useState('mini');

    // Chat State (Dummy for HUD)
    const [inputText, setInputText] = useState('');
    const logs = [];

    // Core Game State via Context
    const { setCurrentLocationInfo, setIsPhoneCentered, setPhoneScreenOverride, appEvent, triggerAppEvent, tutorialCompleted, setTutorialCompleted } = useGame();

    useEffect(() => {
        if (tutorialCompleted) {
            setPhase('classroom');
            return;
        }
    }, [tutorialCompleted]);

    // Map Info State
    const [mapInfo, setMapInfo] = useState({
        namePrefix: '원데이 클래스',
        highlightText: '우미',
        highlightColor: 'text-blue-400',
        description: '바닷가가 보이는 아름다운 건물. 햇살이 비치는 창가와 깔끔한 인테리어가 돋보인다.',
        background: `url(${IntroBg})`,
        overlayColor: 'bg-black/5'
    });

    // Phase Management
    useEffect(() => {
        if (phase === 'arrival') {
            // Initial State: Phone on Left.
            setIsPhoneCentered(false);
            setPhoneScreenOverride(null); // Default home screen
            setViewMode('mini');

            // Timer to move phone to center and open messenger
            const timer = setTimeout(() => {
                setPhase('messenger');
            }, 100);
            return () => clearTimeout(timer);
        } else if (phase === 'messenger') {
            // Animation: Phone moves to center, screen changes to messenger
            setIsPhoneCentered(true);
            setPhoneScreenOverride('messenger');
            // In this phase, we hide the HUD entirely via conditional rendering below
        } else if (phase === 'contract') {
            // SPLIT SCREEN MODE
            // 1. Phone moves to Left
            // 2. Contract appears on Right
            setIsPhoneCentered(false); // Phone moves left
            setPhoneScreenOverride('messenger'); // Keep messenger open!
            setViewMode('mini');

            // Map Update (Background change to Classroom/Hall)
            setMapInfo({
                namePrefix: '1층',
                highlightText: '메인 홀',
                highlightColor: 'text-yellow-400',
                description: '학교의 중심이 되는 메인 홀. 게시판에는 다양한 동아리 홍보 포스터가 붙어있다.',
                background: `url(${ClassroomBg})`,
                overlayColor: 'bg-black/30'
            });
            setCurrentLocationInfo({
                namePrefix: '1층',
                highlightText: '메인 홀',
                highlightColor: 'text-yellow-400',
                description: '학교의 중심이 되는 메인 홀.',
            });
        } else if (phase === 'inventory_check') {
            // After Contract: Move Phone Center to check Inventory
            setIsPhoneCentered(true);
            setPhoneScreenOverride('inventory');
        }
    }, [phase, setCurrentLocationInfo, setIsPhoneCentered, setPhoneScreenOverride]);

    // Listen for App Events (e.g. Messenger triggering Contract)
    // Listen for App Events (e.g. Messenger triggering Contract)
    useEffect(() => {
        if (appEvent?.event === 'CONTRACT_TRIGGER') {
            console.log("Test04Scene: Contract Trigger Received");
            setPhase('contract');
            setIsPhoneCentered(false); // Force explicit update immediately
        }
    }, [appEvent]);


    const handleContractSigned = () => {
        setTutorialCompleted(true);
        // Transition to Inventory Check instead of finishing immediately
        setPhase('inventory_check');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full relative bg-gray-900 text-white overflow-hidden transition-all duration-1000"
            style={{
                backgroundImage: mapInfo.background,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Fish Eye Effect Overlay */}
            <FishEyeEffectWrapper />

            {/* Dark Overlay handled by GameHUD or here if needed, but GameHUD has its own overlay logic if we pass it, 
                however GameHUD renders overlay inside. Let's pass overlayColor to GameHUD.
                BUT, we want the background image to be on the CONTAINER (this div), which it is.
                GameHUD puts an overlay absolute inset-0.
                Legacy code had manual overlay.
            */}

            {/* GameHUD: Manages Location Info, NPC Portraits, Chat Bubble, View Controls */}
            {/* We hide the HUD completely during 'messenger' phase so the phone is the sole focus */}
            <AnimatePresence>
                {phase !== 'messenger' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 pointer-events-none"
                    >
                        <GameHUD
                            mapInfo={mapInfo}
                            logs={logs}
                            inputText={inputText}
                            setInputText={setInputText}
                            viewMode={viewMode}
                            onToggleHidden={() => setViewMode('hidden')}
                            onToggleExpand={() => setViewMode(prev => prev === 'full' ? 'mini' : 'full')} // Simple toggle
                            isPhoneOpen={isPhoneOpen}
                            onTogglePhone={onTogglePhone}
                            // No active NPC for now
                            activeNpc={null}
                        />
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Contract Container (Right Side) */}
            <AnimatePresence>
                {phase === 'contract' && (
                    <motion.div
                        initial={{ x: 500, opacity: 0, rotate: 5 }}
                        animate={{ x: 0, opacity: 1, rotate: 0 }}
                        exit={{ x: 500, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className="absolute right-10 top-1/2 -translate-y-1/2 z-20 w-[600px] h-[800px] flex items-center justify-center pointer-events-auto"
                    >
                        <GameStartSequence onSign={handleContractSigned} />
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default Test04Scene;
