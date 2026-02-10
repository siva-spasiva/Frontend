import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import ChatLog from './ChatLog';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import ViewControls from './ViewControls';
import ItemPresentationBanner from './ItemPresentationBanner';

const SmartphoneMenu = ({
    logs = [],
    dialogContent,
    isThinking,
    onSend,
    inputText,
    setInputText,
    viewMode = 'mini',
    onToggleViewMode,
    onToggleHidden,
    onToggleExpand,
    isPhoneOpen,
    onTogglePhone,
    children, // For extra buttons
    theme = 'basic', // 'basic' | 'corrupted'
    // Item Presentation
    presentedItem = null,
    npcName = null,
    onClearPresentation = null,
}) => {

    // Derived border color for container
    const containerBorderClass = theme === 'corrupted' ? 'border-red-900/30' : 'border-white/10';

    return (
        <>
            {/* Main Interaction Container */}
            <AnimatePresence mode="sync">
                {viewMode !== 'hidden' && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            height: viewMode === 'full' ? '80%' : 'auto',
                            left: isPhoneOpen ? '480px' : '120px', // Dynamic left based on phone
                            right: '40px' // Stretch to right
                        }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className={`absolute bottom-6 z-20 flex flex-col justify-end pointer-events-none`}
                    >
                        {/* Log History */}
                        <ChatLog logs={logs} viewMode={viewMode} />

                        {/* Recent Dialog Box + Input Wrapper */}
                        <div className={`pointer-events-auto bg-gray-900/80 backdrop-blur-md rounded-2xl border ${containerBorderClass} shadow-2xl overflow-hidden flex flex-col`}>

                            {/* Item Presentation Banner (above chat) */}
                            <ItemPresentationBanner
                                presentedItem={presentedItem}
                                onClear={onClearPresentation}
                                npcName={npcName}
                            />

                            {/* Sticky Header for Collapse/Expand */}
                            <div
                                className="h-6 bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={onToggleExpand || onToggleViewMode}
                            >
                                {viewMode === 'full' ? (
                                    <Minimize2 className="w-3 h-3 text-gray-400" />
                                ) : (
                                    <Maximize2 className="w-3 h-3 text-gray-400" />
                                )}
                            </div>


                            <ChatBubble
                                dialogContent={dialogContent}
                                isThinking={isThinking}
                                viewMode={viewMode}
                                onToggleExpand={onToggleExpand}
                                onToggleViewMode={onToggleViewMode}
                                theme={theme}
                            />

                            <ChatInput
                                inputText={inputText}
                                setInputText={setInputText}
                                onSend={onSend}
                                isThinking={isThinking}
                                theme={theme}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Buttons */}
            <ViewControls
                viewMode={viewMode}
                onToggleViewMode={onToggleViewMode}
                onToggleHidden={onToggleHidden}
                isPhoneOpen={isPhoneOpen}
                onTogglePhone={onTogglePhone}
                theme={theme}
            >
                {children}
            </ViewControls>
        </>
    );
};

export default SmartphoneMenu;
