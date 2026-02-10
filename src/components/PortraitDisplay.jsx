import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PortraitDisplay = ({ activeNpc, className, isPhoneOpen, viewMode }) => {
    // Determine image based on activeNpc state or object
    // activeNpc could be string ID or object with portrait info

    // Hide ONLY if viewMode is hidden (Cinematic mode) or no active NPC
    // We removed isPhoneOpen check so NPC stays visible when Phone/UI is active
    if (!activeNpc || viewMode === 'hidden') return null;

    return (
        <div className={`absolute right-10 top-0 h-full w-[500px] flex items-end justify-center z-0 pointer-events-none ${className}`}>
            <AnimatePresence>
                {activeNpc && (
                    <motion.img
                        key={activeNpc.id}
                        src={activeNpc.portraits?.default || activeNpc.initialPortrait}
                        alt={activeNpc.name}
                        className="h-[90%] object-contain drop-shadow-2xl"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default PortraitDisplay;
