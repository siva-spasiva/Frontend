import React from 'react';
import SmartphoneMenu from './SmartphoneMenu';
import PortraitDisplay from './PortraitDisplay';
import { UserPlus, UserMinus, MapPin } from 'lucide-react';

const GameHUD = ({
    // Map & Visuals
    mapInfo = {},
    activeNpc,

    // Chat State
    logs,
    dialogContent,
    isThinking,
    onSend,
    inputText,
    setInputText,

    // View Control
    viewMode,
    onToggleHidden,
    onToggleExpand,

    // Global Phone State
    isPhoneOpen = false,
    onTogglePhone,

    // Theme & Options
    theme = 'basic',
    onToggleNpc, // Optional: for the debug button
    showViewControls = true,

    // Item Presentation
    presentedItem = null,
    onClearPresentation = null,

    children
}) => {
    return (
        <>
            {/* Dark Overlay for Readability (Optional, scene might do this) */}
            {/* We assume the Scene handles the background image and main container. 
                GameHUD handles the UI layers on top. */}

            {/* Map Overlay if provided in mapInfo? 
                Usually scene renders this to cover bg. 
                But let's include it if mapInfo has it, consistent with previous scenes. 
            */}
            {mapInfo.overlayColor && (
                <div className={`absolute inset-0 ${mapInfo.overlayColor} pointer-events-none`} />
            )}

            {/* Location Info */}
            <div
                className="absolute top-8 z-10 pointer-events-none transition-all duration-300 ease-out"
                style={{
                    left: isPhoneOpen ? '450px' : '40px',
                    transform: viewMode === 'hidden' ? 'translateY(-200px)' : 'translateY(0)',
                    opacity: viewMode === 'hidden' ? 0 : 1,
                }}
            >
                <div className="flex items-center space-x-2 text-white/90 mb-1 drop-shadow-md">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-mono tracking-widest uppercase shadow-black">Current Location</span>
                </div>
                {/* Updated Map Name */}
                <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tighter drop-shadow-lg shadow-black">
                    {mapInfo.namePrefix} <span className={mapInfo.highlightColor}>{mapInfo.highlightText}</span>
                </h1>
                <p className={`text-sm text-gray-300 max-w-md leading-relaxed border-l-2 ${mapInfo.highlightColor?.replace('text', 'border') || 'border-gray-500'} pl-4 bg-black/30 p-2 rounded-r backdrop-blur-sm`}>
                    {mapInfo.description}
                </p>
            </div>

            {/* Portrait Placeholder */}
            <PortraitDisplay activeNpc={activeNpc} isPhoneOpen={isPhoneOpen} viewMode={viewMode} />

            {/* Smartphone Menu */}
            <SmartphoneMenu
                logs={logs}
                dialogContent={dialogContent}
                isThinking={isThinking}
                onSend={onSend}
                inputText={inputText}
                setInputText={setInputText}
                viewMode={viewMode}
                onToggleHidden={onToggleHidden}
                onToggleExpand={onToggleExpand}
                isPhoneOpen={isPhoneOpen}
                onTogglePhone={onTogglePhone}
                theme={theme}
                presentedItem={presentedItem}
                npcName={activeNpc?.name || null}
                onClearPresentation={onClearPresentation}
                showControls={showViewControls}
            >
                {/* Debug / Extra Buttons */}
                {children}

                {/* Standard NPC Toggle - if handler provided */}
                {onToggleNpc && (
                    <button
                        onClick={onToggleNpc}
                        className={`w-12 h-12 flex items-center justify-center bg-blue-500/30 hover:bg-blue-500/50 text-white rounded-full backdrop-blur-md border border-white/20 shadow-lg`}
                    >
                        {activeNpc ? <UserMinus className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    </button>
                )}
            </SmartphoneMenu>
        </>
    );
};

export default GameHUD;
