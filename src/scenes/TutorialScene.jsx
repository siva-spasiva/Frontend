import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import IntroSequence from './IntroSequence';
import ItemPickupModal from '../components/ItemPickupModal';
import MessengerApp from '../components/apps/MessengerApp';
import MapInteractiveLayer from '../components/MapInteractiveLayer';
import InteractionPopup from '../components/InteractionPopup';
import PortraitDisplay from '../components/PortraitDisplay';
import IngameSidebarMenu from '../components/IngameSidebarMenu';
import MapContainer from '../components/MapContainer';
import GameHUD from '../components/GameHUD';
import HpWarningModal from '../components/HpWarningModal';

const TutorialScene = ({ onComplete }) => {
    // 튜토리얼 진행 상태: 'intro' -> 'outside' -> 'meet_bingeo_outside' -> 'explore_outside' ->
    // 'meet_bingeo_inside' -> 'hp_tutorial' -> 'explore_inside' -> 'obtain_item005' ->
    // 'return_to_class' -> 'npc_chat_tutorial' -> 'npc_chatting' -> 'chat_bingeo_present' ->
    // 'present_tutorial' -> 'use_item_tutorial' -> 'fish_level_up' -> 'fadeout'

    const [step, setStep] = useState('intro');
    const {
        addItem, ITEMS, setDay, setPeriod, setCurrentLocationInfo, currentLocationInfo,
        completeTutorial, mapData, npcData,
        inventory: currentInventory, presentedItem, clearPresentation, setActiveNpcInField, ACTION_COSTS
    } = useGame();

    const currentFloorId = currentLocationInfo?.floorId || '1F';
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

    // Ingame menu state (left HUD button)
    const [isMenuEnabled, setIsMenuEnabled] = useState(false);
    const [isSidebarPanelOpen, setIsSidebarPanelOpen] = useState(false);

    // === AI Chat State (for npc_chatting step) ===
    const [chatLogs, setChatLogs] = useState([]);
    const [chatDialogContent, setChatDialogContent] = useState(null);
    const [chatInputText, setChatInputText] = useState('');
    const [isChatThinking, setIsChatThinking] = useState(false);
    const MAX_CHAT_TURNS = 10;
    const [showNpcChatHpWarning, setShowNpcChatHpWarning] = useState(false);
    const [chatViewMode, setChatViewMode] = useState('mini');

    // === Eavesdrop State (Simulated) ===
    const [eavesdropState, setEavesdropState] = useState(null); // 'preview', 'listening', 'done', 'hp_warning'
    const [eavesdropLogs, setEavesdropLogs] = useState([]);
    const [eavesdropDialogContent, setEavesdropDialogContent] = useState(null);
    const [isEavesdropThinking, setIsEavesdropThinking] = useState(false);
    const eavesdropAutoRef = useRef(null);
    const [eavesdropAutoIndex, setEavesdropAutoIndex] = useState(0);

    const previousHasItem005 = useRef(currentInventory?.includes('item005'));

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

    // Eavesdrop Simulation Data & Logic
    const EAVESDROP_SIMULATION_DATA = [
        { speaker: '이민어', content: '뭔가 마셨습니까?' },
        { speaker: '구복치', content: '네... 마시지 않으면 안된다고 했어요...' },
        { speaker: '이민어', content: '마신 이후에 어떤 기분이 들던가요?' },
        { speaker: '구복치', content: '... 약간 어지럽고...' },
    ];

    const runSimulatedEavesdrop = (index, currentLogs) => {
        if (index >= EAVESDROP_SIMULATION_DATA.length) {
            setEavesdropState('done');
            setEavesdropDialogContent({ speaker: 'System', text: '대화가 끝났습니다.', type: 'system' });
            setIsEavesdropThinking(false);
            return;
        }

        setIsEavesdropThinking(true);
        const turn = EAVESDROP_SIMULATION_DATA[index];
        const newLog = {
            id: `eavesdrop_${index}_${Math.random().toString(36).substr(2, 5)}`,
            speaker: turn.speaker,
            text: turn.content,
            type: 'eavesdrop_listen',
        };
        const updatedLogs = [...currentLogs, newLog];

        // Simulating the delay for thinking effect
        setTimeout(() => {
            setEavesdropLogs(updatedLogs);
            setEavesdropDialogContent(newLog);
            setEavesdropAutoIndex(index + 1);
            setIsEavesdropThinking(false);

            if (eavesdropAutoRef.current) {
                clearTimeout(eavesdropAutoRef.current);
            }
            eavesdropAutoRef.current = setTimeout(() => {
                runSimulatedEavesdrop(index + 1, updatedLogs);
            }, 2000);
        }, 1000); // 1초 생각 중 연출
    };

    const handleCloseEavesdrop = () => {
        setEavesdropState(null);
        setEavesdropLogs([]);
        setEavesdropDialogContent(null);
        setIsEavesdropThinking(false);
        if (eavesdropAutoRef.current) {
            clearTimeout(eavesdropAutoRef.current);
            eavesdropAutoRef.current = null;
        }

        // Only progress tutorial if we are in the eavesdrop phase
        if (step === 'eavesdrop_tutorial') {
            setStep('return_to_class');
            showGuide([
                "안쪽에서 대화소리가 들렸습니다.",
                "본 게임에서는 이렇게 방 안의 상황을 엿듣거나 대화에 끼어들 수 있는 선택지가 존재합니다.",
                "튜토리얼에서의 엿듣기 체험은 여기까지입니다. 이제 1층 강의실로 돌아가주세요."
            ]);
        }
    };

    const handleEavesdropActionTutorial = () => {
        showGuide([
            "튜토리얼에서는 기능이 제한됩니다.",
            "본 게임에서는 이 옵션들을 사용해 대화에 끼어들거나 계속 엿들을 수 있습니다.",
            "하단의 '닫기' 또는 상단의 '떠나기' 버튼을 눌러 돌아가주세요."
        ]);
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
                    { speaker: '곽빙어', text: '직원...? 맞아. \'평범한 원데이 클래스 우미\'의 직원 곽빙어라고 해.', portrait: true },
                    { speaker: '곽빙어', text: '밖에 서 있지 말고 일단 안으로 들어와. 안으로 먼저 들어갈 테니까 따라와.', portrait: true }
                ]);
                setShowNpcDialog(true);
                setNpcDialogStep(0);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [step, messengerDisconnected]);

    useEffect(() => {
        const hasNpcInField = ['npc_chat_tutorial', 'npc_chatting', 'chat_bingeo_present', 'present_tutorial', 'use_item_tutorial'].includes(step);
        setActiveNpcInField(hasNpcInField ? npcData?.bingeo || null : null);

        return () => setActiveNpcInField(null);
    }, [step, npcData, setActiveNpcInField]);

    useEffect(() => {
        if (!presentedItem || step !== 'present_tutorial') return;

        const timer = setTimeout(() => {
            if (presentedItem.itemId === 'item005') {
                setCurrentScript([
                    { speaker: '곽빙어', text: '오, 잘했어. 이렇게 아이템을 NPC에게 제시할 수 있어. 뭐든 한마디 해봐.', portrait: true }
                ]);
                setStep('correct_present');
            } else {
                setCurrentScript([
                    { speaker: '곽빙어', text: '그건 아니야. 시식용 음료를 보여줘.', portrait: true }
                ]);
                setStep('wrong_present');
            }

            setShowNpcDialog(true);
            setNpcDialogStep(0);
            clearPresentation();
        }, 0);

        return () => clearTimeout(timer);
    }, [presentedItem, step, clearPresentation]);

    useEffect(() => {
        const hasItem005 = currentInventory?.includes('item005');

        if (step === 'use_item_tutorial' && previousHasItem005.current && !hasItem005) {
            const timer = setTimeout(() => {
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
                }, 3000);
            }, 0);

            return () => clearTimeout(timer);
        }

        previousHasItem005.current = hasItem005;
    }, [step, currentInventory, completeTutorial, setDay, setPeriod, setCurrentLocationInfo, onComplete]);

    // NPC 대화 넘기기 핸들러
    const handleNpcNext = () => {
        if (npcDialogStep < currentScript.length - 1) {
            setNpcDialogStep((prev) => prev + 1);
        } else {
            setShowNpcDialog(false);

            if (step === 'meet_bingeo_outside') {
                setStep('explore_outside');
                showGuide([
                    "맵을 잘 찾아보면 클릭이 가능한 지점이 있습니다.",
                    "문으로 들어가기 전 모든 포인트를 클릭해보세요!"
                ]);
            } else if (step === 'meet_bingeo_inside') {
                showGuide([
                    "건물 내부로 들어왔습니다. 입소를 위해 계약서를 작성해야 합니다."
                ], () => {
                    handleContractSigned();
                });
            } else if (step === 'hp_tutorial_chat') {
                setStep('explore_inside');
                showGuide([
                    "모든 행동에는 HP를 소모합니다. 맵 탐색, 이동과 아이템 줍기는 1씩 소모합니다.",
                    "HP는 튜토리얼 기간동안은 소모되지 않으니 안심하세요. 이후 1일차부터는 행동력을 소모하게 됩니다. 튜토리얼 기간 동안 자유롭게 탐사해보세요!"
                ]);
            } else if (step === 'chat_bingeo_present') {
                setStep('present_tutorial');
                showGuide([
                    "게임 메뉴를 호출해서 인벤토리를 열 수 있습니다.",
                    "아까 획득한 솔피의 눈물을 곽빙어에게 제시하세요."
                ]);
            } else if (step === 'wrong_present') {
                setStep('present_tutorial');
                showGuide([
                    "잘못된 아이템을 제시했습니다.",
                    "솔피의 눈물 아이템을 제시하세요."
                ]);
            } else if (step === 'correct_present') {
                // NPC 대사 닫고 채팅 UI 유지 — 사용자의 메시지 대기
                setShowNpcDialog(false);
                setChatDialogContent({
                    speaker: '곽빙어',
                    text: '오, 잘했어. 이렇게 아이템을 NPC에게 제시할 수 있어. 뭐든 한마디 해봐.',
                    type: 'active_npc'
                });
                setChatViewMode('mini');
            }
        }
    };

    // 맵 상호작용 핸들러
    const canEnterMainHall = () => {
        const outsideInfoZones = mapData?.outside01?.activeZones?.filter((zone) => zone.type === 'info') || [];
        return outsideInfoZones.every((zone) => interactedZones.includes(zone.id));
    };

    const isBingeoFinishSequence = ['npc_chatting', 'chat_bingeo_present', 'present_tutorial', 'wrong_present', 'correct_present', 'use_item_tutorial'].includes(step);
    const disableItemUseInInventory = ['obtain_item005', 'return_to_class', 'npc_chat_tutorial', 'npc_chatting', 'chat_bingeo_present', 'present_tutorial', 'wrong_present'].includes(step);
    const inventoryUseOnlyItemId = step === 'use_item_tutorial' ? 'item005' : null;
    const isMapInteractionLocked =
        guideOpen ||
        showNpcDialog ||
        showMessenger ||
        isBingeoFinishSequence ||
        isSidebarPanelOpen;

    const handleSidebarPanelStateChange = useCallback((panelState) => {
        setIsSidebarPanelOpen(!!panelState?.isOpen);
    }, []);

    const blockMoveByBingeo = () => {
        setCurrentScript([
            { speaker: '곽빙어', text: '어디가, 하던일은 마무리하고 가야지!', portrait: true }
        ]);
        setShowNpcDialog(true);
        setNpcDialogStep(0);
    };

    const handleMapInteract = (zone) => {
        if (guideOpen || showNpcDialog || showMessenger) return;

        if (isBingeoFinishSequence && zone.type === 'move') {
            blockMoveByBingeo();
            return;
        }

        if (step === 'explore_outside') {
            if (zone.type === 'move' && zone.target === 'main_hall') {
                if (!canEnterMainHall()) {
                    showGuide([
                        "굳게 닫혀있다. 아직 주변을 덜 둘러본 것 같다.",
                        "주변의 상호작용 오브젝트를 더 찾아보세요. 아직 남아있습니다!"
                    ]);
                    return;
                }

                handleMoveInternal(zone.target);
                return;
            }

            if (zone.type === 'info') {
                if (!interactedZones.includes(zone.id)) {
                    setInteractedZones((prev) => [...prev, zone.id]);
                }
                showGuide([zone.message]);
                return;
            }
        }

        if (step === 'eavesdrop_tutorial') {
            if (zone.type === 'move' && zone.target === 'storage_main') {
                setEavesdropState('preview');
                // 시작 안내 후 1초 뒤에 자동 엿듣기 시작
                setTimeout(() => {
                    if (eavesdropState !== 'done') {
                        setEavesdropState('listening');
                        runSimulatedEavesdrop(0, []);
                    }
                }, 1000);
                return;
            }
        }

        if (step === 'explore_inside') {
            if (zone.type === 'move') {
                handleMoveInternal(zone.target);
                return;
            }

            if (zone.type === 'info') {
                showGuide([zone.message]);
                return;
            }
        }

        if (step === 'obtain_item005') {
            if (zone.type === 'item' && zone.itemId === 'item005') {
                setPendingItem(zone);
                return;
            }

            if (zone.type === 'move') {
                showGuide([
                    "웰컴 드링크를 먼저 얻어야 합니다."
                ]);
                return;
            }

            if (zone.type === 'info' && zone.message) {
                showGuide([zone.message]);
                return;
            }
        }

        if (step === 'return_to_class' || step === 'npc_chat_tutorial') {
            if (zone.type === 'move') {
                handleMoveInternal(zone.target);
            }
        }
    };

    const handleMenuNavigate = (targetRoomId) => {
        if (!targetRoomId) return;
        if (guideOpen || showNpcDialog || showMessenger) return;

        if (isBingeoFinishSequence && targetRoomId !== currentRoomId) {
            blockMoveByBingeo();
            return;
        }

        if (step === 'obtain_item005') {
            showGuide([
                "솔피의 눈물을 먼저 획득해야 합니다."
            ]);
            return;
        }

        if (step === 'eavesdrop_tutorial' && targetRoomId !== currentRoomId) {
            showGuide([
                "2층 창고(storage_main) 문에서 들리는 소리를 확인해주세요."
            ]);
            return;
        }

        if (step === 'explore_outside' && targetRoomId === 'main_hall' && !canEnterMainHall()) {
            showGuide([
                "아직 메인 홀로 바로 들어갈 수 없습니다.",
                "주변의 정보 포인트를 먼저 확인해 주세요."
            ]);
            return;
        }

        handleMoveInternal(targetRoomId);
    };

    const handleMoveInternal = (targetRoomId) => {
        if (isBingeoFinishSequence && targetRoomId !== currentRoomId) {
            blockMoveByBingeo();
            return;
        }

        if (step === 'obtain_item005' && targetRoomId !== currentRoomId) {
            showGuide([
                "솔피의 눈물을 먼저 획득해야 합니다."
            ]);
            return;
        }

        if (step === 'eavesdrop_tutorial' && targetRoomId !== currentRoomId) {
            showGuide([
                "2층 창고(storage_main) 문에서 들리는 소리를 확인해주세요."
            ]);
            return;
        }

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
                    { speaker: '곽빙어', text: '입소하려면 꼭 써야 하는 간단한 서명 같은 거니까, 걱정하지 말고.', portrait: true }
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
                    "본편에서는 NPC에게 대화를 요청할 때 10의 행동력을 소모하지만,",
                    "튜토리얼에서는 행동력이 소모되지 않습니다."
                ], () => {
                    // Give player control to click on NPC
                });
            }, 1000);
        }
    };

    // Contract Signing
    const handleContractSigned = () => {
        setStep('hp_tutorial');

        setTimeout(() => {
            showGuide([
                "매 이동에는 체력을 1포인트씩 소모합니다.",
                "튜토리얼에서는 소모되지 않으니 지금은 시스템에 익숙해져 봅시다."
            ], () => {
                setStep('hp_tutorial_chat');
                setCurrentScript([
                    { speaker: '곽빙어', text: '좋아. 이제 너도 정식 입소자야.', portrait: true },
                    { speaker: '곽빙어', text: '2층 테라스에 웰컴 드링크가 준비되어 있어.', portrait: true },
                    { speaker: '곽빙어', text: '가서 경치도 보고, 드링크도 챙겨와.', portrait: true }
                ]);
                setShowNpcDialog(true);
                setNpcDialogStep(0);
            });
        }, 500);
    };

    const handleItemCollect = () => {
        if (!pendingItem?.itemId) return;

        const collectedItemId = pendingItem.itemId;
        addItem(collectedItemId);
        setPendingItem(null);
        // 튜토리얼에서는 HP를 소모하지 않음

        if (step === 'obtain_item005' && collectedItemId === 'item005') {
            setTimeout(() => {
                setIsMenuEnabled(true);
                showGuide([
                    "솔피의 눈물을 획득했습니다! 확인해 봅시다.",
                    "왼쪽 버튼으로 메뉴 목록 확인 기능을 해금했습니다.",
                    "Inventory, Messenger, Map, Settings를 사용할 수 있습니다.",
                    "(Recorder 등 일부 기능은 본 게임에서만 제공됩니다.)"
                ], () => {
                    setStep('eavesdrop_tutorial');
                    showGuide([
                        "잠깐, 2층 창고(storage_main) 쪽에서 무슨 소리가 들리는 것 같습니다.",
                        "저 문을 클릭해서 접근해보세요."
                    ]);
                });
            }, 300);
        }
    };

    // NPC Chat: "대화하기" 버튼 클릭 핸들러
    const handleStartChatClick = () => {
        if (step !== 'npc_chat_tutorial') return;
        setShowNpcChatHpWarning(true);
    };

    const handleConfirmChatHp = async () => {
        setShowNpcChatHpWarning(false);
        // 튜토리얼에서는 HP를 소모하지 않음
        setStep('npc_chatting');
        setChatLogs([]);
        setChatDialogContent({
            speaker: '곽빙어',
            text: '잘 왔어. 음료는 챙겼지? 이것저것 물어볼 게 있으면 말해봐.',
            type: 'active_npc'
        });
        setChatViewMode('mini');
    };

    const handleCancelChatHp = () => {
        setShowNpcChatHpWarning(false);
    };

    // Tutorial Chat Send Handler - 체험용 고정 스크립트 응답
    const handleTutorialChatSend = async () => {
        if (!chatInputText.trim() || isChatThinking) return;
        if (step !== 'npc_chatting' && step !== 'correct_present') return;

        const userMsg = chatInputText;
        setChatInputText('');
        setIsChatThinking(true);

        // Archive current dialog + add user message
        const newLogs = [...chatLogs];
        if (chatDialogContent) {
            newLogs.push({
                ...chatDialogContent,
                id: Date.now() + '_prev_npc',
                type: chatDialogContent.type || 'npc'
            });
        }
        newLogs.push({
            id: Date.now() + '_user',
            speaker: 'You',
            text: userMsg,
            type: 'user'
        });
        setChatLogs(newLogs);
        setChatDialogContent(null);

        // 짧은 "생각 중" 딜레이 후 고정 응답
        await new Promise(resolve => setTimeout(resolve, 1200));

        // correct_present 상태: 제시 후 사용자 메시지 → 사용 단계로 전환
        if (step === 'correct_present') {
            const presentResponse = '오케이, 이렇게 제시하는 거야. 자, 이제 인벤토리에서 솔피의 눈물을 마셔보자.';

            setChatDialogContent({
                speaker: '곽빙어',
                text: presentResponse,
                type: 'active_npc'
            });
            setIsChatThinking(false);

            setTimeout(() => {
                const finalLogs = [...newLogs, {
                    id: Date.now() + '_npc_present_done',
                    speaker: '곽빙어',
                    text: presentResponse,
                    type: 'active_npc'
                }];
                setChatLogs(finalLogs);

                setStep('use_item_tutorial');
                showGuide([
                    "인벤토리를 열고 '솔피의 눈물'을 '사용'해봅시다."
                ]);
            }, 2000);
            return;
        }

        // npc_chatting 상태: 대화 체험 → 제시 단계로 전환
        const fixedResponse = '흠, 뭘 물어보든 지금은 대답 안 해줄 거야. 인벤토리에서 아이템을 제시하는 것도 해봐. 아까 받은 솔피의 눈물을 꺼내서 나한테 보여줘 봐.';

        setChatDialogContent({
            speaker: '곽빙어',
            text: fixedResponse,
            type: 'active_npc'
        });
        setIsChatThinking(false);

        // 고정 응답 후 바로 아이템 제시 단계로 전환
        setTimeout(() => {
            const finalLogs = [...newLogs, {
                id: Date.now() + '_npc_fixed',
                speaker: '곽빙어',
                text: fixedResponse,
                type: 'active_npc'
            }];
            setChatLogs(finalLogs);

            setStep('chat_bingeo_present');
            setCurrentScript([
                { speaker: '곽빙어', text: '자, 아까 받은 솔피의 눈물을 나한테 보여줘봐. (제시)', portrait: true }
            ]);
            setShowNpcDialog(true);
            setNpcDialogStep(0);
        }, 2000);
    };

    const canToggleMenu = isMenuEnabled && !guideOpen && !showNpcDialog && !showMessenger;


    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
            {/* 1. 인트로 독백 */}
            <AnimatePresence mode="wait">
                {step === 'intro' && (
                    <Motion.div key="intro" className="absolute inset-0 z-50">
                        <IntroSequence onComplete={handleIntroComplete} />
                    </Motion.div>
                )}
            </AnimatePresence>

            <MapContainer aspectRatio={16 / 9}>

                {/* 2. 배경 (Map Viewer) */}
                <AnimatePresence>
                    {step !== 'intro' && step !== 'fadeout' && step !== 'fish_level_up' && (
                        <Motion.div
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
                            {/* Map Interactive Layer */}
                            <MapInteractiveLayer
                                mapInfo={mapInfo}
                                onInteract={handleMapInteract}
                                highlightCondition={(zone) => step === 'obtain_item005' && zone.type === 'item' && zone.itemId === 'item005'}
                                isInteractionLocked={isMapInteractionLocked}
                            />

                            {/* NPC "대화하기" 버튼 (강의실에서 곽빙어와 대화 시작 - NPC 패널 모방) */}
                            {mapInfo?.id === 'umi_class' && ['npc_chat_tutorial', 'npc_chatting', 'chat_bingeo_present', 'present_tutorial', 'wrong_present', 'correct_present', 'use_item_tutorial'].includes(step) && step !== 'hp_tutorial_chat' && (
                                <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20 flex flex-col gap-2 min-w-[200px]">
                                    <span className="text-xs text-gray-400 mb-1">
                                        현재 방: 곽빙어
                                    </span>
                                    {step === 'npc_chat_tutorial' ? (
                                        <button
                                            onClick={handleStartChatClick}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 animate-pulse"
                                        >
                                            💬 곽빙어와(과) 대화하기
                                            <span className="text-xs text-blue-200">(0 HP)</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setChatLogs([]);
                                                setChatDialogContent(null);
                                                setStep('npc_chat_tutorial'); // end chat equivalent for tutorial
                                                showGuide(["대화를 종료했습니다. 곽빙어를 다시 클릭해 대화를 시작할 수 있습니다."]);
                                            }}
                                            className="w-full py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                                        >
                                            대화 종료
                                        </button>
                                    )}
                                </div>
                            )}
                        </Motion.div>
                    )}
                </AnimatePresence>

                {step !== 'intro' && step !== 'fadeout' && step !== 'fish_level_up' && canToggleMenu && (
                    <IngameSidebarMenu
                        currentFloorId={currentFloorId}
                        currentRoomId={currentRoomId}
                        onNavigate={handleMenuNavigate}
                        disabledPanels={['recorder']}
                        inventoryUseDisabled={disableItemUseInInventory}
                        inventoryUseOnlyItemId={inventoryUseOnlyItemId}
                        onPanelStateChange={handleSidebarPanelStateChange}
                    />
                )}


                {/* 가이드 팝업 */}
                <InteractionPopup
                    isOpen={guideOpen}
                    messages={guideMessages}
                    onComplete={handleGuideComplete}
                    title="튜토리얼 안내"
                    showTitle
                />

                {/* 메신저 앱 */}
                <AnimatePresence>
                    {showMessenger && (
                        <Motion.div
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
                        </Motion.div>
                    )}
                </AnimatePresence>

                {/* AI 채팅 UI (npc_chatting 스텝) - GameHUD 적용 */}
                {step === 'npc_chatting' && (
                    <GameHUD
                        mapInfo={mapInfo}
                        activeNpc={npcData?.bingeo}
                        logs={chatLogs}
                        dialogContent={chatDialogContent}
                        isThinking={isChatThinking}
                        onSend={handleTutorialChatSend}
                        inputText={chatInputText}
                        setInputText={setChatInputText}
                        viewMode={chatViewMode}
                        onToggleExpand={() => setChatViewMode(prev => prev === 'full' ? 'mini' : 'full')}
                        onToggleHidden={() => setChatViewMode(prev => prev === 'hidden' ? 'mini' : 'hidden')}
                        theme="basic"
                        presentedItem={presentedItem}
                        onClearPresentation={clearPresentation}
                        showViewControls={false}
                        isSidebarVisible={isSidebarPanelOpen}
                    />
                )}

                {/* Eavesdrop UI (시뮬레이션 용) */}
                {eavesdropState && (
                    <>
                        <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20 flex flex-col gap-2 min-w-[200px]">
                            <span className="text-xs text-gray-400 mb-1">
                                문 너머 대상: 이민어, 구복치
                            </span>

                            {(eavesdropState === 'preview' || eavesdropState === 'choice') && (
                                <>
                                    <button
                                        className="w-full py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-bold text-white transition-colors shadow-lg"
                                        onClick={() => handleEavesdropActionTutorial('intercept')}
                                    >
                                        🗣️ 끼어들기 ({ACTION_COSTS.eavesdropJoin} HP)
                                    </button>
                                    <button
                                        className="w-full py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-bold text-white transition-colors shadow-lg"
                                        onClick={() => handleEavesdropActionTutorial('listen')}
                                    >
                                        👂 계속 엿듣기 ({ACTION_COSTS.eavesdropContinue} HP)
                                    </button>
                                    <button
                                        className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold text-white transition-colors shadow-lg"
                                        onClick={handleCloseEavesdrop}
                                    >
                                        떠나기
                                    </button>
                                </>
                            )}

                            {eavesdropState === 'listening' && (
                                <button
                                    className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold text-white transition-colors shadow-lg"
                                    onClick={handleCloseEavesdrop}
                                >
                                    떠나기
                                </button>
                            )}
                        </div>

                        <GameHUD
                            mapInfo={mapInfo}
                            activeNpc={null}
                            viewMode="mini"
                            logs={eavesdropLogs}
                            dialogContent={eavesdropDialogContent}
                            isThinking={null}
                            showViewControls={false}
                            isSidebarVisible={isSidebarPanelOpen}
                        >
                            <div className="absolute bottom-[calc(100%+8px)] w-full left-0 flex flex-col gap-2 px-1 pb-2">
                                {/* Listening progress */}
                                {eavesdropState === 'listening' && (
                                    <div className="mt-2 bg-black/60 p-3 rounded-xl text-center">
                                        <span className="text-sm text-purple-300">
                                            {isEavesdropThinking ? '생각 중...' : `엿듣는 중... (${eavesdropAutoIndex}/${EAVESDROP_SIMULATION_DATA.length})`}
                                        </span>
                                    </div>
                                )}

                                {eavesdropState === 'done' && (
                                    <div className="mt-2 flex justify-center">
                                        <button
                                            onClick={handleCloseEavesdrop}
                                            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-bold text-white transition-colors shadow-lg animate-pulse"
                                        >
                                            닫기
                                        </button>
                                    </div>
                                )}
                            </div>
                        </GameHUD>
                    </>
                )}

                {/* NPC 대화 HP 경고 모달 (표준 컴포넌트 사용) */}
                {showNpcChatHpWarning && (
                    <HpWarningModal
                        isOpen={true}
                        config={{
                            title: '대화 시작 확인',
                            cost: 10,
                            desc: '곽빙어와 대화를 시작하면 10 HP가 소모됩니다. 대화가 끝날 때까지 이동과 다른 상호작용이 제한됩니다.',
                            onConfirm: handleConfirmChatHp,
                        }}
                        onClose={handleCancelChatHp}
                    />
                )}

                {/* 대화창 */}
                {showNpcDialog && (
                    <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none flex flex-col justify-end items-center z-50">
                        {currentScript[npcDialogStep]?.portrait && (
                            <PortraitDisplay activeNpc={npcData?.bingeo} mood="neutral" isVisible={true} isLeft={false} />
                        )}
                        <Motion.div
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
                        </Motion.div>
                    </div>
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

                {/* 간이 인벤토리 (강제 사용용) */}


                {/* 물고기 레벨 피드백 이펙트 */}
                {step === 'fish_level_up' && (
                    <Motion.div
                        key="fish_level_up"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-8 text-center"
                    >
                        <Motion.div
                            animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-6xl mb-6"
                        >
                            🐟
                        </Motion.div>
                        <h3 className="text-2xl font-bold text-white mb-8">FISH LEVEL INCREASED</h3>
                        <p className="text-white text-lg font-serif italic text-gray-400">몸 속에 기이한 기운이 퍼져나간다...</p>
                    </Motion.div>
                )}

                {/* 암전 (시간 경과 / 다음 날 전환) */}
                {step === 'fadeout' && (
                    <Motion.div
                        key="fadeout"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2 }}
                        className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center"
                    >
                        <p className="text-white text-xl font-serif">...정신이 아득해진다...</p>
                    </Motion.div>
                )}

            </MapContainer>
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
