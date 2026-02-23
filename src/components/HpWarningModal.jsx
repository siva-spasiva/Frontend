import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';

const PERIOD_LABELS = { morning: '아침', afternoon: '오후', evening: '저녁', night: '심야' };

const HpWarningModal = ({ isOpen, warning, onConfirm, onCancel }) => {
    if (!isOpen || !warning) return null;
    const { preview } = warning;
    const fromLabel = PERIOD_LABELS[preview.fromPeriod] || preview.fromPeriod;
    const toLabel = preview.newHp <= 0
        ? '다음 날 아침'
        : (PERIOD_LABELS[preview.toPeriod] || preview.toPeriod);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-gray-900/95 border border-yellow-500/40 rounded-2xl p-5 max-w-xs w-full mx-4 shadow-2xl"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            <span className="text-sm font-bold text-yellow-300">시간대 전환 경고</span>
                        </div>

                        <div className="flex items-center justify-center gap-2 mb-3 py-2">
                            <span className="text-sm font-bold text-white">{fromLabel}</span>
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-500">→</span>
                            <span className="text-sm font-bold text-red-400">{toLabel}</span>
                        </div>

                        <p className="text-xs text-gray-400 text-center mb-4 leading-relaxed">
                            이 행동을 하면 HP가 구간 경계를 넘어<br />
                            <strong className="text-yellow-300">{toLabel}</strong>으로 전환됩니다.<br />
                            계속하시겠습니까?
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-xs font-bold text-white transition-colors"
                            >
                                계속하기
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default HpWarningModal;
