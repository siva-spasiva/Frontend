import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import IntroSequence from './IntroSequence';
import GameStartSequence from './GameStartSequence';
import ItemPickupModal from '../components/ItemPickupModal';
import MessengerApp from '../components/apps/MessengerApp';

const TutorialScene = ({ onComplete }) => {
    // 튜토리얼 진행 상태: 'intro' -> 'outside' -> 'meet_npc' -> 'contract' -> 'drink' -> 'fadeout'
    const [step, setStep] = useState('intro');
    const { addItem, ITEMS, setDay, setPeriod, setCurrentLocationInfo } = useGame();

    // UI 로직 State
    const [showMessenger, setShowMessenger] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [messengerDisconnected, setMessengerDisconnected] = useState(false);
    const [logs, setLogs] = useState([]);

    // NPC 곽빙어 대화 상태
    const [showNpcDialog, setShowNpcDialog] = useState(false);
    const [npcDialogStep, setNpcDialogStep] = useState(0);

    // 이벤트 아이템 (솔피의 눈물) 모달
    const [pendingItem, setPendingItem] = useState(null);

    // 1. 인트로 완료 후 외부 도착
    const handleIntroComplete = () => {
        setStep('outside');
        setCurrentLocationInfo({ floorId: '1F', roomId: 'outside01' });

        setTimeout(() => {
            setShowNotification(true);
            setLogs(prev => [...prev, {
                id: Date.now(),
                speaker: 'System',
                text: '시스템: (안내) 섬에 도착했습니다. 리조트 건물로 이동 전, 동료와 통신을 확인하세요.',
                type: 'system'
            }]);
        }, 1500);
    };

    const handleOpenMessenger = () => {
        setShowNotification(false);
        setShowMessenger(true);
    };

    // 2. 강형사 대화 완료 (연락두절 후)
    useEffect(() => {
        if (step === 'outside' && messengerDisconnected) {
            // 연락 두절 3초 후 곽빙어 만남 이벤트 트리거
            const timer = setTimeout(() => {
                setShowMessenger(false);
                setStep('meet_npc_outside');
                setShowNpcDialog(true);
                setLogs(prev => [...prev, {
                    id: Date.now(),
                    speaker: 'System',
                    text: '안개 속에서 누군가 다가옵니다...',
                    type: 'system'
                }]);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step, messengerDisconnected]);

    // 3. 곽빙어 대화 스크립트 (외부)
    const npcScriptOutside = [
        { speaker: '?', text: '어휴, 배 끊겼다더니 또 누가 왔네.' },
        { speaker: '나', text: '누구시죠? 여기 직원인가요?' },
        { speaker: '곽빙어', text: '직원이라니, 나도 참가자야. 곽빙어라고 해.' },
        { speaker: '곽빙어', text: '밖에 서 있지 말고 일단 안으로 들어와. 입소하려면 서류 작업을 좀 해야 하니까.' }
    ];

    const handleNpcOutsideNext = () => {
        if (npcDialogStep < npcScriptOutside.length - 1) {
            setNpcDialogStep(prev => prev + 1);
        } else {
            // 대화 끝나면 실내로 이동 (화면 전환)
            setShowNpcDialog(false);
            setStep('classroom_transition');

            setTimeout(() => {
                setCurrentLocationInfo({ floorId: '1F', roomId: 'class01' });
                setStep('meet_npc_classroom');
                setNpcDialogStep(0);
                setShowNpcDialog(true);
            }, 2000);
        }
    };

    // 4. 곽빙어 실내 대화 스크립트
    const npcScriptClassroom = [
        { speaker: '곽빙어', text: '여기가 우리 교실이야. 다들 여기서 주로 시간을 보내지.' },
        { speaker: '곽빙어', text: '분위기 보니까 아직 아무것도 모르고 온 모양인데, 일단 이거부터 써.' },
        { speaker: '곽빙어', text: '입소하려면 꼭 써야 하는 ‘계약서’ 같은 거니까.' }
    ];

    const handleNpcClassroomNext = () => {
        if (npcDialogStep < npcScriptClassroom.length - 1) {
            setNpcDialogStep(prev => prev + 1);
        } else {
            // 대화 끝나면 계약서 작성 이벤트
            setShowNpcDialog(false);
            setStep('contract');
        }
    };

    // 5. 계약서 작성 완료
    const handleContractSigned = () => {
        setStep('after_contract');
        setShowNpcDialog(true);
        setNpcDialogStep(0);
    };

    // 6. 계약서 작성 후 웰컴 드링크 대화 (실내)
    const npcScriptAfterContract = [
        { speaker: '곽빙어', text: '빠르네. 이제 너도 정식 입소자야.' },
        { speaker: '곽빙어', text: '자, 그럼 입소 기념 웰컴 드링크 한 잔씩 하자고. 이거 마시면 피로가 싹 풀린대.' },
        { speaker: 'System', text: '(안내) 시스템 로그를 확인하여 아이템을 조작해보세요.' }
    ];

    const handleNpcAfterContractNext = () => {
        if (npcDialogStep < npcScriptAfterContract.length - 1) {
            setNpcDialogStep(prev => prev + 1);
        } else {
            setShowNpcDialog(false);
            // 아이템 획득 모달 띄우기 (솔피의 눈물 item003)
            setPendingItem('item003');
        }
    };

    // 7. 물약 마시고 페이드아웃 -> 다음날 내 방(B2_room01)에서 기상
    const handleDrinkItem = () => {
        addItem('item003'); // 우선 인벤토리에 넣고 쓰는 연출
        setPendingItem(null);
        setStep('fadeout');

        setTimeout(() => {
            setDay(1); // 1일차로 시작
            setPeriod('morning');
            setCurrentLocationInfo({ floorId: 'B2', roomId: 'room001' }); // 내 방에서 눈을 뜸
            onComplete(); // App.jsx로 넘겨서 MainGame 진입
        }, 3000);
    };

    const getBgImage = () => {
        if (step === 'outside' || step === 'meet_npc_outside' || step === 'classroom_transition') {
            return "bg-[url('/src/assets/map/1F_outside01.png')]";
        }
        return "bg-[url('/src/assets/map/1F_class01.png')]";
    };


    return (
        <div className="relative w-full h-screen bg-gray-900 overflow-hidden font-sans">
            <AnimatePresence mode="wait">
                {/* 1. 인트로 독백 */}
                {step === 'intro' && (
                    <motion.div key="intro" className="absolute inset-0 z-50">
                        <IntroSequence onComplete={handleIntroComplete} />
                    </motion.div>
                )}

                {/* 2. 배경 이미지 및 시스템 로그 */}
                {step !== 'intro' && step !== 'classroom_transition' && step !== 'fadeout' && (
                    <motion.div
                        key={step === 'outside' || step === 'meet_npc_outside' ? 'bg_outside' : 'bg_inside'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0"
                    >
                        <div className={`w-full h-full ${getBgImage()} bg-cover bg-center filter brightness-50`} />

                        {/* 시스템 로그 UI (가이드 역할) - 다른 UI와 겹치지 않도록 우측 상단으로 이동 */}
                        <div className="absolute top-4 right-4 max-w-sm bg-black/60 p-4 rounded-xl text-white text-sm max-h-48 overflow-y-auto z-10 pointer-events-none">
                            {logs.map((log, idx) => (
                                <p key={idx} className={log.type === 'system' ? 'text-yellow-400 font-bold mb-2' : 'mb-2'}>
                                    {log.text}
                                </p>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 알림 오버레이 */}
                {showNotification && (
                    <motion.div
                        key="notification"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="absolute inset-0 z-30 flex items-center justify-center bg-black/50"
                        onClick={handleOpenMessenger}
                    >
                        <motion.div
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="bg-green-500/90 text-white px-8 py-4 rounded-2xl flex items-center space-x-4 cursor-pointer hover:bg-green-500 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                        >
                            <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <div>
                                <h3 className="font-bold text-xl">새 메시지 도착</h3>
                                <p className="text-sm opacity-90">터치하여 확인하세요</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* 메신저 앱 (튜토리얼 좌측 분할 느낌) */}
                {showMessenger && (
                    <motion.div
                        key="messenger"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute left-0 top-0 w-1/3 h-full bg-white shadow-2xl z-20 border-r border-gray-300"
                    >
                        {/* Tutorial용 Messenger 모드로 연결. 
                            본 프론트엔드 코드의 MessengerApp.jsx의 isStartMode 기능을 켜줌 */}
                        <MessengerApp
                            isStartMode={true}
                            onBack={() => { }}
                            onComplete={() => { }} // contract trigger 대신 내부 플로우 사용
                        />
                        {/* 외부 App에서 Disconnect 이벤트를 감지하기 위해 임시 브릿지 */}
                        <MessengerDisconnectWatcher onDisconnect={() => setMessengerDisconnected(true)} />
                    </motion.div>
                )}

                {/* 3. 외부 대화창 */}
                {showNpcDialog && step === 'meet_npc_outside' && (
                    <motion.div
                        key="npc-dialog-outside"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-2/3 bg-black/80 text-white p-6 rounded-2xl border border-white/20 z-40 cursor-pointer"
                        onClick={handleNpcOutsideNext}
                    >
                        <h3 className="text-blue-400 font-bold mb-2 text-xl">{npcScriptOutside[npcDialogStep]?.speaker}</h3>
                        <p className="text-lg">{npcScriptOutside[npcDialogStep]?.text}</p>
                        <p className="text-xs text-gray-500 mt-4 text-right">(클릭하여 다음)</p>
                    </motion.div>
                )}

                {/* 4. 실내 대화창 */}
                {showNpcDialog && step === 'meet_npc_classroom' && (
                    <motion.div
                        key="npc-dialog-inside"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-2/3 bg-black/80 text-white p-6 rounded-2xl border border-white/20 z-40 cursor-pointer"
                        onClick={handleNpcClassroomNext}
                    >
                        <h3 className="text-blue-400 font-bold mb-2 text-xl">{npcScriptClassroom[npcDialogStep]?.speaker}</h3>
                        <p className="text-lg">{npcScriptClassroom[npcDialogStep]?.text}</p>
                        <p className="text-xs text-gray-500 mt-4 text-right">(클릭하여 다음)</p>
                    </motion.div>
                )}

                {/* 5. 입소 계약서 모달 */}
                {step === 'contract' && (
                    <motion.div
                        key="contract"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 z-50 p-8"
                    >
                        <GameStartSequence onSign={handleContractSigned} />
                    </motion.div>
                )}

                {/* 6. 계약서작성 후 2층 안내 대화창 */}
                {showNpcDialog && step === 'after_contract' && (
                    <motion.div
                        key="npc-dialog-after"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-2/3 bg-black/80 text-white p-6 rounded-2xl border border-white/20 z-40 cursor-pointer"
                        onClick={handleNpcAfterContractNext}
                    >
                        <h3 className="text-blue-400 font-bold mb-2 text-xl">{npcScriptAfterContract[npcDialogStep]?.speaker}</h3>
                        <p className="text-lg">{npcScriptAfterContract[npcDialogStep]?.text}</p>
                        <p className="text-xs text-gray-500 mt-4 text-right">(클릭하여 다음)</p>
                    </motion.div>
                )}

                {/* 7. 실내 이동 전환 화면 */}
                {step === 'classroom_transition' && (
                    <motion.div
                        key="transition"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center"
                    />
                )}

                {/* 8. 아이템 모달 및 페이드아웃 */}
                {pendingItem && (
                    <ItemPickupModal
                        isOpen={true}
                        item={ITEMS[pendingItem] || { name: '솔피의 눈물', description: '푸른 빛이 도는 정체불명의 액체.' }}
                        onClose={() => setPendingItem(null)}
                        onCollect={handleDrinkItem}
                    />
                )}

                {/* 9. 암전 (시간 경과 / 다음 날 전환) */}
                {step === 'fadeout' && (
                    <motion.div
                        key="fadeout"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2 }}
                        className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center"
                    >
                        <p className="text-white text-xl font-serif">...정신이 아득해진다...</p>
                    </motion.div>
                )}

            </AnimatePresence>
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
