import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HandMetal } from 'lucide-react';

/**
 * ItemPresentationBanner
 * 
 * 채팅 UI 위쪽에 표시되는 아이템 제시 배너.
 * 현재 NPC에게 제시 중인 아이템 정보를 보여준다.
 * 
 * Props:
 *  - presentedItem: { itemId, name, icon, description, type, transcriptSummary? }
 *  - onClear: () => void  — 제시 취소
 *  - npcName: string — 현재 NPC 이름
 */
const ItemPresentationBanner = ({ presentedItem, onClear, npcName }) => {
    if (!presentedItem) return null;

    const isTranscript = presentedItem.type === 'transcript';

    return (
        <AnimatePresence>
            {presentedItem && (
                <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="pointer-events-auto"
                >
                    <div className="mx-2 mb-2 bg-gradient-to-r from-amber-900/60 to-yellow-900/40 backdrop-blur-md rounded-xl border border-yellow-600/30 shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-yellow-600/20">
                            <div className="flex items-center space-x-2">
                                <HandMetal className="w-4 h-4 text-yellow-400" />
                                <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">
                                    아이템 제시 중
                                </span>
                            </div>
                            <button
                                onClick={onClear}
                                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                title="제시 취소"
                            >
                                <X className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-3 py-2 flex items-center space-x-3">
                            {/* Item Icon */}
                            <div className="w-10 h-10 bg-black/30 rounded-lg flex items-center justify-center border border-yellow-700/30 flex-shrink-0">
                                <span className="text-2xl">{presentedItem.icon || '📦'}</span>
                            </div>

                            {/* Item Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-bold text-white truncate">
                                        {presentedItem.name}
                                    </span>
                                    {isTranscript && (
                                        <span className="text-[9px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                                            녹음
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                    {npcName ? `${npcName}에게 제시` : '제시 대기'}
                                    {isTranscript && presentedItem.transcriptSummary
                                        ? ` — "${presentedItem.transcriptSummary}"`
                                        : ''
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ItemPresentationBanner;
