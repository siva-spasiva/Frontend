import { useState } from 'react';

export const useViewMode = (initialMode = 'mini') => {
    const [viewMode, setViewMode] = useState(initialMode);

    const handleToggleHidden = () => {
        if (viewMode === 'hidden') setViewMode('mini');
        else setViewMode('hidden');
    };

    const handleToggleExpand = () => {
        if (viewMode === 'full') setViewMode('mini');
        else setViewMode('full');
    };

    return {
        viewMode,
        setViewMode,
        handleToggleHidden,
        handleToggleExpand
    };
};
