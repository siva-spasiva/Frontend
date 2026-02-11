import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Placeholder: 사람 실루엣 SVG + 파일명 표시 (포트레이트 미준비 NPC용)
const PlaceholderPortrait = ({ filename, name }) => (
    <div className="h-[90%] w-full flex flex-col items-center justify-end">
        <div className="relative w-[280px] h-[500px] flex flex-col items-center justify-center">
            {/* 사람 실루엣 */}
            <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-2xl" fill="none">
                <circle cx="100" cy="80" r="45" fill="#1a1a2e" stroke="#444" strokeWidth="1.5" />
                <path d="M40 400 L40 220 Q40 160 100 160 Q160 160 160 220 L160 400 Z"
                    fill="#1a1a2e" stroke="#444" strokeWidth="1.5" />
                <text x="100" y="95" textAnchor="middle" fill="#666" fontSize="48" fontFamily="monospace">?</text>
            </svg>
            {/* 파일명 오버레이 */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-black/70 text-yellow-400 text-xs font-mono px-2 py-1 rounded">
                    {filename || 'no_file'}
                </span>
            </div>
            {/* NPC 이름 */}
            <div className="absolute top-2 left-0 right-0 text-center">
                <span className="bg-black/70 text-gray-300 text-xs px-2 py-0.5 rounded">
                    {name || 'Unknown NPC'}
                </span>
            </div>
        </div>
    </div>
);

const PortraitDisplay = ({ activeNpc, className, isPhoneOpen, viewMode }) => {
    const [imgError, setImgError] = useState(null);

    if (!activeNpc || viewMode === 'hidden') return null;

    const portraitSrc = activeNpc.portraits?.default || activeNpc.initialPortrait;
    const showPlaceholder = !portraitSrc || imgError === portraitSrc;

    const handleLoad = () => setImgError(null);
    const handleError = () => setImgError(portraitSrc);

    return (
        <div className={`absolute right-10 top-0 h-full w-[500px] flex items-end justify-center z-0 pointer-events-none ${className}`}>
            <AnimatePresence mode="wait">
                {activeNpc && (
                    <motion.div
                        key={activeNpc.id}
                        className="h-full flex items-end justify-center"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        {showPlaceholder ? (
                            <PlaceholderPortrait
                                filename={portraitSrc?.split('/').pop() || activeNpc.id}
                                name={activeNpc.name}
                            />
                        ) : (
                            <img
                                src={portraitSrc}
                                alt={activeNpc.name}
                                className="h-[90%] object-contain drop-shadow-2xl"
                                onError={handleError}
                                onLoad={handleLoad}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PortraitDisplay;
