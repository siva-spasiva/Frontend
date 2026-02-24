import React from 'react';
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
    showControls = true,
    leftInset = null,
    rightInset = '40px',
}) => {

    // Derived border color for container
    const containerBorderClass = theme === 'corrupted' ? 'border-red-900/30' : 'border-white/10';

    return (
        <>
            {/* Main Interaction Container */}
            {viewMode !== 'hidden' && (
                <div
                    style={{
                        height: viewMode === 'full' ? '80%' : 'auto',
                        left: leftInset || (isPhoneOpen ? '480px' : '120px'),
                        right: rightInset
                    }}
                    className="absolute bottom-6 z-20 flex flex-col justify-end pointer-events-none transition-all duration-300 ease-out"
                >
                    {/* Log History */}
                    <ChatLog logs={logs} viewMode={viewMode} />

                    {/* Recent Dialog Box + Input Wrapper */}
                    <div className={`pointer-events-auto bg-black/90 backdrop-blur-sm rounded-t-3xl border-t border-white/20 shadow-2xl overflow-hidden flex flex-col ${containerBorderClass}`}>

                        {/* Item Presentation Banner (above chat) */}
                        <ItemPresentationBanner
                            presentedItem={presentedItem}
                            onClear={onClearPresentation}
                            npcName={npcName}
                        />

                        {/* Sticky Header for Collapse/Expand */}
                        <div
                            className="h-7 bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                            onClick={onToggleExpand || onToggleViewMode}
                        >
                            <span className="text-[11px] text-white/50 font-semibold tracking-wide flex items-center gap-1.5">
                                {viewMode === 'full' ? (
                                    <>
                                        <Minimize2 className="w-3 h-3" />
                                        Collapse
                                    </>
                                ) : (
                                    <>
                                        <Maximize2 className="w-3 h-3" />
                                        Expand
                                    </>
                                )}
                            </span>
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
                </div>
            )}

            {/* Floating Buttons */}
            {showControls && (
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
            )}
        </>
    );
};

export default SmartphoneMenu;
