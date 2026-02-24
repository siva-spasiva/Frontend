import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import IntroSequence from './IntroSequence';
import GameStartSequence from './GameStartSequence';
import ItemPickupModal from '../components/ItemPickupModal';
import MessengerApp from '../components/apps/MessengerApp';
import MapInteractiveLayer from '../components/MapInteractiveLayer';
import InteractionPopup from '../components/InteractionPopup';
import PortraitDisplay from '../components/PortraitDisplay';

const TutorialScene = ({ onComplete }) => {
    // 튜토리얼 진행 상태: 'intro' -> 'outside' -> 'meet_bingeo_outside' -> 'explore_outside' -> 
    // 'meet_bingeo_inside' -> 'contract_wait' -> 'contract' -> 'hp_tutorial' -> 'explore_inside' -> 
    // 'obtain_item005' -> 'return_to_class' -> 'npc_chat_tutorial' -> 'chat_bingeo_present' -> 
    // 'present_tutorial' -> 'use_item_tutorial' -> 'fish_level_up' -> 'fadeout'

    const [step, setStep] = useState('intro');
    const {
        addItem, ITEMS, setDay, setPeriod, setCurrentLocationInfo, currentLocationInfo,
        completeTutorial, mapData, npcData,
        spendHp
    } = useGame();

    const currentRoomId = currentLocationInfo?.roomId || 'outside01';
    const mapInfo = mapData?.[currentRoomId] || {};

    // UI State
    const [showMessenger, setShowMessenger] = useState(false);
    const [messengerDisconnected, setMessengerDisconnected] = useState(false);

    // Guide State
    const [guideOpen, setGuideOpen] = useState(false);
    const [guideMessages, setGuideMessages] = useState([]);
    const [guideCallback, setGuideCallback] = useState(null);

    // Map Interaction State for 'explore_outside'
    const [interactedZones, setInteractedZones] = useState([]);

    // NPC Dialog State
    const [showNpcDialog, setShowNpcDialog] = useState(false);
    const [npcDialogStep, setNpcDialogStep] = useState(0);
    const [currentScript, setCurrentScript] = useState([]);

    // Item Modals
    const [pendingItem, setPendingItem] = useState(null);

    // Present specific state
    const [showInventoryForPresent, setShowInventoryForPresent] = useState(false);

    // Initial map data fetch is no longer needed via fetchMapData


    // Utility: Show Guide
    const showGuide = (messages, onCompleteCallback) => {
        setGuideMessages(messages);
        setGuideCallback(() => onCompleteCallback);
        setGuideOpen(true);
    };

    const handleGuideComplete = () => {
        setGuideOpen(false);
        if (guideCallback) guideCallback();
    };

    // 1. 인트로 완료 후 외부 도착
    const handleIntroComplete = () => {
        setStep('outside');
        setCurrentLocationInfo({ floorId: '1F', roomId: 'outside01' });

        setTimeout(() => {
            showGuide([
                "시스템: (안내) 섬에 도착했습니다.",
                "리조트 건물로 이동 전, 동료와 통신을 확인하세요. 좌측의 메신저를 확인해 주세요."
            ], () => {
                setShowMessenger(true);
            });
        }, 1500);
    };

    // 2. 메신저 종료 감지 -> 곽빙어 만남
    useEffect(() => {
        if (step === 'outside' && messengerDisconnected) {
            const timer = setTimeout(() => {
                setShowMessenger(false);
                setStep('meet_bingeo_outside');
                setCurrentScript([
                    { speaker: '?', text: '어휴, 배 끊겼다더니 또 누가 왔네.', portrait: true },
                    { speaker: '나', text: '누구시죠? 여기 직원인가요?', portrait: false },
                    { speaker: '곽빙어', text: '직원? 난 \'평범한 그림 원데이 클래스 우미\'의 직원이지. 곽빙어라고 해.', portrait: true },
                    { speaker: '곽빙어', text: '밖에 서 있지 말고 일단 안으로 들어와. 안으로 먼저 들어갈 테니까 따라와.', portrait: true }
                ]);
                setShowNpcDialog(true);
                setNpcDialogStep(0);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [step, messengerDisconnected]);

    // NPC 대화 넘기기 핸들러
    const handleNpcNext = () => {
        if (npcDialogStep < currentScript.length - 1) {
            setNpcDialogStep(prev => prev + 1);
        } else {
            setShowNpcDialog(false);

            // 대화 스텝 종료 후 다음 단계 로직
            if (step === 'meet_bingeo_outside') {
                setStep('explore_outside');
                showGuide([
                    "맵을 잘 찾아보면 클릭이 가능한 지점이 있습니다.",
                    "문으로 들어가기 전 모든 포인트를 클릭해보세요!"
                ]);
            } else if (step === 'meet_bingeo_inside') {
                setStep('contract_wait');
                showGuide([
                    "건물 내부로 들어왔습니다. 입소를 위해 계약서를 작성해야 합니다."
                ], () => {
                    setStep('contract');
                });
            } else if (step === 'hp_tutorial_chat') {
                setStep('explore_inside');
                showGuide([
                    "튜토리얼 기간 동안 자유롭게 탐사해보세요!",
                    "HP는 튜토리얼 기간동안만큼은 소모되지 않으니 안심하세요!"
                ]);
            } else if (step === 'chat_bingeo_present') {
                setStep('present_tutorial');
                showGuide([
                    "아이템 '제시(Present)' 기능을 사용해봅시다.",
                    "화면의 '아이템 제시' 버튼을 눌러보세요."
                ], () => {
                    setShowInventoryForPresent(true);
                });
            } else if (step === 'wrong_present') {
                setStep('chat_bingeo_present');
                setShowInventoryForPresent(true);
            } else if (step === 'correct_present') {
                setStep('use_item_tutorial');
                showGuide([
                    "'솔피의 눈물' 아이템을 인벤토리에서 '사용(Use)' 할 수 있습니다.",
                    "인벤토리를 열고 웰컴 드링크를 마셔봅시다."
                ], () => {
                    // Wait for manual item use
                });
            }
        }
    };

    // 맵 상호작용 핸들러
    const handleMapInteract = (zone) => {
        if (guideOpen || showNpcDialog || showMessenger || step === 'contract') return;

        // --- 외부 탐구 강제 ---
        if (step === 'explore_outside') {
            if (zone.type === 'move' && zone.target === 'main_hall') {
                // Check if all info zones are clicked
                const infoZones = mapInfo?.activeZones?.filter(z => z.type === 'info') || [];
                const allClicked = infoZones.every(z => interactedZones.includes(z.id));

                if (!allClicked) {
                    showGuide([
                        "굳게 닫혀있다. 아직 주변을 덜 둘러본 것 같다.",
                        "주변의 돋보기 아이콘을 모두 눌러 확인해주세요."
                    ]);
                    return;
                }

                // Allow entering (move)
                handleMoveInternal(zone.target);
                return;
            } else if (zone.type === 'info') {
                if (!interactedZones.includes(zone.id)) {
                    setInteractedZones(prev => [...prev, zone.id]);
                }
                showGuide([zone.message]);
                return;
            }
        }

        // --- 내부 탐구 ---
        if (step === 'explore_inside') {
            if (zone.type === 'move') {
                handleMoveInternal(zone.target);
                return;
            } else if (zone.type === 'info') {
                showGuide([zone.message]);
                return;
            } else if (zone.type === 'item') {
                if (zone.itemId) {
                    setPendingItem(zone);
                }
            }
        }

        // --- 테라스 도착 및 아이템 획득 ---
        if (step === 'obtain_item005') {
            if (zone.type === 'item' && zone.itemId === 'item005') {
                setPendingItem(zone);
            } else {
                showGuide([zone.message || "이동할 수 없습니다."]);
            }
        }

        // --- 복귀 후 npc 대화 ---
        if (step === 'return_to_class' || step === 'npc_chat_tutorial') {
            if (zone.type === 'move') {
                handleMoveInternal(zone.target);
            }
        }

    };

    const handleMoveInternal = (targetRoomId) => {
        // Determine floor
        let targetFloorId = '1F';
        if (targetRoomId === 'storage_main' || targetRoomId === 'terrace') {
            targetFloorId = '2F';
        }

        setCurrentLocationInfo({ floorId: targetFloorId, roomId: targetRoomId });


        // Move hooks
        if (step === 'explore_outside' && targetRoomId === 'main_hall') {
            setStep('meet_bingeo_inside');
            setTimeout(() => {
                setCurrentScript([
                    { speaker: '곽빙어', text: '여기서부터는 진짜 우미의 공간이야. 일단 이거부터 서명해.', portrait: true },
                    { speaker: '곽빙어', text: '입소하려면 꼭 써야 하는 ‘계약서’ 같은 거니까.', portrait: true }
                ]);
                setShowNpcDialog(true);
                setNpcDialogStep(0);
            }, 1000);
        }

        if (step === 'explore_inside' && targetRoomId === 'terrace') {
            setStep('obtain_item005');
            setTimeout(() => {
                showGuide([
                    "저기 테이블 위에 웰컴 드링크가 있네요. 클릭해서 획득해봅시다."
                ]);
            }, 1000);
        }

        if (step === 'return_to_class' && targetRoomId === 'umi_class') {
            setStep('npc_chat_tutorial');
            setTimeout(() => {
                showGuide([
                    "곽빙어를 클릭해서 대화를 시도해봅시다.",
                    "NPC에게 대화를 요청할 때는 10의 행동력을 소모합니다.",
                    "행동력 고갈에 주의하세요!"
                ], () => {
                    // Give player control to click on NPC
                });
            }, 1000);
        }
    };

    // Item Collection processing
    const handleItemCollect = () => {
        addItem(pendingItem.itemId);

        let itemIdString = pendingItem.itemId;
        setPendingItem(null);

        spendHp(1); // Item pickup costs HP

        if (step === 'obtain_item005' && itemIdString === 'item005') {
            setStep('return_to_class');
            setTimeout(() => {
                showGuide([
                    "아이템 획득에도 행동력을 1포인트 소모합니다. 상호작용은 신중히 해야 합니다!",
                    "이제 1층 메인홀을 지나 원데이 클래스 룸(umi_class)에 있는 곽빙어에게 돌아갑시다."
                ]);
            }, 500);
        }
    };

    // Contract Signing
    const handleContractSigned = () => {
        setStep('hp_tutorial');
        setTimeout(() => {
            showGuide([
                "매 이동에는 체력을 1포인트씩 소모합니다.",
                "매일 100이 주어지며, 30을 소모하면 다음 일정(오전, 오후, 저녁, 새벽)으로 자동 진행됩니다.",
            ], () => {
                setStep('hp_tutorial_chat');
                setCurrentScript([
                    { speaker: '곽빙어', text: '빠르네. 이제 너도 정식 입소자야.', portrait: true },
                    { speaker: '곽빙어', text: '자, 2층 테라스에 웰컴 드링크가 준비되어 있어.', portrait: true },
                    { speaker: '곽빙어', text: '가서 경치 구경도 좀 하고, 드링크도 마시고 오라고.', portrait: true }
                ]);
                setShowNpcDialog(true);
                setNpcDialogStep(0);
            });
        }, 500);
    };

    // Present Sequence
    const handleItemPresent = (itemId) => {
        setShowInventoryForPresent(false);
        if (itemId === 'item005') {
            setCurrentScript([
                { speaker: '곽빙어', text: '좋아요. 그럼 한잔 하고 시작할까요?', portrait: true }
            ]);
            setStep('correct_present');
            setShowNpcDialog(true);
            setNpcDialogStep(0);
        } else {
            setCurrentScript([
                { speaker: '곽빙어', text: '이게 아니잖아요. 장난감 말고 제대로 제시해주세요!', portrait: true }
            ]);
            setStep('wrong_present');
            setShowNpcDialog(true);
            setNpcDialogStep(0);
        }
    };

    // Drink Item (Use)
    const handleItemUse = (itemId) => {
        if (step === 'use_item_tutorial' && itemId === 'item005') {
            setStep('fish_level_up');
            setTimeout(() => {
                setStep('fadeout');

                completeTutorial();

                setTimeout(() => {
                    setDay(1);
                    setPeriod('morning');
                    setCurrentLocationInfo({ floorId: 'B2', roomId: 'room001' });
                    onComplete();
                }, 3000);
            }, 3000); // Wait for fish level up effect
        }
    };

    // Dummy Npc interact
    const handleNpcClick = () => {
        if (step === 'npc_chat_tutorial') {
            spendHp(10);
            setStep('chat_bingeo_present');
            setCurrentScript([
                { speaker: '곽빙어', text: '잘 왔어. 음료는 챙겼지?', portrait: true },
                { speaker: '곽빙어', text: '자, 아까 받은 솔피의 눈물을 나한테 보여줘봐. (제시)', portrait: true }
            ]);
            setShowNpcDialog(true);
            setNpcDialogStep(0);
        }
    };


    return (
        <div className="relative w-full h-screen bg-gray-900 overflow-hidden font-sans">
            {/* 1. 인트로 독백 */}
            <AnimatePresence mode="wait">
                {step === 'intro' && (
                    <motion.div key="intro" className="absolute inset-0 z-50">
                        <IntroSequence onComplete={handleIntroComplete} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. 배경 (Map Viewer) */}
            <AnimatePresence>
                {step !== 'intro' && step !== 'fadeout' && step !== 'fish_level_up' && (
                    <motion.div
                        key="map-viewer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gray-900 overflow-hidden"
                        style={{
                            backgroundImage: mapInfo?.background,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {/* Map Interactive Layer overlay */}
                        <div className="absolute inset-0 filter brightness-[0.7] pointer-events-none bg-black/30" />
                        <MapInteractiveLayer
                            mapInfo={mapInfo}
                            onInteract={handleMapInteract}
                            highlightCondition={(zone) => step === 'obtain_item005' && zone.type === 'item' && zone.itemId === 'item005'}
                        />

                        {/* Dummy NPC in Class room */}
                        {mapInfo?.id === 'umi_class' && (step === 'npc_chat_tutorial' || step === 'chat_bingeo_present' || step === 'present_tutorial' || step === 'use_item_tutorial') && (
                            <div
                                className="absolute cursor-pointer rounded-full bg-blue-500/50 hover:bg-blue-500/80 transition shadow-xl animate-pulse flex items-center justify-center z-20"
                                style={{ left: '50%', top: '50%', width: '10%', height: '20%' }}
                                onClick={handleNpcClick}
                            >
                                <span className='text-xs text-white font-bold'>곽빙어</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 가이드 팝업 */}
            <InteractionPopup
                isOpen={guideOpen}
                messages={guideMessages}
                onComplete={handleGuideComplete}
                title="튜토리얼 안내"
            />

            {/* 메신저 앱 */}
            <AnimatePresence>
                {showMessenger && (
                    <motion.div
                        key="messenger"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute left-0 top-0 w-[420px] h-full bg-white shadow-2xl z-40 border-r border-gray-300"
                    >
                        <MessengerApp
                            isStartMode={true}
                            onBack={() => { }}
                            onComplete={() => { }}
                        />
                        <MessengerDisconnectWatcher onDisconnect={() => setMessengerDisconnected(true)} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 대화창 */}
            {showNpcDialog && (
                <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none flex flex-col justify-end items-center z-50">
                    {currentScript[npcDialogStep]?.portrait && (
                        <PortraitDisplay activeNpc={npcData?.bingeo} mood="neutral" isVisible={true} isLeft={false} />
                    )}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/90 backdrop-blur-sm border-t border-white/20 p-8 pt-6 w-full max-w-4xl text-white cursor-pointer pointer-events-auto rounded-t-3xl shadow-2xl relative"
                        onClick={handleNpcNext}
                    >
                        <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-blue-600 text-white font-bold px-4 py-1 rounded-full text-sm">
                            곽빙어
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-gray-200">
                            {currentScript[npcDialogStep]?.speaker}
                        </h3>
                        <p className="text-lg leading-relaxed whitespace-pre-line text-white/90">
                            {currentScript[npcDialogStep]?.text}
                        </p>
                        <div className="absolute bottom-4 right-6 animate-pulse">
                            <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* 계약서 모달 */}
            {step === 'contract' && (
                <motion.div
                    key="contract"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 p-8"
                >
                    <GameStartSequence onSign={handleContractSigned} />
                </motion.div>
            )}

            {/* 아이템 획득 팝업 */}
            {pendingItem && (
                <ItemPickupModal
                    isOpen={true}
                    item={ITEMS[pendingItem.itemId] || { name: 'Unknown', description: '' }}
                    onClose={() => setPendingItem(null)}
                    onCollect={handleItemCollect}
                />
            )}

            {/* 간이 인벤토리 (강제 제시용) */}
            {showInventoryForPresent && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 p-6 rounded-xl shadow-2xl z-50 overflow-hidden w-96">
                    <h3 className="font-bold text-lg mb-4 text-center">아이템 제시하기</h3>
                    <div className="space-y-2">
                        {['item001', 'item002', 'item005'].map(i => {
                            const item = ITEMS[i];
                            if (!item) return null;
                            return (
                                <button
                                    key={i}
                                    className="w-full bg-gray-100 p-3 rounded flex items-center justify-between hover:bg-gray-200"
                                    onClick={() => handleItemPresent(i)}
                                >
                                    <span className="font-bold">{item.name}</span>
                                    <span className="text-blue-500 font-xs">제시</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* 간이 인벤토리 (강제 사용용) */}
            {step === 'use_item_tutorial' && (
                <div className="absolute top-4 left-4 bg-white/90 p-4 rounded-xl shadow-2xl z-40 overflow-hidden w-64">
                    <h3 className="font-bold text-sm mb-2">인벤토리 (가이드)</h3>
                    <div className="space-y-2">
                        <button
                            className="w-full bg-green-100 p-2 text-sm rounded flex items-center justify-between border border-green-300 shadow-sm"
                            onClick={() => handleItemUse('item005')}
                        >
                            <span className="font-bold text-green-800">솔피의 눈물</span>
                            <span className="text-green-600 font-bold bg-white px-2 rounded font-xs">사용</span>
                        </button>
                    </div>
                </div>
            )}


            {/* 물고기 레벨 피드백 이펙트 */}
            {step === 'fish_level_up' && (
                <motion.div
                    key="fish_level_up"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-8 text-center"
                >
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-6xl mb-6"
                    >
                        🐟
                    </motion.div>
                    <h2 className="text-3xl font-black text-red-500 mb-2 tracking-widest">[ SYSTEM FAILURE ]</h2>
                    <h3 className="text-2xl font-bold text-white mb-8">FISH LEVEL INCREASED</h3>
                    <p className="text-white text-lg font-serif italic text-gray-400">몸 속에 기이한 기운이 퍼져나간다...</p>
                </motion.div>
            )}

            {/* 암전 (시간 경과 / 다음 날 전환) */}
            {step === 'fadeout' && (
                <motion.div
                    key="fadeout"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center"
                >
                    <p className="text-white text-xl font-serif">...정신이 아득해진다...</p>
                </motion.div>
            )}

        </div>
    );
};

// 메신저 연결 끊김을 강제로 감지하기 위한 리스너 컴포넌트
const MessengerDisconnectWatcher = ({ onDisconnect }) => {
    useEffect(() => {
        const handler = (e) => {
            if (e.detail === 'messenger-disconnected') {
                onDisconnect();
            }
        };
        window.addEventListener('guidance-trigger', handler);
        return () => window.removeEventListener('guidance-trigger', handler);
    }, [onDisconnect]);
    return null;
};

export default TutorialScene;
