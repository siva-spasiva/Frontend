import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const CrashScene = ({ onMount }) => {
    useEffect(() => {
        // 컴포넌트 마운트 후 자동으로 다음 단계로 넘어가는 타이머 실행
        const timer = setTimeout(onMount, 2500);
        return () => clearTimeout(timer);
    }, [onMount]);

    // 화면 깨짐 효과를 위한 variants
    const glitchVariants = {
        initial: { opacity: 1, filter: 'hue-rotate(0deg) blur(0px)' },
        animate: {
            opacity: [1, 0.8, 1, 0], // 깜빡이다 사라짐
            filter: [
                'hue-rotate(0deg) blur(0px)',
                'hue-rotate(90deg) blur(2px)',
                'hue-rotate(-90deg) blur(4px)',
                'hue-rotate(180deg) blur(10px) contrast(200%)', // 극적인 왜곡
            ],
            scale: [1, 1.02, 0.98, 1.1], // 화면 흔들림
            transition: { duration: 2.5, times: [0, 0.2, 0.8, 1] }
        },
    };

    return (
        <motion.div
            variants={glitchVariants}
            initial="initial"
            animate="animate"
            className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden relative"
        >
            {/* 깨지는 화면 연출을 위한 가짜 텍스트들 */}
            <h1 className="text-6xl font-black text-white absolute top-1/3 left-1/4 animate-pulse" style={{ textShadow: '2px 2px red, -2px -2px blue' }}>
                SYSTEM FAILURE
            </h1>
            <p className="text-xl text-red-500 font-mono absolute bottom-1/4 right-1/4">
                CRITICAL ERROR: CONNECTION LOST...
            </p>
            {/* 노이즈 오버레이 효과 */}
            <div className="absolute inset-0 bg-black opacity-30 mix-blend-overlay pointer-events-none"></div>
        </motion.div>
    );
};

export default CrashScene;
