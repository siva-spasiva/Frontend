import React from 'react';
import { motion } from 'framer-motion';

/**
 * FishPhoneOverlay — 스마트폰 내부에 오버레이되는 물고기화 효과
 *
 * Tier별 효과:
 *   1: 미세한 수중 틴트, 가끔 올라오는 거품
 *   2: 물방울 파티클, 물결 테두리, 비늘 힌트
 *   3: 비늘 패턴 선명, 기포 많아짐, 물결 강함
 *   4: 완전한 수중 느낌, 어안렌즈 on 폰, 비늘 덮임
 */
const FishPhoneOverlay = ({ fishTier = 0, phoneEffects = {} }) => {
    if (fishTier === 0) return null;

    const {
        bgTint = 'transparent',
        bubbleCount = 0,
        scalePatternOpacity = 0,
        waveAnimation = false,
    } = phoneEffects;

    return (
        <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden rounded-[2rem]">

            {/* === 수중 틴트 오버레이 === */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    backgroundColor: [bgTint, bgTint],
                }}
                style={{ backgroundColor: bgTint }}
            />

            {/* === 물결 테두리 효과 (Tier 2+) === */}
            {waveAnimation && (
                <div className="absolute inset-0">
                    {/* 상단 물결 */}
                    <motion.div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{
                            background: `linear-gradient(90deg, 
                                transparent, 
                                rgba(0, 180, 216, ${0.3 + fishTier * 0.1}), 
                                transparent)`,
                        }}
                        animate={{
                            scaleX: [1, 1.1, 1],
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    {/* 하단 물결 */}
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{
                            background: `linear-gradient(90deg, 
                                transparent, 
                                rgba(0, 119, 182, ${0.3 + fishTier * 0.1}), 
                                transparent)`,
                        }}
                        animate={{
                            scaleX: [1, 1.1, 1],
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                    />
                </div>
            )}

            {/* === 물방울 (기포) 파티클 === */}
            {bubbleCount > 0 && (
                <div className="absolute inset-0">
                    {Array.from({ length: bubbleCount }).map((_, i) => {
                        const size = 4 + Math.random() * 8;
                        const left = 5 + Math.random() * 90;
                        const delay = Math.random() * 10;
                        const duration = 5 + Math.random() * 5;
                        return (
                            <motion.div
                                key={`bubble-${i}`}
                                className="absolute rounded-full"
                                style={{
                                    width: size,
                                    height: size,
                                    left: `${left}%`,
                                    bottom: '-3%',
                                    border: `1px solid rgba(150, 220, 255, ${0.4 + fishTier * 0.1})`,
                                    background: `radial-gradient(circle at 30% 30%, 
                                        rgba(200, 240, 255, ${0.2 + fishTier * 0.05}), 
                                        transparent)`,
                                }}
                                animate={{
                                    y: [0, -500],
                                    x: [0, (Math.random() - 0.5) * 30],
                                    opacity: [0.7, 0],
                                    scale: [1, 0.5],
                                }}
                                transition={{
                                    duration,
                                    repeat: Infinity,
                                    delay,
                                    ease: 'easeOut',
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {/* === 비늘 패턴 오버레이 (Tier 3+) === */}
            {scalePatternOpacity > 0 && (
                <div
                    className="absolute inset-0 mix-blend-overlay"
                    style={{
                        opacity: scalePatternOpacity,
                        backgroundImage: `
                            radial-gradient(circle, rgba(0, 150, 200, 0.3) 1px, transparent 1px),
                            radial-gradient(circle, rgba(0, 120, 180, 0.2) 1px, transparent 1px)
                        `,
                        backgroundSize: '12px 12px, 12px 12px',
                        backgroundPosition: '0 0, 6px 6px',
                    }}
                />
            )}

            {/* === 어안렌즈 비네팅 on 폰 (Tier 3+) === */}
            {fishTier >= 3 && (
                <div
                    className="absolute inset-0"
                    style={{
                        background: `radial-gradient(ellipse at center, 
                            transparent 50%, 
                            rgba(0, 40, 80, ${0.1 + (fishTier - 2) * 0.08}) 85%, 
                            rgba(0, 20, 60, ${0.2 + (fishTier - 2) * 0.1}) 100%)`,
                    }}
                />
            )}

            {/* === 수면 반사광 (폰 내부) — Tier 2+ === */}
            {fishTier >= 2 && (
                <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0.02, 0.06, 0.02] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        backgroundImage: `
                            linear-gradient(135deg, 
                                transparent 20%, 
                                rgba(100, 200, 255, 0.08) 40%, 
                                transparent 60%)
                        `,
                    }}
                />
            )}

            {/* === 물방울 응결 효과 (Tier 4) === */}
            {fishTier >= 4 && (
                <div className="absolute inset-0">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={`droplet-${i}`}
                            className="absolute rounded-full"
                            style={{
                                width: `${3 + Math.random() * 5}px`,
                                height: `${4 + Math.random() * 7}px`,
                                left: `${10 + Math.random() * 80}%`,
                                top: `${10 + Math.random() * 80}%`,
                                background: `radial-gradient(ellipse at 30% 20%, 
                                    rgba(180, 230, 255, 0.4), 
                                    rgba(100, 180, 220, 0.1))`,
                                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FishPhoneOverlay;
