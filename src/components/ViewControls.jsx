import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

/**
 * ViewControls
 * 
 * 채팅창 바로 위에 위치하는 미니멀한 토글 버튼.
 * - 채팅 숨김/표시 전환
 * - 게임메뉴(사이드바) 열기 버튼
 * 
 * 숨기면 버튼도 함께 아래로 내려감.
 */
const ViewControls = ({
    viewMode,
    onToggleHidden,
    isPhoneOpen,
    onTogglePhone,
    theme,
    disabled = false,
    isSidebarVisible = false,
    children
}) => {

    const isHidden = viewMode === 'hidden';

    return (
        <>
            {/* Chat Toggle Button — sits just above the chat area */}
            <AnimatePresence>
                <Motion.div
                    className="absolute z-30 pointer-events-auto flex items-center gap-2"
                    style={{
                        left: isSidebarVisible ? '320px' : '20px',
                    }}
                    animate={{
                        bottom: isHidden ? 12 : 'auto',
                        top: isHidden ? 'auto' : undefined,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    {/* When hidden: show a floating restore button at bottom */}
                    {isHidden ? (
                        <Motion.button
                            key="show-chat"
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            onClick={onToggleHidden}
                            disabled={disabled}
                            className="flex items-center gap-2 px-4 py-2.5 bg-black/70 hover:bg-black/80 backdrop-blur-xl text-white/80 hover:text-white rounded-full border border-white/15 shadow-lg transition-colors group"
                            style={{
                                left: isSidebarVisible ? '320px' : '20px',
                            }}
                        >
                            <ChevronUp className="w-4 h-4 group-hover:animate-bounce" />
                            <span className="text-xs font-medium tracking-wide">대화창 열기</span>
                        </Motion.button>
                    ) : null}
                </Motion.div>
            </AnimatePresence>

            {/* Sidebar open button — only when sidebar is not visible and no app open */}
            {!isSidebarVisible && !isPhoneOpen && (
                <Motion.div 
                    className="absolute top-1/2 left-0 -translate-y-1/2 z-30 pointer-events-auto"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                >
                    <div className="w-3 h-16 bg-white/10 hover:bg-white/25 rounded-r-full transition-colors cursor-pointer border-r border-y border-white/10 hover:border-white/20"
                        title="메뉴"
                    />
                </Motion.div>
            )}

            {/* Extra children buttons — positioned bottom-left */}
            {children && (
                <div className={`absolute bottom-10 z-50 flex flex-col space-y-4 pointer-events-auto transition-all duration-300 ${disabled ? 'opacity-40' : ''}`}
                    style={{ left: isSidebarVisible ? '320px' : '20px' }}
                >
                    {React.Children.map(children, child => (
                        <Motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {child}
                        </Motion.div>
                    ))}
                </div>
            )}
        </>
    );
};

export default ViewControls;
