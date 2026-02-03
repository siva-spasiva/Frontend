import React, { useState } from 'react';
import { motion } from 'framer-motion';

const GameStartSequence = ({ onSign }) => {
    const [isSigned, setIsSigned] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    const handleSignClick = () => {
        setIsSigned(true);
        // 서명 시 화면이 붉게 번쩍이는 충격 효과 후 다음 단계로 이동
        setTimeout(onSign, 300);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, backgroundColor: isSigned ? '#ff000080' : '#ffffff' }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="w-full h-full max-h-[800px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-xl p-8 border border-gray-200 overflow-y-auto"
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
                        <span className="glitch-text font-bold" data-text="[육체와 영혼]">[모든 권리]</span>
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
                    />
                    <span className="text-gray-700 font-medium">위 내용을 모두 확인하였으며 동의합니다. (필수)</span>
                </label>

                <button
                    onClick={handleSignClick}
                    disabled={!isChecked}
                    className={`w-full font-bold py-3 px-4 rounded-lg transition duration-300 transform focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${isChecked
                            ? 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    서명 및 입장
                </button>
            </div>
            <p className="mt-4 text-gray-500 text-xs">
                친구 A: "야, 빨리 눌러! 웰컴 드링크 다 식겠다!"
            </p>
        </motion.div>
    );
};

export default GameStartSequence;
