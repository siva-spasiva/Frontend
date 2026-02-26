import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle } from 'lucide-react';

const InteractionPopup = ({
    isOpen,
    messages,
    onComplete,
    title = '안내',
    showTitle = true,
}) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
        }
    }, [isOpen, messages]);

    if (!isOpen || !messages || messages.length === 0) return null;
    const safeIndex = Math.min(currentIndex, messages.length - 1);

    const handleNext = () => {
        if (safeIndex < messages.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else {
            onComplete && onComplete();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div key="interaction-popup-wrapper" className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-gray-900 border border-blue-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden mx-4"
                    >
                        {/* Glow Effect */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />

                        {/* Header */}
                        <div className="relative z-10 flex justify-between items-start mb-6">
                            <div>
                                {showTitle && (
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2 drop-shadow-md">
                                        <Info className="text-blue-400 w-6 h-6" />
                                        {title}
                                    </h2>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 bg-black/40 rounded-xl p-6 mb-6 border border-white/5 flex flex-col">
                            <motion.p
                                key={safeIndex} // re-animate on message change
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-blue-50 text-base leading-relaxed whitespace-pre-wrap"
                            >
                                {messages[safeIndex]}
                            </motion.p>
                        </div>

                        {/* Actions & Progress */}
                        <div className="relative z-10 flex items-center justify-between">
                            <span className="text-xs text-blue-300/50 font-mono tracking-widest pl-2">
                                {safeIndex + 1} / {messages.length}
                            </span>
                            <button
                                onClick={handleNext}
                                className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center group transition-all"
                            >
                                <span className="group-hover:scale-105 transition-transform flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    {safeIndex < messages.length - 1 ? '다음' : '확인'}
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InteractionPopup;
