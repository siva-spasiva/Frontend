import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InteractionPopup = ({ isOpen, messages, onComplete, title = "안내" }) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    // Reset index when newly opened
    React.useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
        }
    }, [isOpen]);

    if (!isOpen || !messages || messages.length === 0) return null;

    const handleNext = () => {
        if (currentIndex < messages.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onComplete && onComplete();
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                key="interaction-popup"
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
            >
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border-2 border-blue-400">
                    {/* Header line */}
                    <div className="bg-blue-500 h-1 w-full" />

                    <div className="p-4 flex items-start space-x-4">
                        <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1 text-lg">{title}</h4>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                                {messages[currentIndex]}
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500 font-mono">
                            {currentIndex + 1} / {messages.length}
                        </span>
                        <button
                            onClick={handleNext}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg text-sm transition-colors shadow-sm"
                        >
                            {currentIndex < messages.length - 1 ? '다음' : '확인'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InteractionPopup;
