import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Package, Info, CheckCircle } from 'lucide-react';
import { useGame } from '../../context/GameContext';

const InventoryApp = ({ onBack }) => {
    const { inventoryItems } = useGame();
    const [selectedItem, setSelectedItem] = useState(null);

    return (
        <div className="w-full h-full bg-gray-50 flex flex-col pt-12 relative overflow-hidden">
            {/* Header */}
            <div className="px-4 pb-4 flex items-center justify-between bg-white shadow-sm z-10 sticky top-0">
                <div className="flex items-center space-x-2">
                    <button onClick={onBack} className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
                </div>
                <div className="bg-gray-100 p-2 rounded-full">
                    <Package className="w-5 h-5 text-gray-600" />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {!selectedItem ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 grid grid-cols-3 gap-4 overflow-y-auto h-full pb-20 content-start"
                        >
                            {inventoryItems && inventoryItems.length > 0 ? (
                                inventoryItems.map((item) => (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="aspect-square bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center p-2 space-y-2 relative"
                                    >
                                        <div className="text-4xl filter drop-shadow-sm">{item.icon || '📦'}</div>
                                        <span className="text-[10px] text-center font-medium text-gray-600 line-clamp-2 leading-tight w-full">
                                            {item.name}
                                        </span>
                                        {item.type === 'key_item' && (
                                            <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full ring-2 ring-white"></div>
                                        )}
                                    </motion.button>
                                ))
                            ) : (
                                <div className="col-span-3 flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
                                    <Package className="w-12 h-12 opacity-20" />
                                    <p className="text-sm">비어있음</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detail"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-6 h-full flex flex-col items-center overflow-y-auto bg-white"
                        >
                            <div className="w-full flex items-center justify-start mb-4">
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="text-sm text-blue-500 flex items-center font-medium hover:underline"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    목록으로
                                </button>
                            </div>

                            <motion.div
                                initial={{ scale: 0.8, rotate: -5 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-200 rounded-3xl flex items-center justify-center shadow-inner mb-6 border border-gray-100"
                            >
                                <span className="text-6xl drop-shadow-md">{selectedItem.icon || '📦'}</span>
                            </motion.div>

                            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">{selectedItem.name}</h2>

                            <div className="flex items-center space-x-2 mb-6">
                                <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-md font-bold ${selectedItem.type === 'key_item' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {selectedItem.type === 'key_item' ? 'KEY ITEM' : 'NORMAL'}
                                </span>
                                <span className="text-xs text-gray-400 font-mono text-center">#{selectedItem.id.split('_')[1] || '000'}</span>
                            </div>

                            <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                                <div className="flex items-start space-x-3">
                                    <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-600 leading-relaxed text-justify break-keep">
                                        {selectedItem.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto w-full pb-8">
                                <button
                                    disabled={true}
                                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg opacity-50 cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    <span>사용하기</span>
                                </button>
                                <p className="text-xs text-center text-gray-400 mt-2">지금은 사용할 수 없습니다.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default InventoryApp;
