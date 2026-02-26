import { useCallback, useState } from 'react';

export const useInteraction = ({
    viewMode,
    setViewMode,
    onMove,
    inventory = [],
    stats = {},
    spendHp,
    rest,
    ACTION_COSTS,
    getHpCostPreview,
    itemInteractionMode = 'chat',
} = {}) => {
    const [logs, setLogs] = useState([]);
    const [dialogContent, setDialogContent] = useState(null);
    const [pendingMove, setPendingMove] = useState(null);
    const [pendingItem, setPendingItem] = useState(null);
    const [pendingHpWarning, setPendingHpWarning] = useState(null); // { zone, cost, preview }
    const [pendingRequirement, setPendingRequirement] = useState(null);
    const [pendingInfoPopup, setPendingInfoPopup] = useState(null);

    const executeInteraction = useCallback(async (zone, cost) => {
        // For move zones, defer HP spending to confirmMove
        if (zone.type !== 'move' && cost > 0 && spendHp) {
            const result = await spendHp(cost);
            if (!result) {
                setDialogContent({ speaker: 'System', text: '체력이 부족하다...', type: 'system' });
                return;
            }
        }

        const timestamp = Date.now();
        const isPopupItemMode = itemInteractionMode === 'popup' && zone.type === 'item';

        setLogs((currentLogs) => {
            const newLogs = [...currentLogs];

            if (dialogContent) {
                newLogs.push({
                    ...dialogContent,
                    id: `${timestamp}_prev_npc`,
                    type: 'npc',
                });
            }

            if (!isPopupItemMode) {
                newLogs.push({
                    id: `${timestamp}_interaction`,
                    speaker: 'System',
                    text: `[${zone.label}] 을(를) 조사합니다.`,
                    type: 'system_action',
                });
            }

            return newLogs;
        });

        let responseText = zone.message || '특별한 것은 없어 보인다.';

        if (zone.type === 'move') {
            if (onMove && zone.target) {
                setPendingMove({
                    target: zone.target,
                    label: zone.label,
                    zone,
                    cost, // Deferred HP cost — spent in confirmMove
                });

                responseText = `[${zone.label}] (으)로 이동하시겠습니까?`;
                setDialogContent({
                    speaker: 'System',
                    text: responseText,
                    type: 'system_decision',
                });
            } else {
                responseText = `[${zone.label}] (으)로 이동할 수 없습니다.`;
                setDialogContent({
                    speaker: 'System',
                    text: responseText,
                    type: 'system',
                });
            }
        } else if (zone.type === 'item') {
            const itemId = zone.itemId || 'item010';

            if (inventory.includes(itemId)) {
                if (!isPopupItemMode) {
                    setDialogContent({
                        speaker: 'System',
                        text: '비어있다.',
                        type: 'system',
                    });
                }
            } else {
                setPendingItem(itemId);
                if (!isPopupItemMode) {
                    setDialogContent({
                        speaker: 'System',
                        text: '무언가 발견했습니다!',
                        type: 'system',
                    });
                }
            }
        } else if (zone.type === 'info') {
            setPendingInfoPopup([responseText]);
        } else {
            setDialogContent({
                speaker: 'System',
                text: responseText,
                type: 'system',
            });
        }

        if (!isPopupItemMode && viewMode === 'hidden' && setViewMode) {
            setViewMode('mini');
        }
    }, [dialogContent, inventory, itemInteractionMode, onMove, setViewMode, spendHp, viewMode]);

    const handleInteraction = useCallback(async (zone) => {
        console.log('System Interaction with zone:', zone);

        if (zone.locked) {
            const req = zone.locked;

            if (req.type === 'item') {
                if (!inventory.includes(req.targetId)) {
                    setPendingRequirement({
                        type: 'item',
                        targetId: req.targetId,
                        message: req.message || '굳게 잠겨있다. 무언가 필요한 것 같다.',
                    });
                    setDialogContent({
                        speaker: 'System',
                        text: req.message || '굳게 닫혀있다...',
                        type: 'system',
                    });
                    return;
                }
            } else if (req.type === 'stat') {
                const statValue = stats[req.targetId] || 0;
                if (statValue < req.targetValue) {
                    setPendingRequirement({
                        type: 'stat',
                        targetId: req.targetId,
                        targetValue: req.targetValue,
                        message: req.message || '굳게 잠겨있다. 현재 상태로는 접근할 수 없다.',
                    });
                    setDialogContent({
                        speaker: 'System',
                        text: req.message || '다가갈 수 없다...',
                        type: 'system',
                    });
                    return;
                }
            }
        }

        if (zone.type === 'rest') {
            if (rest) {
                rest();
                setDialogContent({
                    speaker: 'System',
                    text: zone.message || '잠시 쉬어간다...',
                    type: 'system',
                });
            }
            return;
        }

        let costKey = 'interact';
        if (zone.type === 'move') costKey = 'move';
        else if (zone.type === 'item') costKey = 'item';
        else if (zone.type === 'eavesdrop') costKey = 'eavesdrop';

        const cost = ACTION_COSTS?.[costKey] ?? 0;

        // Move zones: skip HP check here — HP is spent in confirmMove
        if (zone.type !== 'move' && cost > 0 && getHpCostPreview) {
            const preview = getHpCostPreview(cost);

            if (!preview) {
                setDialogContent({ speaker: 'System', text: '체력이 부족하다...', type: 'system' });
                return;
            }

            if (preview.willTransition) {
                setPendingHpWarning({ zone, cost, preview });
                return;
            }
        }

        await executeInteraction(zone, cost);
    }, [ACTION_COSTS, executeInteraction, getHpCostPreview, inventory, rest, stats]);

    const addLog = useCallback((logItem) => {
        setLogs((prev) => [...prev, logItem]);
    }, []);

    const confirmHpWarning = useCallback(async () => {
        if (!pendingHpWarning) return;
        const { zone, cost } = pendingHpWarning;
        setPendingHpWarning(null);
        await executeInteraction(zone, cost);
    }, [executeInteraction, pendingHpWarning]);

    const cancelHpWarning = useCallback(() => {
        setPendingHpWarning(null);
        setDialogContent({ speaker: 'System', text: '행동을 취소했습니다.', type: 'system' });
    }, []);

    const confirmMove = useCallback(async () => {
        if (pendingMove && onMove) {
            // Spend deferred HP cost (was not spent in executeInteraction for moves)
            const moveCost = pendingMove.cost || 0;
            if (moveCost > 0 && spendHp) {
                const hpResult = await spendHp(moveCost);
                if (!hpResult) {
                    setDialogContent({ speaker: 'System', text: '체력이 부족하다...', type: 'system' });
                    setPendingMove(null);
                    return;
                }
                // If section transition was triggered, let the overlay handle movement
                if (hpResult.transitioned) {
                    setPendingMove(null);
                    setDialogContent(null);
                    return;
                }
            }

            addLog({
                id: `${Date.now()}_move_confirm`,
                speaker: 'System',
                text: `[${pendingMove.label}] (으)로 이동합니다.`,
                type: 'system_action',
            });
            const result = await onMove(pendingMove.target, pendingMove.zone);

            if (result === false) {
                setPendingMove(null);
                return;
            }
            setPendingMove(null);
            setDialogContent(null);
        }
    }, [addLog, onMove, pendingMove, spendHp]);

    const cancelMove = useCallback(() => {
        if (pendingMove) {
            addLog({
                id: `${Date.now()}_move_cancel`,
                speaker: 'System',
                text: '이동을 취소했습니다.',
                type: 'system_action',
            });
            setPendingMove(null);
            setDialogContent({
                speaker: 'System',
                text: '이동하지 않습니다.',
                type: 'system',
            });
        }
    }, [addLog, pendingMove]);

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
        setDialogContent: setDialog,
        handleInteraction,
        pendingMove,
        confirmMove,
        cancelMove,
        pendingItem,
        resolveItem,
        pendingRequirement,
        setPendingRequirement,
        resolveRequirement,
        pendingInfoPopup,
        resolveInfoPopup,
        pendingHpWarning,
        confirmHpWarning,
        cancelHpWarning,
    };
};
