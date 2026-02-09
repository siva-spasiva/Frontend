import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';

const GameStartSequence = ({ onSign }) => {
    const { addItem } = useGame();
    const [isSigned, setIsSigned] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [animationPhase, setAnimationPhase] = useState('idle'); // idle, signed, folding

    const handleSignClick = () => {
        setIsSigned(true);
        setAnimationPhase('signed');

        // Phase 1: Sign Effect (Flash Red)
        setTimeout(() => {
            setAnimationPhase('folding');
        }, 800);
    };

    // Callback when folding animation is complete
    const handleAnimationComplete = () => {
        if (animationPhase === 'folding') {
            addItem('item004'); // 수상한 계약서
            onSign();
        }
    };

    // Variants for the container
    const containerVariants = {
        idle: { scale: 1, opacity: 1 },
        signed: {
            scale: 1.05,
            boxShadow: "0px 0px 50px rgba(255, 0, 0, 0.5)",
            backgroundColor: "#ffebeb",
            transition: { duration: 0.2, yoyo: 3 }
        },
        folding: {
            scale: 0.1,
            y: 500, // Move down
            x: 200, // Move right
            opacity: 0,
            rotate: 720,
            transition: {
                duration: 1.5,
                ease: "easeInOut"
            }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="idle"
            animate={animationPhase}
            onAnimationComplete={handleAnimationComplete}
            className="w-full h-full max-h-[800px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-xl p-8 border border-gray-200 overflow-y-auto relative z-50"
        >
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-200">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    참가자 <span className="glitch-text" data-text="권리 포기">[뻐끔뻐끔]</span> 및 <span className="glitch-text" data-text="양도">[뻐끔]</span> 각서
                </h2>

                <div className="mb-6 text-gray-600 space-y-4 text-sm leading-relaxed">
                    <p>
                        1. 본인은 '솔피 힐링 클래스' 진행 중 발생하는 신체의{' '}
                        <span className="glitch-text font-bold" data-text="[영구적 변이 및 훼손]">[뻐끔뻐끔]</span>
                        에 대해 주최 측에 책임을 묻지 않습니다.
                    </p>
                    <p>
                        2. 제공되는 음료(솔피의 눈물) 섭취 후 발생하는{' '}
                        <span className="glitch-text font-bold" data-text="[정신 오염 및 환각]">[명상 효과]</span>
                        는 프로그램의 일환임을 인지합니다.
                    </p>
                    <p>
                        3. 본 클래스 종료 시, 참가자의{' '}
                        <span className="glitch-text font-bold" data-text="[육체와 영혼]">[뻐끔뻐끔]</span>
                        의 소유권은{' '}
                        <span className="glitch-text font-bold text-blue-600" data-text="[위대한 솔피]">[뻐끔뻐끔]</span>에게{' '}
                        <span className="glitch-text font-bold" data-text="영구히 귀속됨">[뻐끔뻐끔]</span>에 동의합니다.
                    </p>
                </div>

                <label className="flex items-center space-x-2 mb-6 cursor-pointer">
                    <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        disabled={isSigned}
                    />
                    <span className="text-gray-700 font-medium">위 내용을 모두 확인하였으며 동의합니다. (필수)</span>
                </label>

                <button
                    onClick={handleSignClick}
                    disabled={!isChecked || isSigned}
                    className={`w-full font-bold py-3 px-4 rounded-lg transition duration-300 transform focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${isChecked && !isSigned
                        ? 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {isSigned ? '서명 완료...' : '서명 및 입장'}
                </button>
            </div>
            {!isSigned && (
                <p className="mt-4 text-gray-500 text-xs text-center w-full">
                    참가자의 동의 없이는 진행할 수 없습니다.
                </p>
            )}
        </motion.div>
    );
};

export default GameStartSequence;
