import React from 'react';
import { FishText } from '../utils/fishTalk';

const ChatBubble = ({
    dialogContent,
    isThinking,
    viewMode,
    onToggleExpand,
    onToggleViewMode,
    theme
}) => {

    if (!dialogContent && !isThinking) return null;

    // Theme Styles
    const activeSpeakerClass = theme === 'corrupted' ? 'text-red-500' : 'text-yellow-500';
    const thinkingTextClass = theme === 'corrupted' ? 'text-red-500/50' : 'text-yellow-500/50';

    const handleExpandClick = () => {
        if (viewMode === 'mini') {
            if (onToggleExpand) onToggleExpand();
            else if (onToggleViewMode) onToggleViewMode();
        }
    };

    return (
        <div
            className="p-6 pb-2 cursor-pointer relative border-b border-white/5"
            onClick={handleExpandClick}
        >
            <div className="flex items-center mb-2">
                <span className={`${activeSpeakerClass} font-bold text-lg mr-3`}>
                    {dialogContent?.speaker || 'Unknown'}
                </span>
                {isThinking && <span className={`text-xs ${thinkingTextClass} animate-pulse`}>Thinking...</span>}
            </div>
            <p className="text-xl text-gray-100 leading-relaxed font-medium min-h-[1.5em]">
                {isThinking ? (
                    <span className="animate-pulse opacity-50">...</span>
                ) : (
                    <FishText text={dialogContent?.text} />
                )}
            </p>

            {/* Hint for interaction */}
            {viewMode === 'mini' && (
                <div className="absolute top-4 right-4 text-xs text-gray-600 opacity-0 hover:opacity-100 transition-opacity">
                    Click to Expand History
                </div>
            )}
        </div>
    );
};

export default ChatBubble;
