import React from 'react';
import { MessageSquare } from 'lucide-react';

const ChatInput = ({ inputText, setInputText, onSend, isThinking, theme }) => {
    const safeInputText = typeof inputText === 'string' ? inputText : '';
    const canEditInput = typeof setInputText === 'function';
    const canSendMessage = typeof onSend === 'function';
    const hasText = safeInputText.trim().length > 0;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && canSendMessage && hasText && !isThinking) {
            onSend();
        }
    };

    const inputFocusClass = theme === 'corrupted' ? 'focus-within:ring-red-500/40' : 'focus-within:ring-blue-400/40';
    const sendButtonClass = theme === 'corrupted'
        ? 'bg-red-900 text-white hover:bg-red-800 border border-red-700'
        : 'bg-blue-600 text-white hover:bg-blue-500';

    return (
        <div className="px-6 pt-3 pb-5 border-t border-white/10 bg-black/20">
            <div className={`bg-black/35 border border-white/15 rounded-xl flex items-center p-1.5 ${inputFocusClass} transition-all ring-0`}>
                <input
                    type="text"
                    value={safeInputText}
                    onChange={(e) => {
                        if (canEditInput) setInputText(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type dialogue..."
                    className="flex-1 bg-transparent border-none text-white/95 focus:ring-0 placeholder-white/35 h-11 px-4 text-base"
                    disabled={isThinking || !canEditInput}
                    autoFocus
                />
                <button
                    onClick={() => {
                        if (canSendMessage && hasText && !isThinking) onSend();
                    }}
                    disabled={isThinking || !hasText || !canSendMessage}
                    className={`mr-1 px-3 py-2 rounded-lg transition-colors font-semibold text-sm ${isThinking || !hasText || !canSendMessage
                        ? 'text-gray-500 bg-gray-800/80'
                        : `${sendButtonClass} shadow-lg`
                        }`}
                >
                    {isThinking ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <MessageSquare className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
