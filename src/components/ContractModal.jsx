import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ContractModal = ({ isOpen, onClose, onSign }) => {
    const [isChecked, setIsChecked] = useState(false);
    const [isSigned, setIsSigned] = useState(false);

    const handleSign = () => {
        setIsSigned(true);
        setTimeout(() => {
            onSign();
            onClose();
        }, 800);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                        y: 0,
                        backgroundColor: isSigned ? '#ff000020' : '#ffffff'
                    }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden relative"
                >
                    {/* Contract Paper Texture Effect */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>

                    <div className="p-8 relative z-10">
                        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 border-b-2 border-gray-800 pb-4">
                            참가자 <span className="glitch-text text-red-600" data-text="권리 포기">[뻐끔뻐끔]</span> 및 <span className="glitch-text text-red-600" data-text="양도">[뻐끔]</span> 각서
                        </h2>

                        <div className="mb-8 text-gray-700 space-y-4 text-sm leading-relaxed font-serif">
                            <p>
                                1. 본인은 '솔피 힐링 클래스' 진행 중 발생하는 신체의{' '}
                                <span className="font-bold text-red-600">[영구적 변이 및 훼손]</span>
                                에 대해 주최 측에 책임을 묻지 않습니다.
                            </p>
                            <p>
                                2. 제공되는 음료(솔피의 눈물) 섭취 후 발생하는{' '}
                                <span className="font-bold text-red-600">[정신 오염 및 환각]</span>
                                은 프로그램의 일환임을 인지합니다.
                            </p>
                            <p>
                                3. 본 클래스 종료 시, 참가자의{' '}
                                <span className="font-bold text-red-600">[뻐끔뻐끔]</span>
                                의 소유권은{' '}
                                <span className="font-bold text-blue-800">[위대한 솔피]</span>에게{' '}
                                <span className="font-bold text-red-600">영구히 귀속됨</span>에 동의합니다.
                            </p>
                        </div>

                        <label className="flex items-start space-x-3 mb-8 cursor-pointer group p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-red-500 checked:bg-red-500"
                                    checked={isChecked}
                                    onChange={(e) => setIsChecked(e.target.checked)}
                                />
                                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors pt-0.5">
                                위 내용을 모두 확인하였으며, 이에 <span className="text-red-500 font-bold">절대적으로 동의</span>합니다.
                            </span>
                        </label>

                        <button
                            onClick={handleSign}
                            disabled={!isChecked}
                            className={`w-full py-4 rounded-xl font-black tracking-widest text-lg transition-all duration-300 transform ${isChecked
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isSigned ? (
                                <span className="animate-pulse">서명 확인 중...</span>
                            ) : (
                                <span>서명하기 (Sign)</span>
                            )}
                        </button>
                    </div>

                    {/* Bloodstain Effect on Sign */}
                    {isSigned && (
                        <motion.div
                            initial={{ opacity: 0, scale: 2 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        >
                            <div className="text-red-800/20 font-script text-9xl transform -rotate-12">
                                SIGNED
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ContractModal;
