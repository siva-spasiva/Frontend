
import React from 'react';
import { motion } from 'framer-motion';

/**
 * FishText Component
 * 
 * 백엔드에서 전송된 "[뻐끔]" 텍스트를 감지하여 시각적 효과를 부여합니다.
 * 일반 텍스트는 그대로 렌더링하고, "[뻐끔]" 부분만 흔들리거나 흐릿한 효과를 줍니다.
 */
export const FishText = ({ text }) => {
    if (!text) return null;

    // "[뻐끔]" 패턴 분리 (캡처 그룹 사용)
    const parts = text.split(/(\[뻐끔\])/g);

    return (
        <span>
            {parts.map((part, index) => {
                if (part === '[뻐끔]') {
                    return (
                        <motion.span
                            key={index}
                            className="inline-block text-cyan-400 font-bold mx-1"
                            animate={{
                                opacity: [0.6, 1, 0.6],
                                scale: [0.9, 1.1, 0.9],
                                y: [0, -2, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            style={{
                                textShadow: '0 0 5px rgba(0, 255, 255, 0.5)'
                            }}
                        >
                            🫧뻐끔🫧
                        </motion.span>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};
