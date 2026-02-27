import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import IntroSequence from './IntroSequence';
import { updateLocationStats, resetItemsAPI } from '../api/stats';
import ItemPickupModal from '../components/ItemPickupModal';
import MessengerApp from '../components/apps/MessengerApp';
import MapInteractiveLayer from '../components/MapInteractiveLayer';
import InteractionPopup from '../components/InteractionPopup';
import PortraitDisplay from '../components/PortraitDisplay';
import IngameSidebarMenu from '../components/IngameSidebarMenu';
import MapContainer from '../components/MapContainer';
import GameHUD from '../components/GameHUD';
import HpWarningModal from '../components/HpWarningModal';
import ContractModal from '../components/ContractModal';
import { EAVESDROP_MAX_COLOR_COUNT, getEavesdropColorIndexFromText, getEavesdropColorStyle } from '../utils/eavesdropColors';

const TutorialScene = ({ onComplete }) => {
    // 튜토리얼 진행 상태: 'intro' -> 'outside' -> 'meet_bingeo_outside' -> 'explore_outside' ->
    // 'meet_bingeo_inside' -> 'contract' -> 'hp_tutorial' -> 'explore_inside' -> 'obtain_item005' ->
    // 'check_item005_inventory' -> 'eavesdrop_tutorial' -> 'return_to_class' ->
    // 'npc_chat_tutorial' -> 'npc_chatting' -> 'chat_bingeo_present' ->
    // 'present_tutorial' -> 'use_item_tutorial' -> 'fish_level_up' -> 'fadeout'

    const [step, setStep] = useState('skip_prompt');
    const {
        addItem, ITEMS, setDay, setPeriod, setCurrentLocationInfo, currentLocationInfo,
        completeTutorial, mapData, npcData,
        inventory: currentInventory, presentedItem, clearPresentation, setActiveNpcInField,
        updateStatsBackend
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
    const [isTransitioning, setIsTransitioning] = useState(false);

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
    const tutorialEavesdropParticipants = ['이민어', '구복치'];
    const awaitingItem005InspectRef = useRef(false);
    const openedItem005InventoryRef = useRef(false);
    const initialItemsGrantedRef = useRef(false);

    const previousHasItem005 = useRef(currentInventory?.includes('item005'));

    const getTutorialEavesdropColorIndex = useCallback((speakerName) => {
        const participantIndex = tutorialEavesdropParticipants.findIndex((name) => name === speakerName);
        if (participantIndex >= 0) return participantIndex % EAVESDROP_MAX_COLOR_COUNT;
        return getEavesdropColorIndexFromText(speakerName, EAVESDROP_MAX_COLOR_COUNT);
    }, [tutorialEavesdropParticipants]);

    useEffect(() => {
        if (initialItemsGrantedRef.current) return;
        initialItemsGrantedRef.current = true;

        const resetTutorialItems = async () => {
            try {
                // 백엔드 API를 통해 인벤토리 초기화 (단, 화면 동기화 처리를 위해 약간의 우회가 필요할 수 있으나 진행)
                await resetItemsAPI();
                // 초기화 후 클라이언트 상태 갱신을 위해 빈 업데이트를 날림
                await updateStatsBackend({ floorId: '1F' });
            } catch (error) {
                console.warn(`[Tutorial] Failed to reset initial items`, error);
            }
        };

        resetTutorialItems();
    }, [updateStatsBackend]);

    // Initialize location immediately upon tutorial component mount
    useEffect(() => {
        // Set local state
        setCurrentLocationInfo({ floorId: '1F', roomId: 'outside01' });

        // Sync with backend immediately during the intro
        updateLocationStats('1F', 'outside01').catch(error => {
            console.warn('Failed to sync initial tutorial location with server:', error);
        });
    }, [setCurrentLocationInfo]);

    // Utility: Show Guide
    const showGuide = (messages, onCompleteCallback) => {
        setGuideMessages(messages);
        setGuideCallback(() => (typeof onCompleteCallback === 'function' ? onCompleteCallback : null));
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
            id: `eavesdrop_${index}`,
            speaker: turn.speaker,
            text: turn.content,
            type: 'eavesdrop_listen',
            eavesdropParticipantIndex: getTutorialEavesdropColorIndex(turn.speaker),
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

    // 1. ?명듃濡??꾨즺 ???몃? ?꾩갑
    // === 튜토리얼 스킵 ===
    const handleSkipTutorial = async () => {
        try {
            // 튜토리얼 완료 처리 (endSession 등)
            await completeTutorial();
            // 기본 아이템 지급 (계약서)
            if (!currentInventory?.includes('item004')) {
                addItem('item004');
            }
        } catch (error) {
            console.warn('Skip tutorial failed:', error);
        }
        // 1일차 아침으로 진입
        setDay(1);
        setPeriod('morning');
        setCurrentLocationInfo({ floorId: 'B2', roomId: 'room001' });
        onComplete();
    };

    const handlePlayTutorial = () => {
        setStep('intro');
    };

    const handleIntroComplete = async () => {
        setStep('outside');
        // Location is already set to 1F outside01 on mount

        setIsTransitioning(true);
        setTimeout(() => {
            setIsTransitioning(false);
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
            const rafId = requestAnimationFrame(() => setIsTransitioning(true));
            const timer = setTimeout(() => {
                setIsTransitioning(false);
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
            return () => {
                cancelAnimationFrame(rafId);
                clearTimeout(timer);
            };
        }
    }, [step, messengerDisconnected]);

    useEffect(() => {
        const hasNpcInField = ['npc_chat_tutorial', 'npc_chatting', 'chat_bingeo_present', 'present_tutorial', 'use_item_tutorial'].includes(step);
        setActiveNpcInField(hasNpcInField ? npcData?.bingeo || null : null);

        return () => setActiveNpcInField(null);
    }, [step, npcData, setActiveNpcInField]);

    // 튜토리얼용 아이템 제시 연출은 handleTutorialChatSend 내에서 채팅 전송 시 처리됩니다.

    useEffect(() => {
        const hasItem005 = currentInventory?.includes('item005');

        if (step === 'use_item_tutorial' && previousHasItem005.current && !hasItem005) {
            const timer = setTimeout(() => {
                setStep('fish_level_up');
                setTimeout(() => {
                    setStep('fadeout');
                    completeTutorial();

                    // fadeout 연출 후 튜토리얼 완료 알림 화면으로
                    setTimeout(() => {
                        setStep('complete_notice');
                    }, 3000);
                }, 3000);
            }, 0);

            return () => clearTimeout(timer);
        }

        previousHasItem005.current = hasItem005;
    }, [step, currentInventory, completeTutorial, setDay, setPeriod, setCurrentLocationInfo, onComplete]);

    // 튜토리얼 완료 → 1일차 초기화 후 메인게임 진입
    const handleCompleteAndStart = () => {
        setDay(1);
        setPeriod('morning');
        setCurrentLocationInfo({ floorId: 'B2', roomId: 'room001' });
        onComplete();
    };

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
                    setStep('contract');
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
                // NPC ????リ퀬 梨꾪똿 UI ?좎? ???ъ슜?먯쓽 硫붿떆吏 ?湲?
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
    const disableItemUseInInventory = ['obtain_item005', 'check_item005_inventory', 'eavesdrop_tutorial', 'return_to_class', 'npc_chat_tutorial', 'npc_chatting', 'chat_bingeo_present', 'present_tutorial', 'wrong_present'].includes(step);
    const inventoryUseOnlyItemId = step === 'use_item_tutorial' ? 'item005' : null;
    const sidebarDisabledPanels = step === 'check_item005_inventory'
        ? ['map', 'recorder', 'messenger', 'settings']
        : ['recorder'];
    const isMapInteractionLocked =
        guideOpen ||
        showNpcDialog ||
        showMessenger ||
        step === 'contract' ||
        isBingeoFinishSequence ||
        isSidebarPanelOpen ||
        !!pendingItem ||
        !!eavesdropState ||
        isTransitioning;

    const handleSidebarPanelStateChange = useCallback((panelState) => {
        const isPanelOpen = !!panelState?.isOpen;
        const panelId = panelState?.panelId || null;
        setIsSidebarPanelOpen(isPanelOpen);

        if (!awaitingItem005InspectRef.current) return;

        if (isPanelOpen && panelId === 'inventory') {
            openedItem005InventoryRef.current = true;
            return;
        }

        if (!isPanelOpen && openedItem005InventoryRef.current) {
            awaitingItem005InspectRef.current = false;
            openedItem005InventoryRef.current = false;
            setStep('eavesdrop_tutorial');
            setGuideMessages([
                "누군가 창고 안에 있는 것 같습니다.",
                "2층 창고(storage_main) 문으로 가서 들리는 소리를 확인해보세요."
            ]);
            setGuideCallback(null);
            setGuideOpen(true);
        }
    }, []);

    const blockMoveByBingeo = () => {
        setCurrentScript([
            { speaker: '곽빙어', text: '어디가, 하던일은 마무리하고 가야지!', portrait: true }
        ]);
        setShowNpcDialog(true);
        setNpcDialogStep(0);
    };

    const handleItemInteraction = (zone) => {
        if (zone?.type !== 'item') return false;

        const itemId = zone.itemId || 'item010';
        if (currentInventory?.includes(itemId)) {
            // MainGame popup mode behavior: already-collected items do nothing.
            return true;
        }

        setPendingItem({ ...zone, itemId });
        return true;
    };

    const handleMapInteract = (zone) => {
        if (step === 'contract') return;
        if (guideOpen || showNpcDialog || showMessenger) return;

        if (handleItemInteraction(zone)) {
            return;
        }

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
                if (eavesdropAutoRef.current) {
                    clearTimeout(eavesdropAutoRef.current);
                    eavesdropAutoRef.current = null;
                }
                setEavesdropState('preview');
                // 시작 안내 후 1초 뒤에 자동 엿듣기 시작
                eavesdropAutoRef.current = setTimeout(() => {
                    setEavesdropState((prev) => {
                        if (prev !== 'preview') return prev;
                        runSimulatedEavesdrop(0, []);
                        return 'listening';
                    });
                }, 1000);
                return;
            }

            if (zone.type === 'move') {
                showGuide([
                    "지금은 먼저 좌측의 창고 문에서 엿듣기를 시도해야 합니다."
                ]);
                return;
            }

            if (zone.type === 'info') {
                showGuide([
                    "지금은 창고 문에서 들리는 소리를 확인하는 것이 우선입니다."
                ]);
                return;
            }
        }

        if (step === 'check_item005_inventory') {
            showGuide([
                "인벤토리를 열어 방금 획득한 '솔피의 눈물'을 확인해보세요.",
                "확인 후 인벤토리를 닫으면 다음 안내가 진행됩니다."
            ]);
            return;
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
            if (zone.type === 'move' && zone.target === 'storage_main') {
                showGuide([
                    "중요한 이야기 중인 것 같다. 지금은 곽빙어에게 돌아가자..."
                ]);
                return;
            }

            if (zone.type === 'move') {
                handleMoveInternal(zone.target);
                return;
            }

            if (zone.type === 'info') {
                showGuide([zone.message || "특별한 단서는 보이지 않는다."]);
                return;
            }

        }
    };

    const handleMenuNavigate = (targetRoomId) => {
        if (!targetRoomId) return;
        if (step === 'contract') return;
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

        if (step === 'check_item005_inventory' && targetRoomId !== currentRoomId) {
            showGuide([
                "이동하기 전에 인벤토리에서 '솔피의 눈물'을 먼저 확인해보세요."
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

        if (step === 'return_to_class' && targetRoomId === 'storage_main') {
            showGuide([
                "중요한 이야기 중인 것 같다. 지금은 곽빙어에게 돌아가자..."
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

        if (step === 'check_item005_inventory' && targetRoomId !== currentRoomId) {
            showGuide([
                "이동하기 전에 인벤토리에서 '솔피의 눈물'을 먼저 확인해보세요."
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

        if (step === 'return_to_class' && targetRoomId === 'storage_main') {
            showGuide([
                "중요한 이야기 중인 것 같다. 지금은 곽빙어에게 돌아가자..."
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
            setIsTransitioning(true);
            setTimeout(() => {
                setIsTransitioning(false);
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
            setIsTransitioning(true);
            setTimeout(() => {
                setIsTransitioning(false);
                showGuide([
                    "저기 테이블 위에 웰컴 드링크가 있네요. 클릭해서 획득해봅시다."
                ]);
            }, 1000);
        }

        if (step === 'return_to_class' && targetRoomId === 'umi_class') {
            setStep('npc_chat_tutorial');
            setIsTransitioning(true);
            setTimeout(() => {
                setIsTransitioning(false);
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
        if (!currentInventory?.includes('item004')) {
            addItem('item004');
        }
        setStep('hp_tutorial');

        setTimeout(() => {
            showGuide([
                "수상한 계약서가 인벤토리에 추가되었습니다.",
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
                setStep('check_item005_inventory');
                awaitingItem005InspectRef.current = true;
                openedItem005InventoryRef.current = false;
                showGuide([
                    "솔피의 눈물을 획득했습니다! 확인해 봅시다.",
                    "왼쪽 메뉴에서 인벤토리를 열어 아이템을 확인하세요.",
                    "튜토리얼 중에는 사용하기/제시하기가 비활성화됩니다."
                ]);
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
            text: '잘 왔어. 음료는 챙겼지?',
            type: 'active_npc'
        });
        setChatViewMode('mini');
    };

    const handleCancelChatHp = () => {
        setShowNpcChatHpWarning(false);
    };

    // Tutorial Chat Send Handler - 체험용 고정 스크립트 응답
    const handleTutorialChatSend = async () => {
        if ((!chatInputText.trim() && !presentedItem) || isChatThinking) return;
        if (step !== 'npc_chatting' && step !== 'correct_present' && step !== 'present_tutorial') return;

        const userMsg = chatInputText.trim();
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
        
        if (userMsg) {
            newLogs.push({
                id: Date.now() + '_user',
                speaker: 'You',
                text: userMsg,
                type: 'user'
            });
        }

        if (presentedItem) {
            newLogs.push({
                id: Date.now() + '_presentation',
                speaker: 'System',
                text: `${presentedItem.name}을(를) 제시했습니다.`,
                itemName: presentedItem.name,
                icon: presentedItem.icon,
                type: 'item_presentation'
            });
            clearPresentation();
        }

        setChatLogs(newLogs);
        setChatDialogContent(null);

        // 짧은 "생각 중" 딜레이 후 고정 응답
        await new Promise(resolve => setTimeout(resolve, 1200));

        // present_tutorial 상태: 처음으로 아이템을 제시받았을 때
        if (step === 'present_tutorial') {
            if (presentedItem && presentedItem.itemId === 'item005') {
                const presentResponse = '오, 잘했어. 이렇게 아이템을 NPC에게 제시할 수 있어. 뭐든 한마디 해봐.';
                setChatDialogContent({
                    speaker: '곽빙어',
                    text: presentResponse,
                    type: 'active_npc'
                });
                setIsChatThinking(false);

                setTimeout(() => {
                    setStep('correct_present');
                }, 2000);
            } else {
                const wrongResponse = '그건 아니야. 시식용 음료를 보여줘.';
                setChatDialogContent({
                    speaker: '곽빙어',
                    text: wrongResponse,
                    type: 'active_npc'
                });
                setIsChatThinking(false);

                setTimeout(() => {
                    showGuide([
                        "잘못된 아이템입니다. 다시 인벤토리를 열어 '솔피의 눈물'을 제시해보세요."
                    ]);
                    // step remains 'present_tutorial', which will auto-reopen the sidebar
                }, 2000);
            }
            if (presentedItem) clearPresentation();
            return;
        }

        // correct_present 상태: 올바른 제시 완료 후 이어지는 대화 → 사용 단계로 전환
        if (step === 'correct_present') {
            const finalResponse = '오케이, 이렇게 제시하는 거야. 자, 이제 인벤토리에서 솔피의 눈물을 마셔보자.';

            setChatDialogContent({
                speaker: '곽빙어',
                text: finalResponse,
                type: 'active_npc'
            });
            setIsChatThinking(false);

            setTimeout(() => {
                setStep('use_item_tutorial');
                showGuide([
                    "인벤토리를 열고 '솔피의 눈물'을 '사용'해봅시다."
                ]);
            }, 2000);
            return;
        }

        // npc_chatting 상태: 대화 체험(전송 완료) → 시스템 가이드 팝업 후 제시 단계로 전환
        if (step === 'npc_chatting') {
            setIsChatThinking(false);
            setChatLogs(newLogs);
            
            showGuide([
                "아래 채팅창에 대화를 입력해 NPC와 대화할 수 있습니다. 지금은 일단 연습만 해 봅시다.. 본편에서 실제로 대화해 볼 수 있습니다.",
                "'제시'도 해 봅시다."
            ], () => {
                setStep('present_tutorial');
            });
            return;
        }
    };

    const canToggleMenu = isMenuEnabled && !guideOpen && !showNpcDialog && !showMessenger && !eavesdropState;


    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
            {/* 0. 튜토리얼 스킵 프롬프트 */}
            <AnimatePresence mode="wait">
                {step === 'skip_prompt' && (
                    <Motion.div
                        key="skip_prompt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-6 p-8"
                    >
                        <Motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-white text-xl font-serif text-center tracking-wide"
                        >
                            튜토리얼을 진행하시겠습니까?
                        </Motion.p>
                        <Motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                            className="text-gray-400 text-sm text-center"
                        >
                            스킵 시 기본 아이템을 받고 바로 1일차로 진입합니다.
                        </Motion.p>
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="flex gap-4 mt-4"
                        >
                            <button
                                onClick={handlePlayTutorial}
                                className="px-8 py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-2xl text-base tracking-wide shadow-lg transition-colors"
                            >
                                튜토리얼 시작
                            </button>
                            <button
                                onClick={handleSkipTutorial}
                                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold rounded-2xl text-base tracking-wide shadow-lg transition-colors"
                            >
                                스킵
                            </button>
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>

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
                    {step !== 'intro' && step !== 'fadeout' && step !== 'fish_level_up' && step !== 'complete_notice' && (
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
                                        현재 방: 우미 클래스룸
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

                {step !== 'intro' && step !== 'fadeout' && step !== 'fish_level_up' && step !== 'complete_notice' && canToggleMenu && (
                    <IngameSidebarMenu
                        currentFloorId={currentFloorId}
                        currentRoomId={currentRoomId}
                        onNavigate={handleMenuNavigate}
                        disabledPanels={sidebarDisabledPanels}
                        inventoryUseDisabled={disableItemUseInInventory}
                        inventoryUseOnlyItemId={inventoryUseOnlyItemId}
                        onPanelStateChange={handleSidebarPanelStateChange}
                        forceOpen={step === 'present_tutorial' && !isSidebarPanelOpen && !presentedItem}
                        highlightedPanel={step === 'present_tutorial' && !presentedItem ? 'inventory' : null}
                    />
                )}

                {/* 계약서 체크/서명 단계 */}
                {step === 'contract' && (
                    <ContractModal
                        isOpen={true}
                        onClose={() => { }}
                        onSign={handleContractSigned}
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

                {/* AI 채팅 UI (npc_chatting, chat_bingeo_present 스텝 등) - GameHUD 적용 */}
                {['npc_chatting', 'chat_bingeo_present', 'present_tutorial', 'wrong_present', 'correct_present', 'use_item_tutorial'].includes(step) && (
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

                {/* Eavesdrop UI (Tutorial) */}
                {eavesdropState && (
                    <GameHUD
                        mapInfo={mapInfo}
                        activeNpc={null}
                        viewMode="full"
                        logs={eavesdropLogs}
                        dialogContent={eavesdropDialogContent}
                        isThinking={isEavesdropThinking}
                        inputPlaceholder="듣는 중입니다..."
                        inputForceDisabled={true}
                        showViewControls={false}
                        isSidebarVisible={isSidebarPanelOpen}
                        inputSlot={(
                            <div className="px-6 pt-3 pb-5 border-t border-white/10 bg-black/20 space-y-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {tutorialEavesdropParticipants.map((name, index) => (
                                        <span
                                            key={name}
                                            className={`px-2 py-0.5 rounded-full text-xs border ${getEavesdropColorStyle(index % EAVESDROP_MAX_COLOR_COUNT).chipClass}`}
                                        >
                                            {name}
                                        </span>
                                    ))}
                                </div>

                                <p className="text-xs text-gray-300">
                                    {eavesdropState === 'preview' && '대화를 불러오는 중입니다...'}
                                    {eavesdropState === 'listening' && `듣는 중입니다... (${eavesdropAutoIndex}/${EAVESDROP_SIMULATION_DATA.length})`}
                                    {eavesdropState === 'done' && '튜토리얼 엿듣기가 끝났습니다.'}
                                </p>
                                <p className="text-[11px] text-purple-200">
                                    본편에서는 엿듣기/끼어들기 선택이 가능합니다.
                                </p>

                                <button
                                    onClick={handleCloseEavesdrop}
                                    className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold text-white transition-colors"
                                >
                                    {eavesdropState === 'done' ? '닫기' : '그만 듣기'}
                                </button>
                            </div>
                        )}
                    />
                )}

                {/* NPC 대화 HP 경고 모달 (인라인 구현) */}
                {showNpcChatHpWarning && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-gray-900/95 border border-yellow-500/40 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-yellow-400 text-lg">⚠️</span>
                                <span className="text-sm font-bold text-yellow-300">대화 시작 확인</span>
                            </div>
                            <p className="text-sm text-gray-300 mb-1">
                                곽빙어와 대화를 시작하면 10 HP가 소모됩니다. (튜토리얼에서는 소모되지 않습니다.)<br />
                                대화가 끝날 때까지 이동과 다른 상호작용이 제한됩니다.
                            </p>
                            <p className="text-sm text-yellow-300 font-bold mb-4">소모 HP: 0 (튜토리얼)</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCancelChatHp}
                                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleConfirmChatHp}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition-colors"
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    </div>
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

                {/* 튜토리얼 완료 알림 */}
                {step === 'complete_notice' && (
                    <Motion.div
                        key="complete_notice"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2 }}
                        className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center gap-8 p-8"
                    >
                        <Motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="text-white text-2xl font-serif text-center tracking-wide"
                        >
                            지금부터 자유롭게 이동하며 말을 해 보세요!
                        </Motion.p>
                        <Motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2, duration: 0.8 }}
                            className="text-gray-400 text-sm text-center"
                        >
                            — 1일차 아침이 시작됩니다 —
                        </Motion.p>
                        <Motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2, duration: 0.6 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleCompleteAndStart}
                            className="mt-4 px-10 py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-2xl text-base tracking-wide shadow-lg transition-colors"
                        >
                            게임 시작
                        </Motion.button>
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
