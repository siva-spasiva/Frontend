import React from 'react';
import { MessageSquare } from 'lucide-react';

const ChatInput = ({ inputText, setInputText, onSend, isThinking, theme }) => {

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onSend();
        }
    };

    // Theme Styles
    const inputFocusClass = theme === 'corrupted' ? 'focus-within:ring-red-500/50' : 'focus-within:ring-yellow-500/50';
    const sendButtonClass = theme === 'corrupted'
        ? 'bg-red-900 text-white hover:bg-red-800 border border-red-700'
        : 'bg-yellow-600 text-white hover:bg-yellow-500';

    return (
        <div className="p-4 pt-2">
            <div className={`bg-black/30 border border-gray-700/50 rounded-xl flex items-center p-1 ${inputFocusClass} transition-all`}>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="대화 입력..."
                    className="flex-1 bg-transparent border-none text-white focus:ring-0 placeholder-gray-500 h-10 px-4"
                    disabled={isThinking}
                    autoFocus
                />
                <button
                    onClick={onSend}
                    disabled={isThinking || !inputText.trim()}
                    className={`mr-1 p-2 rounded-lg transition-colors ${isThinking || !inputText.trim()
                        ? 'text-gray-600 bg-gray-800'
                        : `${sendButtonClass} shadow-lg`
                        }`}
                >
                    {isThinking ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <MessageSquare className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
