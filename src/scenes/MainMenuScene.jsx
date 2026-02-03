import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, Video, Info, User, ChevronLeft, Play, Save, Settings, FileText, Grid, MessageCircle, Search, Edit, Camera, MoreHorizontal, Bell, Map, Mic } from 'lucide-react';

// --- Components ---

const PhoneFrame = ({ children, header, isBroken }) => {
    return (
        <div className="w-full h-full flex items-center justify-center font-sans">
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className={`w-full max-w-sm h-[95vh] max-h-[800px] bg-white rounded-[3rem] shadow-2xl border-8 overflow-hidden relative flex flex-col transition-all duration-500 ${isBroken ? 'border-gray-800' : 'border-gray-900'}`}
                style={isBroken ? { boxShadow: '0 0 20px rgba(0,0,0,0.8)' } : {}}
            >
                {/* Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-30"></div>

                {/* Cracks & Damage Overlays */}
                {isBroken && (
                    <div className="absolute inset-0 z-40 pointer-events-none">
                        {/* Spiderweb Crack Top-Right */}
                        <svg className="absolute top-0 right-0 w-full h-full opacity-60 mix-blend-overlay pointer-events-none" viewBox="0 0 400 800">
                            <path d="M400,0 L320,80 L350,120 L300,150" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none" filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.5))" />
                            <path d="M320,80 L250,50" stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" />
                            <path d="M320,80 L280,120" stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" />
                            <path d="M350,120 L400,180" stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" />

                            {/* Bottom Cracks - Intensified */}
                            <path d="M0,800 L200,600 L100,500" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="none" filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.7))" />
                            <path d="M200,600 L300,650 L400,620" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" />
                            <path d="M200,600 L250,550" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none" />
                            <path d="M100,500 L50,450" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />

                            {/* Crossing Crack */}
                            <path d="M0,300 L400,400" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" fill="none" />
                        </svg>

                        {/* Screen Glare / Dirt */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.2),transparent_40%)] mix-blend-hard-light"></div>

                        {/* Scanlines / Interference - Flickering */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.15)_3px)] pointer-events-none animate-pulse"></div>
                    </div>
                )}

                {/* Content */}
                <div
                    className={`flex-1 flex flex-col relative bg-gray-50 overflow-hidden transition-all duration-500`}
                    style={isBroken ? {
                        filter: 'contrast(1.2) brightness(0.85) grayscale(0.4) blur(0.6px)',
                        transform: 'scale(1.005)' // Subtle zoom to feel 'off'
                    } : {}}
                >
                    {children}

                    {/* Color Channel Split (Chromatic Aberration Simulation) for Broken State - simplified overlay */}
                    {isBroken && (
                        <div className="absolute inset-0 bg-red-500 mix-blend-screen opacity-10 pointer-events-none translate-x-[1px]"></div>
                    )}
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full z-30"></div>
            </motion.div>
        </div>
    );
};

const AppIcon = ({ icon: Icon, label, color, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex flex-col items-center space-y-2 p-4"
    >
        <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-md text-white`}>
            <Icon className="w-8 h-8" />
        </div>
        <span className="text-xs font-medium text-gray-700">{label}</span>
    </motion.button>
);

const MessengerLoading = ({ onLoaded }) => {
    useEffect(() => {
        const timer = setTimeout(onLoaded, 2000);
        return () => clearTimeout(timer);
    }, [onLoaded]);

    return (
        <div className="w-full h-full bg-white flex flex-col items-center justify-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 text-white shadow-xl"
            >
                <MessageCircle className="w-12 h-12" />
            </motion.div>
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
            >
                MESSENGER
            </motion.h2>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-10"
            >
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </motion.div>
        </div>
    );
};

const ChatListScreen = ({ onChatSelect }) => {
    const [notification, setNotification] = useState(null);
    const [messagesArrived, setMessagesArrived] = useState(false);

    useEffect(() => {
        // Simulate message arrival delay
        const timer = setTimeout(() => {
            setMessagesArrived(true);
            setNotification({
                sender: 'Friend_A',
                text: '야 이거 봐! 대박임 ㅋㅋ'
            });
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-full h-full bg-white flex flex-col pt-12">
            {/* Header */}
            <div className="px-4 pb-4 flex justify-between items-center bg-white z-10">
                <h1 className="text-2xl font-bold">Chats</h1>
                <div className="flex space-x-4 text-gray-900">
                    <Camera className="w-6 h-6" />
                    <Edit className="w-6 h-6" />
                </div>
            </div>

            {/* Search */}
            <div className="px-4 mb-4">
                <div className="bg-gray-100 rounded-xl flex items-center p-2 text-gray-500 space-x-2">
                    <Search className="w-4 h-4" />
                    <span className="text-sm">Search</span>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4">
                {/* Active Users (Stories) */}
                <div className="flex space-x-4 mb-6 overflow-x-auto scrollbar-hide">
                    <div className="flex flex-col items-center space-y-1">
                        <div className="w-14 h-14 bg-gray-100 rounded-full border-2 border-white ring-2 ring-gray-200 flex items-center justify-center">
                            <span className="text-xl">+</span>
                        </div>
                        <span className="text-xs text-gray-500">Your Story</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <motion.div
                        className={`flex items-center space-x-3 p-2 rounded-xl active:bg-gray-50 cursor-pointer transition-colors ${messagesArrived ? 'bg-blue-50/50' : ''}`}
                        onClick={messagesArrived ? onChatSelect : null}
                    >
                        <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full p-[2px]">
                                <div className="w-full h-full bg-white rounded-full p-[2px]">
                                    <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                                        <User className="w-8 h-8 text-gray-500" />
                                    </div>
                                </div>
                            </div>
                            {messagesArrived && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-semibold ${messagesArrived ? 'text-black' : 'text-gray-800'}`}>친구 A</span>
                                <span className="text-xs text-gray-400">{messagesArrived ? 'Just now' : 'Yesterday'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={`text-sm truncate max-w-[180px] ${messagesArrived ? 'font-bold text-black' : 'text-gray-400'}`}>
                                    {messagesArrived ? '야 이거 봐! 대박임 ㅋㅋ' : 'Sent a photo.'}
                                </span>
                                {messagesArrived && (
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">1</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-3 flex items-center space-x-3 z-50 border border-gray-100 cursor-pointer"
                        onClick={onChatSelect}
                    >
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            <User className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-bold text-gray-900">{notification.sender}</span>
                                <span className="text-xs text-gray-500">now</span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{notification.text}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const MainMenu = ({ onAppOpen }) => {
    return (
        <div className="w-full h-full flex flex-col pt-12 px-6">
            {/* Status Bar Placeholder */}
            <div className="flex justify-between items-center text-xs font-semibold text-gray-800 mb-8 px-2">
                <span>9:41</span>
                <div className='flex space-x-1'>
                    <span>5G</span>
                    <span>100%</span>
                </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-10 px-2">Home</h1>

            <div className="grid grid-cols-4 gap-4">
                <AppIcon icon={Play} label="Start" color="bg-blue-500" onClick={() => onAppOpen('loading')} />
                <AppIcon icon={Save} label="Load" color="bg-green-500" onClick={() => { }} />
                <AppIcon icon={Settings} label="Settings" color="bg-gray-500" onClick={() => { }} />
                <AppIcon icon={FileText} label="Credits" color="bg-purple-500" onClick={() => { }} />
                <AppIcon icon={Grid} label="Test01" color="bg-indigo-600" onClick={() => onAppOpen('test01')} />
                <AppIcon icon={Grid} label="Test02" color="bg-pink-600" onClick={() => onAppOpen('test02')} />
                <AppIcon icon={Grid} label="Test03" color="bg-cyan-600" onClick={() => onAppOpen('test03')} />
                <AppIcon icon={Grid} label="Test04" color="bg-orange-600" onClick={() => onAppOpen('test04')} />
                {/* Dummies to fill space if needed, or leave empty */}
            </div>
        </div>
    );
};

const ChatScreen = ({ onNext }) => {
    const [messages, setMessages] = useState([]);
    const [showChoices, setShowChoices] = useState(true);

    useEffect(() => {
        // Initial messages flow in quickly to simulate "just opened"
        const initialMsgs = [
            { id: 1, sender: 'Friend_A', text: '야 이거 봐! 대박임 ㅋㅋ', type: 'text', time: '오후 2:01' },
            { id: 2, sender: 'Friend_A', text: '바다 뷰 무료 꽃꽂이 클래스 당첨됨! 너랑 나랑 2명임', type: 'text', time: '오후 2:01' },
            { id: 3, sender: 'Friend_A', text: '솔피 리조트라고 새로 생긴 데라는데 시설 쩐대. 가자 제발 ㅠㅠ', type: 'text', time: '오후 2:02' },
        ];

        let delay = 0;
        initialMsgs.forEach((msg, index) => {
            setTimeout(() => {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }, delay);
            delay += 800; // Staggered arrival
        });

    }, []);

    const handleChoice = (choice) => {
        setShowChoices(false);
        const myReply = { id: 4, sender: 'Me', text: choice.text, type: 'text', time: '오후 2:03' };
        setMessages(prev => [...prev, myReply]);

        if (choice.action === 'accept') {
            setTimeout(() => {
                setMessages(prev => [...prev, { id: 5, sender: 'Friend_A', text: '나이스!! 내가 예약할게 ㄱㄱ', type: 'text', time: '오후 2:03' }]);
                setTimeout(onNext, 2000);
            }, 500);
        } else {
            setTimeout(() => {
                const reply = choice.action === 'reject'
                    ? '아 제발... 혼자 가기 무섭단 말이야 같이 가주라 ㅠㅠ'
                    : '야 요즘 홍보차원에서 다 그래! 속고만 살았냐?';
                setMessages(prev => [...prev, { id: 5, sender: 'Friend_A', text: reply, type: 'text', time: '오후 2:04' }]);

                setTimeout(() => {
                    setMessages(prev => [...prev, { id: 6, sender: 'Me', text: '알았어... 가보자.', type: 'text', time: '오후 2:04' }]);
                    setTimeout(() => {
                        setMessages(prev => [...prev, { id: 7, sender: 'Friend_A', text: '역시 내 친구!! 고고싱', type: 'text', time: '오후 2:04' }]);
                        setTimeout(onNext, 2000);
                    }, 1000);
                }, 1500);
            }, 800);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="bg-white pt-10 pb-2 px-4 border-b flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center space-x-2">
                    <ChevronLeft className="w-6 h-6 text-black" />
                    <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full p-[2px]">
                        <div className="w-full h-full bg-white rounded-full p-[2px]">
                            <div className="w-full h-full bg-gray-300 rounded-full overflow-hidden">
                                <User className="w-full h-full text-gray-500 p-1" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">친구 A</span>
                        <span className="text-xs text-gray-500">Active Now</span>
                    </div>
                </div>
                <div className="flex space-x-3 text-black">
                    <Phone className="w-6 h-6" />
                    <Video className="w-6 h-6" />
                    <Info className="w-6 h-6" />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scrollbar-hide">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.sender === 'Me' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.sender === 'Friend_A' && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex-shrink-0 self-end mb-1 overflow-hidden">
                                    <User className="w-full h-full text-gray-500 p-1" />
                                </div>
                            )}
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${msg.sender === 'Me'
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-gray-100 text-black rounded-bl-none border border-gray-200'
                                }`}>
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {/* Choices overlay */}
                {showChoices && messages.length >= 3 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 space-y-2 p-2"
                    >
                        <p className="text-xs text-center text-gray-400 mb-2">회신 보내기</p>
                        <button onClick={() => handleChoice({ text: "귀찮아. 그냥 너 혼자 가.", action: 'reject' })} className="w-full p-3 bg-gray-50 rounded-xl text-sm border border-gray-200 hover:bg-gray-100 text-left">
                            😒 귀찮아. 그냥 너 혼자 가.
                        </button>
                        <button onClick={() => handleChoice({ text: "무료? 좀 수상한데...", action: 'suspect' })} className="w-full p-3 bg-gray-50 rounded-xl text-sm border border-gray-200 hover:bg-gray-100 text-left">
                            🤔 무료? 좀 수상한데...
                        </button>
                        <button onClick={() => handleChoice({ text: "그래, 바람이나 쐬자.", action: 'accept' })} className="w-full p-3 bg-blue-50 text-blue-600 font-semibold rounded-xl text-sm border border-blue-100 hover:bg-blue-100 text-left">
                            ✨ 그래, 바람이나 쐬자.
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Input Area (Fake) */}
            <div className="p-3 border-t bg-white flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <div className="flex-1 h-9 bg-gray-100 rounded-full px-4 text-xs flex items-center text-gray-400">
                    메시지 보내기...
                </div>
                <Send className="w-6 h-6 text-gray-300" />
            </div>
        </div>
    );
};

import { IngameHomeScreen, Ingame02HomeScreen, Ingame03HomeScreen } from '../components/PhoneHomeScreens';
import MapApp from '../components/MapApp';


const MainMenuScene = ({ onNext, onTestStart, onTest02Start, onTest03Start, onTest04Start, currentPhase }) => {
    const [internalPhase, setInternalPhase] = useState('menu'); // 'menu' | 'loading' | 'list' | 'chat' | 'ingame_home' | 'ingame02_home' | 'ingame03_home' | 'map_app'

    useEffect(() => {
        if (currentPhase === 'mainGame') {
            setInternalPhase('ingame_home');
        } else if (currentPhase === 'test02') {
            setInternalPhase('ingame02_home');
        } else if (currentPhase === 'test03') {
            setInternalPhase('ingame03_home');
        }
    }, [currentPhase]);

    const handleAppOpen = (appName) => {
        if (appName === 'test01') {
            onTestStart && onTestStart();
        } else if (appName === 'test02') {
            onTest02Start && onTest02Start();
        } else if (appName === 'test03') {
            onTest03Start && onTest03Start();
        } else if (appName === 'test04') {
            onTest04Start && onTest04Start();
        } else if (appName === 'umi_class') { // Alias for test03
            onTest03Start && onTest03Start();
        } else {
            setInternalPhase(appName);
        }
    };

    const isBroken = currentPhase === 'test02';

    return (
        <PhoneFrame isBroken={isBroken}>
            <AnimatePresence mode="wait">
                {internalPhase === 'menu' && (
                    <motion.div
                        key="menu"
                        className="w-full h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <MainMenu onAppOpen={handleAppOpen} />
                    </motion.div>
                )}

                {internalPhase === 'ingame_home' && (
                    <motion.div
                        key="ingame_home"
                        className="w-full h-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <IngameHomeScreen onAppOpen={handleAppOpen} onBack={() => setInternalPhase('menu')} />
                    </motion.div>
                )}

                {internalPhase === 'ingame02_home' && (
                    <motion.div
                        key="ingame02_home"
                        className="w-full h-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Ingame02HomeScreen onAppOpen={handleAppOpen} onBack={() => setInternalPhase('menu')} />
                    </motion.div>
                )}

                {internalPhase === 'ingame03_home' && (
                    <motion.div
                        key="ingame03_home"
                        className="w-full h-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Ingame03HomeScreen onAppOpen={handleAppOpen} onBack={() => setInternalPhase('menu')} />
                    </motion.div>
                )}

                {internalPhase === 'map_app' && (
                    <motion.div
                        key="map_app"
                        className="w-full h-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <MapApp
                            currentFloorId={currentPhase === 'test02' ? 'B2' : (currentPhase === 'test03' ? '1F' : 'B4')}
                            onNavigate={handleAppOpen}
                            onBack={() => {
                                // Return to appropriate home screen based on currentPhase
                                if (currentPhase === 'test02') setInternalPhase('ingame02_home');
                                else if (currentPhase === 'test03') setInternalPhase('ingame03_home');
                                else setInternalPhase('ingame_home');
                            }}
                        />
                    </motion.div>
                )}

                {internalPhase === 'loading' && (
                    <motion.div
                        key="loading"
                        className="w-full h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <MessengerLoading onLoaded={() => setInternalPhase('list')} />
                    </motion.div>
                )}

                {internalPhase === 'list' && (
                    <motion.div
                        key="list"
                        className="w-full h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <ChatListScreen onChatSelect={() => setInternalPhase('chat')} />
                        {/* Floating Back Button for List Screen if needed, though usually Home button handles it */}
                        <button
                            onClick={() => setInternalPhase('menu')}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-black/20 rounded-full z-50 hover:bg-black/40 transition-colors"
                        ></button>
                    </motion.div>
                )}

                {internalPhase === 'chat' && (
                    <motion.div
                        key="chat"
                        className="w-full h-full"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <ChatScreen onNext={onNext} />
                    </motion.div>
                )}
            </AnimatePresence>
        </PhoneFrame>
    );
};

export default MainMenuScene;
