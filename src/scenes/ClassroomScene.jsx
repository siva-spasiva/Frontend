import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import GameHUD from '../components/GameHUD';
import GameStartSequence from './GameStartSequence'; // Reuse the contract component

const ClassroomScene = ({ onComplete }) => {
    // Stage: 'enter' -> 'contract_intro' -> 'contract' -> 'drink_intro' -> 'drinking' -> 'blackout'
    const [stage, setStage] = useState('enter');
    const [logs, setLogs] = useState([]);
    const [activeNpc, setActiveNpc] = useState(null);
    const [dialogContent, setDialogContent] = useState(null);

    // Initial Welcome Dialogue
    useEffect(() => {
        if (stage === 'enter') {
            const timer = setTimeout(() => {
                setDialogContent({
                    speaker: 'Unknown Instructor',
                    text: '환영합니다, 참가자님. 솔피 힐링 클래스에 오신 것을 진심으로 축하드립니다.',
                    onNext: () => setStage('contract_intro')
                });
                setActiveNpc('instructor'); // Placeholder ID
            }, 1000);
            return () => clearTimeout(timer);
        } else if (stage === 'contract_intro') {
            setDialogContent({
                speaker: 'Unknown Instructor',
                text: '원활한 프로그램 진행을 위해, 먼저 이 서약서에 서명해 주시겠습니까?',
                onNext: () => {
                    setDialogContent(null);
                    setStage('contract');
                }
            });
        }
    }, [stage]);

    const handleContractSigned = () => {
        setStage('drink_intro');
        setDialogContent({
            speaker: 'Unknown Instructor',
            text: '좋습니다. 이제 몸과 마음을 정화할 시간입니다. 이 웰컴 드링크, [솔피의 눈물]을 드세요.',
            onNext: () => setStage('drinking')
        });
    };

    const handleDrink = () => {
        setDialogContent(null);
        // Drinking Animation / Effect
        // Then Blackout
        setTimeout(() => {
            setStage('blackout');
            setTimeout(() => {
                onComplete && onComplete();
            }, 2000);
        }, 1000);
    };

    // Use 'test03' (Classroom) data for background
    const bgInfo = useGame().mapData?.['test03'] || {};

    return (
        <div className="w-full h-full relative bg-gray-900 overflow-hidden"
            style={{
                backgroundImage: bgInfo.background,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            
            {/* Contract Overlay */}
            <AnimatePresence>
                {stage === 'contract' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="absolute inset-0 z-20 flex items-center justify-center p-4"
                    >
                        <GameStartSequence onSign={handleContractSigned} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Drink Phase UI (Optional) */}
            {stage === 'drinking' && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
                    <button 
                        onClick={handleDrink}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transform transition hover:scale-105 animate-pulse"
                    >
                        [솔피의 눈물] 마시기
                    </button>
                </div>
            )}

            {/* Blackout Overlay */}
            <AnimatePresence>
                {stage === 'blackout' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-50 bg-black"
                    />
                )}
            </AnimatePresence>

            {/* HUD / Dialog */}
            <GameHUD 
                mapInfo={{ name: '1F Classroom' }} 
                activeNpc={activeNpc}
                logs={logs}
                dialogContent={dialogContent}
                viewMode="full" // Force full view for cinematic feel?
                onSend={() => {}}
                inputText=""
                setInputText={() => {}}
                onToggleHidden={() => {}}
                onToggleExpand={() => {}}
                theme="dark"
            />
        </div>
    );
};

export default ClassroomScene;
