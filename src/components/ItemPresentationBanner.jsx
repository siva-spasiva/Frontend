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
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="pointer-events-auto mx-2 mb-1"
                >
                    <div className="relative bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 backdrop-blur-xl rounded-2xl border border-amber-400/25 shadow-[0_4px_20px_rgba(245,158,11,0.15)] overflow-hidden">
                        {/* Subtle animated glow line */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

                        <div className="flex items-center px-3 py-2.5 gap-3">
                            {/* Item Icon with glow */}
                            <div className="relative flex-shrink-0">
                                <div className="w-11 h-11 bg-gradient-to-br from-amber-900/40 to-yellow-900/30 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-inner">
                                    <span className="text-2xl drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]">{presentedItem.icon || '📦'}</span>
                                </div>
                                {/* Pulsing dot indicator */}
                                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse" />
                            </div>

                            {/* Item Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <HandMetal className="w-3 h-3 text-amber-400/80" />
                                    <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest">
                                        제시 중
                                    </span>
                                    {isTranscript && (
                                        <span className="text-[8px] bg-blue-500/25 text-blue-300 px-1 py-0.5 rounded font-mono leading-none">
                                            녹음
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-white/95 truncate">
                                        {presentedItem.name}
                                    </span>
                                    {npcName && (
                                        <span className="text-[10px] text-white/40 flex-shrink-0">
                                            → {npcName}
                                        </span>
                                    )}
                                </div>
                                {isTranscript && presentedItem.transcriptSummary && (
                                    <p className="text-[10px] text-white/30 truncate mt-0.5 italic">
                                        "{presentedItem.transcriptSummary}"
                                    </p>
                                )}
                            </div>

                            {/* Clear Button */}
                            <button
                                onClick={onClear}
                                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors group"
                                title="제시 취소"
                            >
                                <X className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 transition-colors" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ItemPresentationBanner;
