import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Package, Info, CheckCircle, Trash2, PlayCircle, HandMetal } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import ChatLog from '../ChatLog';

const InventoryApp = ({ onBack, disableConsumableUse = false, useOnlyItemId = null }) => {
    const { inventoryItems, removeItem, useItem: consumeItem, presentItem, isNpcPresent, activeNpcInField, presentedItem } = useGame();
    const [selectedItem, setSelectedItem] = useState(null);
    const [isReading, setIsReading] = useState(false); // Reading mode for transcripts
    const isUseOnlyMode = Boolean(useOnlyItemId);
    const canPresentSelectedItem = isNpcPresent && !isUseOnlyMode;
    const isUseTargetItem = !isUseOnlyMode || selectedItem?.id === useOnlyItemId;
    const canReadSelectedItem = selectedItem?.type === 'transcript' && !isUseOnlyMode;
    const canUseSelectedItem = !!selectedItem?.consumable && !disableConsumableUse && isUseTargetItem;
    const canUseAction = canReadSelectedItem || canUseSelectedItem;

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
                    {isReading && selectedItem?.type === 'transcript' ? (
                        <Motion.div
                            key="reader"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-gray-900 h-full flex flex-col"
                        >
                            <div className="p-4 bg-gray-800 text-white flex items-center justify-between shadow-md z-10">
                                <button
                                    onClick={() => setIsReading(false)}
                                    className="flex items-center text-sm font-bold text-gray-300 hover:text-white"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-1" />
                                    뒤로가기
                                </button>
                                <span className="text-xs font-mono text-gray-400">
                                    {selectedItem.name}
                                </span>
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                <ChatLog logs={selectedItem.content} viewMode="full" />
                            </div>
                        </Motion.div>
                    ) : !selectedItem ? (
                        <Motion.div
                            key="grid"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 grid grid-cols-3 gap-4 overflow-y-auto h-full pb-20 content-start"
                        >
                            {inventoryItems && inventoryItems.length > 0 ? (
                                inventoryItems.map((item) => (
                                    <Motion.button
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
                                    </Motion.button>
                                ))
                            ) : (
                                <div className="col-span-3 flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
                                    <Package className="w-12 h-12 opacity-20" />
                                    <p className="text-sm">비어있음</p>
                                </div>
                            )}
                        </Motion.div>
                    ) : (
                        <Motion.div
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

                            <Motion.div
                                initial={{ scale: 0.8, rotate: -5 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-200 rounded-3xl flex items-center justify-center shadow-inner mb-6 border border-gray-100"
                            >
                                <span className="text-6xl drop-shadow-md">{selectedItem.icon || '📦'}</span>
                            </Motion.div>

                            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">{selectedItem.name}</h2>

                            <div className="flex items-center space-x-2 mb-6">
                                <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-md font-bold ${selectedItem.type === 'key_item' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {selectedItem.type === 'key_item' ? 'KEY ITEM' : 'NORMAL'}
                                </span>
                                <span className="text-xs text-gray-400 font-mono text-center">#{selectedItem.id.replace('item', '')}</span>
                            </div>

                            <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                                <div className="flex items-start space-x-3 mb-2">
                                    <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-600 leading-relaxed text-justify break-keep">
                                        {selectedItem.description}
                                    </p>
                                </div>
                                {selectedItem.flavorText && (
                                    <div className="pl-8 border-l-2 border-gray-200">
                                        <p className="text-xs text-gray-500 italic font-serif">
                                            "{selectedItem.flavorText}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Contract Content View */}
                            {(selectedItem.id === 'item004' || selectedItem.id === 'item020' || selectedItem.isContract) && (
                                <div className="w-full bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                                    <h3 className="text-lg font-bold mb-4 text-center text-gray-800 border-b pb-2">
                                        참가자 <span className="text-red-500 font-mono">
                                            {selectedItem.id === 'item020' ? '[권리 포기]' : '[뻐끔뻐끔]'}
                                        </span> 및 <span className="text-red-500 font-mono">
                                            {selectedItem.id === 'item020' ? '[양도]' : '[뻐끔]'}
                                        </span> 각서
                                    </h3>
                                    <div className="text-gray-600 space-y-4 text-xs leading-relaxed font-serif">
                                        <p>
                                            1. 본인은 '솔피 힐링 클래스' 진행 중 발생하는 신체의{' '}
                                            <span className="text-red-500 font-bold font-mono">
                                                {selectedItem.id === 'item020' ? '[영구적 변이 및 훼손]' : '[뻐끔뻐끔]'}
                                            </span>
                                            에 대해 주최 측에 책임을 묻지 않습니다.
                                        </p>
                                        <p>
                                            2. 제공되는 음료(솔피의 눈물) 섭취 후 발생하는{' '}
                                            <span className="text-red-500 font-bold font-mono">
                                                {selectedItem.id === 'item020' ? '[정신 오염 및 환각]' : '[명상 효과]'}
                                            </span>
                                            는 프로그램의 일환임을 인지합니다.
                                        </p>
                                        <p>
                                            3. 본 클래스 종료 시, 참가자의{' '}
                                            <span className="text-red-500 font-bold font-mono">
                                                {selectedItem.id === 'item020' ? '[모든 권리]' : '[뻐끔뻐끔]'}
                                            </span>
                                            의 소유권은{' '}
                                            <span className="text-blue-600 font-bold font-mono">
                                                {selectedItem.id === 'item020' ? '[위대한 솔피]' : '[뻐끔뻐끔]'}
                                            </span>에게{' '}
                                            <span className="text-red-500 font-bold font-mono">
                                                {selectedItem.id === 'item020' ? '[영구히 귀속됨]' : '[뻐끔뻐끔]'}
                                            </span>에 동의합니다.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                        <div className="text-red-600 font-script text-xl transform -rotate-12 border-2 border-red-600 px-2 py-1 rounded inline-block opacity-70">
                                            서명완료
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto w-full pb-8 space-y-3">
                                {/* 제시 Button — active only when NPC is present in field */}
                                <button
                                    onClick={() => {
                                        if (selectedItem && canPresentSelectedItem) {
                                            presentItem(selectedItem);
                                            onBack(); // Close inventory and return to game
                                        }
                                    }}
                                    disabled={!canPresentSelectedItem}
                                    className={`w-full py-3 rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2 transition-all ${canPresentSelectedItem
                                        ? presentedItem?.itemId === selectedItem?.id
                                            ? 'bg-yellow-700 text-yellow-200 border-2 border-yellow-500'
                                            : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-amber-900/30'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <HandMetal className="w-5 h-5" />
                                    <span>
                                        {isUseOnlyMode
                                            ? '튜토리얼 진행 중 제시 불가'
                                            : !isNpcPresent
                                            ? 'NPC가 없어 제시할 수 없음'
                                            : presentedItem?.itemId === selectedItem?.id
                                                ? `${activeNpcInField?.name || 'NPC'}에게 제시 중`
                                                : `${activeNpcInField?.name || 'NPC'}에게 제시하기`
                                        }
                                    </span>
                                </button>

                                <button
                                    onClick={() => {
                                        if (canReadSelectedItem) {
                                            setIsReading(true);
                                        } else if (canUseSelectedItem) {
                                            if (consumeItem(selectedItem)) {
                                                setSelectedItem(null); // 사용 후 목록으로
                                            }
                                        }
                                    }}
                                    disabled={!canUseAction}
                                    className={`w-full py-3 rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2 transition-all ${canReadSelectedItem
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                                            : canUseSelectedItem
                                                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-teal-900/20'
                                                : 'bg-gray-900 text-white opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    {canReadSelectedItem ? <PlayCircle className="w-5 h-5" /> : null}
                                    <span>
                                        {canReadSelectedItem
                                            ? '기록 보기'
                                            : canUseSelectedItem
                                                ? '사용하기'
                                                : isUseOnlyMode
                                                    ? '튜토리얼 대상 아이템만 사용 가능'
                                                : '사용 불가'}
                                    </span>
                                </button>

                                {selectedItem.type === 'transcript' && !isUseOnlyMode && (
                                    <button
                                        onClick={() => {
                                            if (confirm('정말 삭제하시겠습니까?')) {
                                                removeItem(selectedItem.id);
                                                setSelectedItem(null);
                                            }
                                        }}
                                        className="w-full py-3 bg-white border border-gray-200 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>삭제하기</span>
                                    </button>
                                )}
                            </div>
                        </Motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default InventoryApp;
