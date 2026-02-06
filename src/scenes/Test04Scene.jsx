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
        } else if (phase === 'contract') {
            // SPLIT SCREEN MODE
            // 1. Phone moves to Left
            // 2. Contract appears on Right
            setIsPhoneCentered(false); // Move phone to left
            setPhoneScreenOverride('messenger'); // Keep messenger open!

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
        }
    }, [phase, setCurrentLocationInfo, setIsPhoneCentered, setPhoneScreenOverride]);

    // Listen for App Events (e.g. Messenger triggering Contract)
    const { appEvent } = useGame();
    useEffect(() => {
        if (appEvent?.event === 'CONTRACT_TRIGGER') {
            console.log("Test04Scene: Contract Trigger Received");
            setPhase('contract');
            setIsPhoneCentered(false); // Force explicit update immediately
        }
    }, [appEvent]);


    const handleContractSigned = () => {
        if (onComplete) onComplete();
    };

    // Callback from MessengerApp when it decides it's time to show the contract
    const handleTriggerContract = () => {
        console.log("Contract Phase Triggered!");
        setPhase('contract');
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

            {/* Hidden Callback Handler for Messenger App */}
            {/* The Messenger App is rendered inside MainMenuScene (inside PhoneFrame). 
                We need to pass the 'handleTriggerContract' callback down to it.
                Since we can't easily pass props through MainMenuScene -> MessengerApp without rewiring everything,
                we will use a global event or simply rely on the fact that MainMenuScene calls 'onNext' when Messenger completes?
                
                Actually, MessengerApp has 'onTriggerContract' prop in my last edit. 
                But Test04Scene doesn't render MessengerApp directly.
                
                Workaround: We will pass a specific prop 'onMessengerTrigger' via Context or App.jsx.
                OR simpler: We update the 'onComplete' prop passed to MainMenuScene to handle intermediate steps.
            */}

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
                        {/* We pass a special prop 'externalControl' to GameStartSequence if we want to block signing until authorized.
                             For now, let's just show it. 
                          */}
                        <GameStartSequence onSign={handleContractSigned} />
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default Test04Scene;
