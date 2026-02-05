import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import IntroBg from '../assets/map/testintro02.png';
import ClassroomBg from '../assets/map/classroom01.png';
import GameStartSequence from './GameStartSequence';

const Test04Scene = ({ isPhoneOpen, onTogglePhone, onComplete }) => {
    // Phases: 'arrival' -> 'messenger' -> 'enter_room' -> 'contract'
    const [phase, setPhase] = useState('arrival');

    // Core Game State via Context
    const { setCurrentLocationInfo, setIsPhoneCentered, setPhoneScreenOverride } = useGame();

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

            // Timer to move phone to center and open messenger
            const timer = setTimeout(() => {
                setPhase('messenger');
            }, 1500);
            return () => clearTimeout(timer);
        } else if (phase === 'messenger') {
            // Animation: Phone moves to center, screen changes to messenger
            setIsPhoneCentered(true);
            setPhoneScreenOverride('messenger');
        } else if (phase === 'enter_room') {
            // Phone moves back to left, screen back to home?
            setIsPhoneCentered(false);
            setPhoneScreenOverride(null); // Or 'ingame_home' if we had one for this phase

            // Map Update
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

            // Auto transition to contract
            const timer = setTimeout(() => {
                setPhase('contract');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [phase, setCurrentLocationInfo, setIsPhoneCentered, setPhoneScreenOverride]);


    // Setup Messenger Listener (Since Messenger is now in MainMenuScene, we need a way to know it finished)
    // We can use a trick: MainMenuScene passes 'onNext' to MessengerApp.
    // In App.jsx, onNext calls 'toGameStart'.
    // We need to intercept this.
    // BUT, MessengerApp is running inside MainMenuScene. 
    // The MainMenuScene 'onNext' prop is currently 'toGameStart'.
    // We need to change App.jsx so that when in Test04, onNext triggers Test04 logic.
    // Actually, MessengerApp in MainMenuScene calls onComplete.

    // ALTERNATIVE: Use an effect here to listen for logs?
    // Or simpler: Just rely on timer for demo? No, user wants sequence.
    // Let's modify MainMenuScene to handle 'messenger' completion differently in valid context?
    // OR we can just inject a handler into Context.

    // For now, let's assume the MessengerApp calls 'onComplete' passed to it.
    // In MainMenuScene: <MessengerApp onComplete={onNext} ... />
    // In App.jsx: <MainMenuScene onNext={toGameStart} ... />
    // So finishing Messenger -> toGameStart (GameStartSequence). This is NOT what we want for Test04.

    // FIX: We need to override 'onNext' behavior for Test04 in App.jsx.
    // OR, we can just use a timer for the messenger phase in this specific scripted scene if we can't easily hook the callback.
    // The user said "Sequence proceeds(Messenger)... then back to left".

    // Let's add a global event/callback in GameContext for "PhaseComplete"
    // Or let's just make App.jsx handle it.

    const handleContractSigned = () => {
        if (onComplete) onComplete();
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
            {/* Dark Overlay */}
            <div className={`absolute inset-0 ${mapInfo.overlayColor} pointer-events-none transition-colors duration-1000`} />

            {/* Location Info */}
            <motion.div
                className="absolute top-8 z-10 pointer-events-none"
                animate={{ left: isPhoneOpen ? '450px' : '40px' }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                <div className="flex items-center space-x-2 text-white/90 mb-1 drop-shadow-md">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-mono tracking-widest uppercase shadow-black">Location Information</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tighter drop-shadow-lg shadow-black">
                    {mapInfo.namePrefix} <span className={mapInfo.highlightColor}>{mapInfo.highlightText}</span>
                </h1>
                <p className={`text-sm text-gray-300 max-w-md leading-relaxed border-l-2 ${mapInfo.highlightColor.replace('text', 'border')} pl-4 bg-black/30 p-2 rounded-r backdrop-blur-sm`}>
                    {mapInfo.description}
                </p>
            </motion.div>

            {/* Phase 4: Contract Overlay */}
            <AnimatePresence>
                {phase === 'contract' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    >
                        <div className="max-w-xl w-full p-4">
                            <GameStartSequence onSign={handleContractSigned} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default Test04Scene;
