import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IntroSequence = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    const lines = [
        "오랫동안 놈을 쫓았다.",
        "사이비 종교 '우미교'의 교주, 전광어.",
        "수많은 실종 사건의 배후에 그가 있다.",
        "놈들의 본거지인 이 섬에서...",
        "반드시 놈을 잡아넣을 증거를 찾아야 한다."
    ];

    useEffect(() => {
        if (step < lines.length) {
            const timer = setTimeout(() => {
                setStep(prev => prev + 1);
            }, 2500); // Show each line for 2.5s
            return () => clearTimeout(timer);
        } else {
            // All lines shown, wait a bit then complete
            const timer = setTimeout(() => {
                onComplete();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    return (
        <div className="w-full h-full bg-black flex items-center justify-center z-50 absolute inset-0">
            <AnimatePresence mode="wait">
                {step < lines.length && (
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8 }}
                        className="text-white text-xl md:text-2xl font-serif font-medium tracking-wider text-center px-8"
                    >
                        {lines[step]}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default IntroSequence;
