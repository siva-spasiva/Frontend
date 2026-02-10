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

    const handleMasterToggle = () => {
        // Toggle Phone
        if (onTogglePhone) onTogglePhone();

        // Sync View Mode
        // If Phone is OPENING (currently false), ensure View is Visible (mini)
        // If Phone is CLOSING (currently true), ensure View is Hidden
        if (!isPhoneOpen) {
            // Opening
            if (viewMode === 'hidden' && onToggleHidden) onToggleHidden();
        } else {
            // Closing
            if (viewMode !== 'hidden' && onToggleHidden) onToggleHidden();
        }
    };

    return (
        <div className="absolute bottom-10 left-10 z-50 flex flex-col space-y-4 pointer-events-auto">
            {/* Master Toggle Button */}
            <motion.button
                onClick={handleMasterToggle}
                className={getToggleBtnStyle(isPhoneOpen)}
                animate={{ x: isPhoneOpen ? 400 : 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                {isPhoneOpen ? (
                    <EyeOff className="w-6 h-6" /> // Icon to Hide
                ) : (
                    <MessageSquare className="w-6 h-6" /> // Icon to Show
                )}
            </motion.button>

            {/* Additional Buttons (NPC Toggle etc) */}
            {children && React.Children.map(children, child => (
                <motion.div
                    animate={{ x: isPhoneOpen ? 400 : 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {child}
                </motion.div>
            ))}
        </div>
    );
};

export default ViewControls;
