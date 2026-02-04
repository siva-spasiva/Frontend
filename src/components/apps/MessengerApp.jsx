import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, Video, Info, User, ChevronLeft, Camera, Search, Edit, MessageCircle } from 'lucide-react';

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
};

const ChatScreen = ({ onNext, onBack }) => {
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
                    <button onClick={onBack}>
                        <ChevronLeft className="w-6 h-6 text-black" />
                    </button>
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

const MessengerApp = ({ onComplete, onBack }) => {
    // phase: 'loading' | 'list' | 'chat'
    const [phase, setPhase] = useState('loading');

    useEffect(() => {
        // Reset to loading when mounted? No, default state is fine.
    }, []);

    return (
        <AnimatePresence mode="wait">
            {phase === 'loading' && (
                <motion.div
                    key="loading"
                    className="w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <MessengerLoading onLoaded={() => setPhase('list')} />
                </motion.div>
            )}

            {phase === 'list' && (
                <motion.div
                    key="list"
                    className="w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <ChatListScreen onChatSelect={() => setPhase('chat')} />
                    {/* Home Indicator mimicking safe area */}
                    <button
                        onClick={onBack}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-black/20 rounded-full z-50 hover:bg-black/40 transition-colors"
                    ></button>
                </motion.div>
            )}

            {phase === 'chat' && (
                <motion.div
                    key="chat"
                    className="w-full h-full"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <ChatScreen onNext={onComplete} onBack={() => setPhase('list')} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MessengerApp;
