import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, EyeOff, MessageSquare } from 'lucide-react';

const ViewControls = ({
    viewMode,
    onToggleViewMode,
    onToggleHidden,
    isPhoneOpen,
    onTogglePhone,
    theme,
    children // Extra buttons
}) => {

    // Theme logic for buttons (Simplified from SmartphoneMenu)
    const getThemeClasses = (isActive) => {
        if (theme === 'corrupted') {
            return isActive
                ? 'bg-red-900/80 border-red-700'
                : 'bg-gray-900/50 hover:bg-red-900/30 text-red-100 border-red-900/50';
        }
        // Basic theme
        return isActive
            ? 'bg-yellow-500/80 border-yellow-400'
            : 'bg-white/10 hover:bg-white/20 text-white border-white/20';
    };

    const getToggleBtnStyle = (isActive) => {
        return `w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-md border shadow-lg transition-colors ${getThemeClasses(isActive)}`;
    };

    return (
        <div className="absolute bottom-10 left-10 z-50 flex flex-col space-y-4 pointer-events-auto">
            {onTogglePhone && (
                <motion.button
                    onClick={onTogglePhone}
                    className={getToggleBtnStyle(false)}
                    animate={{ x: isPhoneOpen ? 400 : 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isPhoneOpen ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    )}
                </motion.button>
            )}

            {/* Additional Buttons (NPC Toggle etc) - Moved Up */}
            {children && React.Children.map(children, child => (
                <motion.div
                    animate={{ x: isPhoneOpen ? 400 : 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {child}
                </motion.div>
            ))}

            {/* View/Hide Toggle - Moved Down */}
            <motion.button
                onClick={onToggleHidden || onToggleViewMode}
                className={getToggleBtnStyle(viewMode === 'full')}
                animate={{ x: isPhoneOpen ? 400 : 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                {viewMode === 'full' ? (
                    <Minimize2 className="w-6 h-6" />
                ) : viewMode === 'mini' ? (
                    <EyeOff className="w-6 h-6" />
                ) : (
                    <MessageSquare className="w-6 h-6" />
                )}
            </motion.button>
        </div>
    );
};

export default ViewControls;
