import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NavigationConfirmation = ({ 
    isOpen, 
    targetLabel, 
    onConfirm, 
    onCancel 
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                        onClick={onCancel}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/40 max-w-sm w-full mx-4 pointer-events-auto text-center"
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-2">이동하시겠습니까?</h3>
                        <p className="text-gray-600 mb-6">
                            <span className="font-bold text-blue-600">[{targetLabel}]</span> (으)로 이동합니다.
                        </p>

                        <div className="flex space-x-3 justify-center">
                            <button
                                onClick={onCancel}
                                className="px-5 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-colors"
                            >
                                이동
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default NavigationConfirmation;
