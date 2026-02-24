import { useState, useCallback } from 'react';

export const useInteraction = ({ viewMode, setViewMode, onMove, inventory = [], stats = {}, spendHp, rest, ACTION_COSTS, getHpCostPreview, PERIOD_LABELS } = {}) => {
    const [logs, setLogs] = useState([]);
    const [dialogContent, setDialogContent] = useState(null);
    const [pendingMove, setPendingMove] = useState(null);
    const [pendingItem, setPendingItem] = useState(null); // New state for item pickup
    const [pendingHpWarning, setPendingHpWarning] = useState(null); // { zone, cost, preview }
    const [pendingRequirement, setPendingRequirement] = useState(null); // New state for locked requirements
    const [pendingInfoPopup, setPendingInfoPopup] = useState(null); // New state for info popup

    const handleInteraction = useCallback((zone) => {
        console.log("System Interaction with zone:", zone);

        // === Check Locked Requirement ===
        if (zone.locked) {
            const req = zone.locked;
            if (req.type === 'item') {
                if (!inventory.includes(req.targetId)) {
                    setPendingRequirement({
                        type: 'item',
                        targetId: req.targetId,
                        message: req.message || '굳게 잠겨있다. 무언가 필요한 것 같다.'
                    });
                    setDialogContent({ speaker: 'System', text: req.message || '굳게 닫혀있다...', type: 'system' });
                    return;
                }
            } else if (req.type === 'stat') {
                const statValue = stats[req.targetId] || 0;
                if (statValue < req.targetValue) {
                    setPendingRequirement({
                        type: 'stat',
                        targetId: req.targetId,
                        targetValue: req.targetValue,
                        message: req.message || '굳게 잠겨있다. 현재 상태로는 접근할 수 없다.'
                    });
                    setDialogContent({ speaker: 'System', text: req.message || '다다갈 수 없다...', type: 'system' });
                    return;
                }
            }
        }

        // === Rest zone: skip to next section ===
        if (zone.type === 'rest') {
            if (rest) {
                rest();
                setDialogContent({
                    speaker: 'System',
                    text: zone.message || '잠시 쉬어간다...',
                    type: 'system'
                });
            }
            return;
        }

        // === HP cost check for interact / move / item / eavesdrop ===
        let costKey = 'interact';
        if (zone.type === 'move') costKey = 'move';
        else if (zone.type === 'item') costKey = 'item';
        else if (zone.type === 'eavesdrop') costKey = 'eavesdrop';

        const cost = ACTION_COSTS?.[costKey] ?? 0;

        // Check if this cost would cross a section boundary
        if (cost > 0 && getHpCostPreview) {
            const preview = getHpCostPreview(cost);
            if (!preview) {
                // Can't afford
                setDialogContent({ speaker: 'System', text: '체력이 부족하다...', type: 'system' });
                return;
            }
            if (preview.willTransition) {
                // Show warning before proceeding
                setPendingHpWarning({ zone, cost, preview });
                return;
            }
        }

        // No boundary cross — proceed normally
        executeInteraction(zone, cost);
    }, [dialogContent, viewMode, setViewMode, onMove, inventory, stats, spendHp, rest, ACTION_COSTS, getHpCostPreview]);

    // Execute the actual interaction (after warning confirmation or if no warning needed)
    const executeInteraction = useCallback((zone, cost) => {
        if (cost > 0 && spendHp) {
            const ok = spendHp(cost);
            if (!ok) {
                setDialogContent({ speaker: 'System', text: '체력이 부족하다...', type: 'system' });
                return;
            }
        }

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

        } else if (zone.type === 'info') {
            setPendingInfoPopup([responseText]);
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

    }, [dialogContent, viewMode, setViewMode, onMove, spendHp, rest, ACTION_COSTS, getHpCostPreview]);

    const addLog = useCallback((logItem) => {
        setLogs(prev => [...prev, logItem]);
    }, []);

    // HP warning confirmation — proceed with the original interaction
    const confirmHpWarning = useCallback(() => {
        if (!pendingHpWarning) return;
        const { zone, cost } = pendingHpWarning;
        setPendingHpWarning(null);
        executeInteraction(zone, cost);
    }, [pendingHpWarning, executeInteraction]);

    const cancelHpWarning = useCallback(() => {
        setPendingHpWarning(null);
        setDialogContent({ speaker: 'System', text: '행동을 취소했습니다.', type: 'system' });
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

    const resolveRequirement = useCallback(() => {
        setPendingRequirement(null);
    }, []);

    const resolveInfoPopup = useCallback(() => {
        setPendingInfoPopup(null);
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
        resolveItem,
        pendingRequirement,
        resolveRequirement,
        pendingInfoPopup,
        resolveInfoPopup,
        pendingHpWarning,
        confirmHpWarning,
        cancelHpWarning,
    };
};
