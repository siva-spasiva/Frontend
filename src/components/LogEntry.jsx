import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FishText } from '../utils/fishTalk';

const LogEntry = ({ log }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Item Presentation log type
    if (log.type === 'item_presentation') {
        return (
            <div className="mb-3 text-sm rounded-lg p-3 backdrop-blur-md border border-opacity-30 bg-amber-900/30 border-yellow-600">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">{log.icon || '📦'}</span>
                    <div>
                        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider bg-yellow-900/40 px-1.5 py-0.5 rounded mr-2">
                            아이템 제시
                        </span>
                        <span className="text-yellow-200 font-medium">{log.itemName}</span>
                    </div>
                </div>
                {log.text && (
                    <p className="text-xs text-gray-400 mt-1 pl-9">
                        {log.text}
                    </p>
                )}
            </div>
        );
    }

    if (log.type === 'active_npc' || log.type === 'npc' || log.type === 'system') {
        const isSystem = log.type === 'system';
        return (
            <div className={`mb-3 text-sm rounded-lg p-3 backdrop-blur-md border border-opacity-30 ${isSystem ? 'bg-blue-900/30 border-blue-500' : 'bg-black/60 border-yellow-700'}`}>
                <div
                    className={`${isSystem ? 'text-blue-400' : 'text-yellow-500'} cursor-pointer flex items-center group select-none`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <span className={`mr-2 font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wider ${isSystem ? 'bg-blue-900/50' : 'bg-yellow-900/40'}`}>
                        {log.speaker?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    <span className="opacity-70 text-[10px] mr-2 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        ▶
                    </span>
                    {!isExpanded && (
                        <span className="text-gray-300 truncate flex-1 opacity-80 h-5 leading-5 items-center flex">
                            <FishText text={log.text.substring(0, 50) + (log.text.length > 50 ? '...' : '')} />
                        </span>
                    )}
                </div>
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="text-gray-100 whitespace-pre-line pl-1 leading-relaxed border-t border-white/10 pt-2 font-medium"
                        >
                            <FishText text={log.text} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // User type
    return (
        <div className="mb-4 text-sm flex justify-end">
            <div className="bg-gray-700/80 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] border border-gray-600 shadow-sm relative">
                {log.text}
                <div className="absolute top-0 -right-1 w-2 h-2 bg-gray-700/80 transform rotate-45"></div>
            </div>
        </div>
    );
};

export default LogEntry;
