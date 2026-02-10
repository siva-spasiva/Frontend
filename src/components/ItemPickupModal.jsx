import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X, CheckCircle, Unlock, Key } from 'lucide-react';
import { useGame } from '../context/GameContext';

const ItemPickupModal = ({ isOpen, item, onClose, onCollect }) => {

    if (!item) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-gray-900 border border-yellow-500/20 rounded-2xl p-6 shadow-2xl overflow-hidden mx-4"
                    >
                        {/* Glow Effect */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 blur-3xl rounded-full" />

                        {/* Header */}
                        <div className="relative z-10 flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Package className="text-yellow-400 w-6 h-6" />
                                    아이템 발견!
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">무언가 쓸만한 것을 찾았다.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Item Details */}
                        <div className="relative z-10 bg-black/40 rounded-xl p-6 mb-8 border border-white/5 flex flex-col items-center text-center">
                            <motion.div
                                initial={{ scale: 0.8, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                className="text-6xl mb-4 drop-shadow-lg"
                            >
                                {item.icon || '📦'}
                            </motion.div>

                            <h3 className="text-xl font-bold text-yellow-100 mb-2">{item.name}</h3>

                            <div className="flex items-center space-x-2 mb-4">
                                <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded font-bold ${item.type === 'key_item' ? 'bg-yellow-900/50 text-yellow-200 border border-yellow-700/50' : 'bg-blue-900/50 text-blue-200 border border-blue-700/50'
                                    }`}>
                                    {item.type === 'key_item' ? 'KEY ITEM' : 'NORMAL'}
                                </span>
                            </div>

                            <p className="text-gray-300 text-sm leading-relaxed max-w-[80%]">
                                {item.description}
                            </p>
                        </div>

                        {/* Action Button */}
                        <div className="relative z-10">
                            <button
                                onClick={() => {
                                    onCollect();
                                    onClose();
                                }}
                                className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg shadow-yellow-900/20 flex items-center justify-center group transition-all"
                            >
                                <span className="group-hover:scale-105 transition-transform flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    획득하기
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ItemPickupModal;
