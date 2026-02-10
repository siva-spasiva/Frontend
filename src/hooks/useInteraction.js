import { useState, useCallback } from 'react';

export const useInteraction = ({ viewMode, setViewMode, onMove, inventory = [] } = {}) => {
    const [logs, setLogs] = useState([]);
    const [dialogContent, setDialogContent] = useState(null);
    const [pendingMove, setPendingMove] = useState(null);
    const [pendingItem, setPendingItem] = useState(null); // New state for item pickup

    const handleInteraction = useCallback((zone) => {
        console.log("System Interaction with zone:", zone);

        const timestamp = Date.now();

        setLogs(currentLogs => {
            const newLogs = [...currentLogs];

            if (dialogContent) {
                newLogs.push({
                    ...dialogContent,
                    id: timestamp + '_prev_npc',
                    type: 'npc' // Preserving original behavior: archiving as 'npc' type
                });
            }

            // Add Interaction Log
            newLogs.push({
                id: timestamp + '_interaction',
                speaker: 'System',
                text: `[${zone.label}] 을(를) 조사합니다.`,
                type: 'system_action'
            });

            return newLogs;
        });

        // Show feedback in Dialog Box
        let responseText = zone.message || '특별한 것은 없어 보인다.';

        if (zone.type === 'move') {
            if (onMove && zone.target) {
                setPendingMove({
                    target: zone.target,
                    label: zone.label
                });

                // Prompt user in dialog as well
                responseText = `[${zone.label}] (으)로 이동하시겠습니까?`;
                setDialogContent({
                    speaker: 'System',
                    text: responseText,
                    type: 'system_decision' // Special type if needed, or just system
                });

                // Don't move yet
            } else {
                responseText = `[${zone.label}] (으)로 이동할 수 없습니다.`;
                setDialogContent({
                    speaker: 'System',
                    text: responseText,
                    type: 'system'
                });
            }
        } else if (zone.type === 'item') {
            // Handle Item Pickup
            const itemId = zone.itemId || 'item010';

            // Check if already in inventory
            if (inventory.includes(itemId)) {
                setDialogContent({
                    speaker: 'System',
                    text: '비어있다.',
                    type: 'system'
                });
            } else {
                setPendingItem(itemId);
                setDialogContent({
                    speaker: 'System',
                    text: '무언가 발견했습니다!',
                    type: 'system'
                });
            }

        } else {
            setDialogContent({
                speaker: 'System',
                text: responseText,
                type: 'system'
            });
        }

        // Auto-show dialog if hidden
        if (viewMode === 'hidden' && setViewMode) {
            setViewMode('mini');
        }

    }, [dialogContent, viewMode, setViewMode, onMove]);

    const addLog = useCallback((logItem) => {
        setLogs(prev => [...prev, logItem]);
    }, []);

    const confirmMove = useCallback(() => {
        if (pendingMove && onMove) {
            addLog({
                id: Date.now() + '_move_confirm',
                speaker: 'System',
                text: `[${pendingMove.label}] (으)로 이동합니다.`,
                type: 'system_action'
            });
            onMove(pendingMove.target);
            setPendingMove(null);
            setDialogContent(null);
        }
    }, [pendingMove, onMove, addLog]);

    const cancelMove = useCallback(() => {
        if (pendingMove) {
            addLog({
                id: Date.now() + '_move_cancel',
                speaker: 'System',
                text: `이동을 취소했습니다.`,
                type: 'system_action'
            });
            setPendingMove(null);
            setDialogContent({
                speaker: 'System',
                text: '이동하지 않습니다.',
                type: 'system'
            });
        }
    }, [pendingMove, addLog]);

    const resolveItem = useCallback(() => {
        setPendingItem(null);
    }, []);

    const setDialog = useCallback((content) => {
        setDialogContent(content);
    }, []);

    return {
        logs,
        setLogs,
        addLog,
        dialogContent,
        setDialogContent: setDialog, // Expose wrapped or raw setter
        handleInteraction,
        pendingMove,
        confirmMove,
        cancelMove,
        pendingItem,
        resolveItem
    };
};
