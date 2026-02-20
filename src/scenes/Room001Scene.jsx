import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useViewMode } from '../hooks/useViewMode';
import GameHUD from '../components/GameHUD';
import MapInteractiveLayer from '../components/MapInteractiveLayer';
import { useInteraction } from '../hooks/useInteraction';
import NavigationConfirmation from '../components/NavigationConfirmation';
import FishEyeEffect from '../components/FishEyeEffect';
import useFishVisuals from '../hooks/useFishVisuals';

const Room001Scene = ({ isPhoneOpen, onTogglePhone }) => {
    const { viewMode, setViewMode, handleToggleHidden, handleToggleExpand } = useViewMode('mini');
    const [inputText, setInputText] = useState('');
    const [currentRoomId, setCurrentRoomId] = useState('room001'); // B2 Room 001

    const { mapData, floorData, setCurrentLocationInfo, inventory: currentInventory } = useGame();
    
    // Fish Visual Effects
    const { fishTier, mapEffects, mapFilter, mapTransform, waveFilterId } = useFishVisuals();

    // Map Info
    const mapInfo = mapData?.[currentRoomId] || {};

    // Interaction Hook
    const {
        logs,
        dialogContent,
        handleInteraction,
        pendingMove,
        confirmMove,
        cancelMove,
        setDialogContent,
        setLogs
    } = useInteraction({
        viewMode,
        setViewMode,
        onMove: (targetId) => {
            setCurrentRoomId(targetId);
            // Sync location to context
            if (floorData) {
                const floor = floorData.find(f => f.rooms.some(r => r.id === targetId));
                if (floor) setCurrentLocationInfo({ floorId: floor.id, roomId: targetId });
            }
        },
        inventory: currentInventory
    });

    // Tutorial Sequence
    useEffect(() => {
        // Trigger Tutorial Dialogue on Mount
        const timer = setTimeout(() => {
            setDialogContent({
                speaker: '곽빙어 (Smelt)',
                text: '어, 일어났어? 꽤 깊게 잠들던데.',
                onNext: () => {
                    setDialogContent({
                        speaker: '곽빙어 (Smelt)',
                        text: '여긴 처음이지? 일단 폰부터 확인해봐. [Map] 앱으로 여기 구조 좀 익히고.',
                        onNext: () => {
                            setDialogContent({
                                speaker: '곽빙어 (Smelt)',
                                text: '뭐 궁금한 거 있으면 나한테 물어보고. 아, 내 물건은 건드리지 마라.',
                                onNext: () => setDialogContent(null)
                            });
                        }
                    });
                }
            });
            // Update logs
            setLogs(prev => [...prev, {
                id: Date.now(),
                speaker: 'System',
                text: '튜토리얼: [Map] 앱을 열어 현재 위치를 확인하세요.',
                type: 'system'
            }]);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full relative bg-gray-900 text-white overflow-hidden"
            style={{
                backgroundImage: mapInfo.background,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: mapFilter !== 'none' ? mapFilter : undefined,
                transform: mapTransform !== 'none' ? mapTransform : undefined
            }}
        >
            <FishEyeEffect fishTier={fishTier} mapEffects={mapEffects} waveFilterId={waveFilterId} />

            <MapInteractiveLayer
                mapInfo={mapInfo}
                onInteract={handleInteraction}
            />

            <GameHUD
                mapInfo={mapInfo}
                activeNpc={null} // activeNpc set to null for now, handled by manual dialog
                logs={logs}
                dialogContent={dialogContent}
                viewMode={viewMode}
                onSend={() => {}}
                inputText={inputText}
                setInputText={setInputText}
                onToggleHidden={handleToggleHidden}
                onToggleExpand={handleToggleExpand}
                isPhoneOpen={isPhoneOpen}
                onTogglePhone={onTogglePhone}
                theme="basic" // or corrupted based on tier
            />
            
            <NavigationConfirmation
                isOpen={!!pendingMove}
                targetLabel={pendingMove?.label}
                onConfirm={confirmMove}
                onCancel={cancelMove}
            />
        </motion.div>
    );
};

export default Room001Scene;
