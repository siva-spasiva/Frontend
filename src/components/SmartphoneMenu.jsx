import React from 'react';
import { Maximize2, Minimize2, ChevronDown } from 'lucide-react';
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
    isSidebarVisible = false,
}) => {

    // Derived border color for container
    const containerBorderClass = theme === 'corrupted' ? 'border-red-900/30' : 'border-white/10';

    // Dynamic left position based on sidebar visibility
    const computedLeft = leftInset || (isSidebarVisible ? '320px' : '20px');

    return (
        <>
            {/* Main Interaction Container */}
            {viewMode !== 'hidden' && (
                <div
                    style={{
                        height: viewMode === 'full' ? '80%' : 'auto',
                        left: computedLeft,
                        right: rightInset
                    }}
                    className="absolute bottom-6 z-20 flex flex-col justify-end pointer-events-none transition-all duration-300 ease-out"
                >
                    {/* Log History */}
                    <ChatLog logs={logs} viewMode={viewMode} />

                    {/* Hide Chat Button — right above chat container */}
                    <div className="pointer-events-auto flex items-center gap-2 mb-1">
                        <button
                            onClick={onToggleHidden}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white/50 hover:text-white/80 rounded-full border border-white/10 hover:border-white/20 transition-all text-[10px] font-medium tracking-wide group"
                        >
                            <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                            숨기기
                        </button>
                    </div>

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

            {/* View Controls (restore button when hidden + extra children) */}
            {showControls && (
                <ViewControls
                    viewMode={viewMode}
                    onToggleViewMode={onToggleViewMode}
                    onToggleHidden={onToggleHidden}
                    isPhoneOpen={isPhoneOpen}
                    onTogglePhone={onTogglePhone}
                    theme={theme}
                    isSidebarVisible={isSidebarVisible}
                >
                    {children}
                </ViewControls>
            )}
        </>
    );
};

export default SmartphoneMenu;
