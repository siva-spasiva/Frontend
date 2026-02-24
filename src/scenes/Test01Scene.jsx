import React from 'react';
import EndingScene from './EndingScene';

/**
 * Test01Scene - Now dedicated to ENDING SEQUENCE
 * Wraps EndingScene for launch from the test menu / credits flow
 *
 * Props:
 *   - isPhoneOpen: (unused - full screen scene)
 *   - onTogglePhone: (unused)
 *   - onBack: callback when ending completes
 */

const Test01Scene = ({ isPhoneOpen, onTogglePhone, onBack }) => {
    const handleEndingComplete = () => {
        // Return to main menu after ending
        if (onBack) {
            onBack();
        }
    };

    return (
        <EndingScene onComplete={handleEndingComplete} />
    );
};

export default Test01Scene;
