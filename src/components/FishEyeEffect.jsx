import React, { useId } from 'react';
import { motion } from 'framer-motion';

/**
 * FishEyeEffect — 맵 위에 오버레이되는 어안렌즈 + 수중 효과
 *
 * Props:
 *   fishTier (number) — 0~5 tier
 *   mapEffects (object) — useFishVisuals().mapEffects
 *   waveFilterId (string) — 외부에서 사용할 SVG filter ID (scene 컨테이너에 filter: url(#id) 적용용)
 *
 * 구성:
 *   1. SVG 필터 정의 (수중 물결 왜곡) — 이 필터를 scene 배경에도 적용 가능
 *   2. 비네팅 그라데이션 (어안렌즈 가장자리 어둡게)
 *   3. 청록색 틴트 오버레이 (일렁이는 호흡)
 *   4. 수면 반사광 (caustics) 패턴
 *   5. 떠다니는 파티클
 */
const FishEyeEffect = ({ fishTier = 0, mapEffects = {}, waveFilterId: externalFilterId }) => {
    const internalId = useId();
    const filterId = externalFilterId || `wave-${internalId}`;

    if (fishTier === 0) return null;

    const {
        vignetteOpacity = 0,
        waveIntensity = 0,
        tintOpacity = 0,
        edgeBlur = 0,
    } = mapEffects;

    return (
        <div className="absolute inset-0 pointer-events-none z-[5]" style={{ overflow: 'hidden' }}>
            {/* === SVG Filter Definition (수중 물결 왜곡) === 
                 이 필터는 여기서 정의만 하고, 실제 적용은:
                 - scene 컨테이너의 style={{ filter: url(#filterId) }}
                 - 내부 오버레이 div
                 두 곳에서 가능. */}
            <svg className="absolute w-0 h-0" aria-hidden="true">
                <defs>
                    <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency={`${0.004 + fishTier * 0.0015} ${0.003 + fishTier * 0.001}`}
                            numOctaves={fishTier >= 4 ? 3 : 2}
                            seed="42"
                            result="turbulence"
                        >
                            <animate
                                attributeName="seed"
                                from="0"
                                to="100"
                                dur={`${Math.max(10, 24 - fishTier * 2)}s`}
                                repeatCount="indefinite"
                            />
                        </feTurbulence>
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="turbulence"
                            scale={waveIntensity}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </defs>
            </svg>

            {/* === 비네팅 (어안렌즈 가장자리 어둡게) === */}
            <div
                className="absolute inset-0 transition-opacity duration-1000"
                style={{
                    opacity: vignetteOpacity,
                    background: `radial-gradient(ellipse at center, 
                        transparent 30%, 
                        rgba(0, 40, 60, 0.3) 60%, 
                        rgba(0, 20, 40, 0.7) 85%, 
                        rgba(0, 10, 30, 0.9) 100%)`,
                }}
            />

            {/* === 어안렌즈 배럴 왜곡 시뮬레이션 (둥근 프레임) === */}
            {fishTier >= 2 && (
                <div
                    className="absolute inset-0 transition-all duration-1000"
                    style={{
                        boxShadow: `inset 0 0 ${40 + fishTier * 20}px ${10 + fishTier * 8}px rgba(0, 20, 40, ${0.2 + fishTier * 0.08})`,
                        borderRadius: fishTier >= 3 ? `${5 + (fishTier - 2) * 4}%` : '0%',
                    }}
                />
            )}

            {/* === 청록색 수중 틴트 (일렁이는 호흡) === */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    opacity: [tintOpacity, tintOpacity * 1.4, tintOpacity],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    background: fishTier <= 2
                        ? 'linear-gradient(180deg, rgba(0, 180, 216, 0.05) 0%, rgba(0, 119, 182, 0.1) 100%)'
                        : 'linear-gradient(180deg, rgba(0, 150, 199, 0.1) 0%, rgba(0, 80, 120, 0.2) 100%)',
                }}
            />

            {/* === 수면 반사광 (Caustics) — Tier 2+ === */}
            {fishTier >= 2 && (
                <motion.div
                    className="absolute inset-0 mix-blend-overlay"
                    animate={{ opacity: [0.03, 0.08, 0.03] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        backgroundImage: `radial-gradient(ellipse at 30% 20%, rgba(120, 220, 255, ${0.15 + fishTier * 0.05}) 0%, transparent 50%),
                                          radial-gradient(ellipse at 70% 60%, rgba(100, 200, 255, ${0.1 + fishTier * 0.04}) 0%, transparent 40%),
                                          radial-gradient(ellipse at 50% 80%, rgba(80, 180, 255, ${0.08 + fishTier * 0.03}) 0%, transparent 45%)`,
                    }}
                />
            )}

            {/* === 떠다니는 미세 파티클 — Tier 3+ === */}
            {fishTier >= 3 && (
                <div className="absolute inset-0 overflow-hidden">
                    {Array.from({ length: Math.min(fishTier, 5) }).map((_, i) => (
                        <motion.div
                            key={`particle-${i}`}
                            className="absolute rounded-full"
                            style={{
                                width: `${2 + Math.random() * 3}px`,
                                height: `${2 + Math.random() * 3}px`,
                                background: `rgba(120, 200, 255, ${0.3 + Math.random() * 0.3})`,
                                left: `${10 + Math.random() * 80}%`,
                                bottom: '-5%',
                                willChange: 'transform, opacity'
                            }}
                            animate={{
                                y: [0, -600 - Math.random() * 200],
                                x: [0, (Math.random() - 0.5) * 60],
                                opacity: [0.6, 0],
                                scale: [1, 0.3],
                            }}
                            transition={{
                                duration: 8 + Math.random() * 6,
                                repeat: Infinity,
                                delay: Math.random() * 10,
                                ease: 'easeOut',
                            }}
                        />
                    ))}
                </div>
            )}

            {/* === 가장자리 블러 (Tier 3+) === */}
            {edgeBlur > 0 && (
                <div
                    className="absolute inset-0"
                    style={{
                        backdropFilter: `blur(${edgeBlur}px)`,
                        WebkitBackdropFilter: `blur(${edgeBlur}px)`,
                        maskImage: `radial-gradient(ellipse at center, transparent 55%, black 90%)`,
                        WebkitMaskImage: `radial-gradient(ellipse at center, transparent 55%, black 90%)`,
                    }}
                />
            )}
        </div>
    );
};

export default FishEyeEffect;
