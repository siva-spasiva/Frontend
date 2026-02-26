import React from 'react';
import { FishText } from '../utils/fishTalk';
import { EAVESDROP_MAX_COLOR_COUNT, getEavesdropColorIndexFromText, getEavesdropColorStyle } from '../utils/eavesdropColors';

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
    const speakerBadgeClass = theme === 'corrupted'
        ? 'bg-red-900 text-red-100 border border-red-700/60'
        : 'bg-blue-600 text-white';
    const thinkingTextClass = theme === 'corrupted' ? 'text-red-200/70' : 'text-blue-200/80';
    const eavesdropColorIndex = Number.isFinite(dialogContent?.eavesdropParticipantIndex)
        ? dialogContent.eavesdropParticipantIndex
        : getEavesdropColorIndexFromText(dialogContent?.speaker || '', EAVESDROP_MAX_COLOR_COUNT);
    const eavesdropStyle = getEavesdropColorStyle(eavesdropColorIndex);
    const isEavesdropSpeaker = Number.isFinite(dialogContent?.eavesdropParticipantIndex);
    const dialogBorderClass = isEavesdropSpeaker ? eavesdropStyle.dividerClass : 'border-white/10';
    const resolvedBadgeClass = isEavesdropSpeaker ? eavesdropStyle.badgeClass : speakerBadgeClass;

    const handleExpandClick = () => {
        if (viewMode === 'mini') {
            if (onToggleExpand) onToggleExpand();
            else if (onToggleViewMode) onToggleViewMode();
        }
    };

    return (
        <div
            className={`px-8 pt-7 pb-5 cursor-pointer relative border-b ${dialogBorderClass}`}
            onClick={handleExpandClick}
        >
            <div className={`absolute top-0 right-8 transform -translate-y-1/2 font-bold px-4 py-1 rounded-full text-sm shadow-lg ${resolvedBadgeClass}`}>
                {dialogContent?.speaker || 'Unknown'}
            </div>

            {isThinking && (
                <div className={`text-xs ${thinkingTextClass} animate-pulse mb-2 font-semibold`}>
                    Thinking...
                </div>
            )}

            <p className="text-lg leading-relaxed whitespace-pre-line text-white/90 min-h-[3rem]">
                {isThinking ? (
                    <span className="animate-pulse opacity-50">...</span>
                ) : (
                    <FishText text={dialogContent?.text} />
                )}
            </p>

            {/* Hint for interaction */}
            {viewMode === 'mini' && (
                <div className="absolute bottom-3 right-6 text-[11px] text-white/40 opacity-0 hover:opacity-100 transition-opacity">
                    Click to expand history
                </div>
            )}
        </div>
    );
};

export default ChatBubble;
