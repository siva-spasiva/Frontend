import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, Video, Info, User, ChevronLeft, Camera, Search, Edit, MessageCircle, FileText, PenTool, X } from 'lucide-react';
import { sendChatMessage } from '../../api/chat';
import { useGame } from '../../context/GameContext';

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

const ChatListScreen = ({ onChatSelect, messages, isAnimated, onAnimationComplete, isDisconnected }) => {
    const [notification, setNotification] = useState(null);

    // If it was already animated, we show the list immediately as "arrived"
    const [messagesArrived, setMessagesArrived] = useState(isAnimated);

    useEffect(() => {
        if (isAnimated) return;

        const timer = setTimeout(() => {
            setMessagesArrived(true);
            setNotification({
                sender: '강 형사',
                text: '야, 본부에서 아직도 안 믿어주는 눈치다.'
            });
            onAnimationComplete();
        }, 1500);
        return () => clearTimeout(timer);
    }, [isAnimated, onAnimationComplete]);

    // Get last message for preview
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const previewText = lastMessage ? lastMessage.text : 'Sent a photo.';
    const timeDisplay = lastMessage ? (lastMessage.time === 'Now' ? 'Just now' : lastMessage.time) : 'Yesterday';

    return (
        <div className="w-full h-full bg-white flex flex-col pt-12 text-gray-900">
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
                            {messagesArrived && !isDisconnected && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                            {isDisconnected && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-400 rounded-full border-2 border-white"></div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-semibold ${messagesArrived ? 'text-black' : 'text-gray-800'}`}>강 형사</span>
                                <span className="text-xs text-gray-400">{messagesArrived ? timeDisplay : 'Yesterday'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={`text-sm truncate max-w-[180px] ${messagesArrived ? 'font-bold text-black' : 'text-gray-400'}`}>
                                    {messagesArrived ? previewText : 'Sent a photo.'}
                                </span>
                                {messagesArrived && (
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">1</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div >

            {/* Notification Toast */}
            < AnimatePresence >
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
            </AnimatePresence >
        </div >
    );
};

const ChatScreen = ({ messages, setMessages, onBack, onTriggerContract, isDisconnected, setIsDisconnected }) => {
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    // isDisconnected is now a prop
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue;
        setInputValue("");

        // Add User Message
        const userMsg = { id: Date.now(), sender: 'Me', text: userText, type: 'text', time: 'Now' };
        setMessages(prev => [...prev, userMsg]);

        // If disconnected, show error immediately and return
        if (isDisconnected) {
            setTimeout(() => {
                setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'System', text: '메시지를 전송할 수 없습니다. (연결 끊김)', type: 'system', time: 'Now' }]);
            }, 500);
            return;
        }

        setIsLoading(true);

        try {
            // Call AI
            const data = await sendChatMessage(userText, 'detective_kang');
            const aiText = data.response;

            const aiMsg = { id: Date.now() + 1, sender: '강 형사', text: aiText, type: 'text', time: 'Now' };
            setMessages(prev => [...prev, aiMsg]);

            // Check trigger condition
            // IF we haven't triggered yet
            const isContractPhase = messages.length >= 2; // Trigger faster for testing

            if (isContractPhase) {
                setTimeout(() => {
                    onTriggerContract(); // Fires global event, Scene shows contract

                    // Start Special Contract Dialogue Sequence
                    setTimeout(() => {
                        setMessages(prev => [...prev, { id: Date.now() + 2, sender: '강 형사', text: '잠깐, 그 계약서 뭐야? 뻐끔뻐끔? 그게 무슨 소리야?', type: 'text', time: 'Now' }]);

                        // Signal Loss Effect
                        setTimeout(() => {
                            setMessages(prev => [...prev, { id: Date.now() + 3, sender: 'System', text: '통신 상태가 불안정합니다. 연결이 종료됩니다.', type: 'system', time: 'Now' }]);
                            setIsDisconnected(true); // Set Disconnected State
                        }, 2000);
                    }, 2000);
                }, 1000);
            }

        } catch (error) {
            console.error("Chat Error:", error);
            const fallbackMsg = { id: Date.now() + 1, sender: '강 형사', text: '...치직... 본부... 응답하라...', type: 'text', time: 'Now' };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white text-gray-900">
            {/* Header */}
            <div className="bg-white pt-10 pb-2 px-4 border-b flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center space-x-2">
                    <button onClick={onBack}>
                        <ChevronLeft className="w-6 h-6 text-black" />
                    </button>
                    <div className="w-8 h-8 bg-gradient-to-tr from-blue-800 to-slate-900 rounded-full p-[2px]">
                        <div className="w-full h-full bg-white rounded-full p-[2px]">
                            <div className="w-full h-full bg-gray-300 rounded-full overflow-hidden">
                                <User className="w-full h-full text-gray-500 p-1" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">강 형사 (동료)</span>
                        <span className={`text-xs font-bold ${isDisconnected ? 'text-gray-500' : 'text-green-600'}`}>
                            {isDisconnected ? '● 연결 끊김' : '● 보안 연결됨'}
                        </span>
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
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === 'Me' ? 'justify-end' : ((msg.type === 'system' || msg.sender === 'system' || msg.sender === 'security_bot') ? 'justify-center w-full my-2' : 'justify-start w-full my-1')}`}
                    >
                        {(msg.type === 'system' || msg.sender === 'system' || msg.sender === 'security_bot') ? (
                            <div className="bg-gray-100 text-gray-500 text-xs px-4 py-1 rounded-full border border-gray-200 shadow-sm flex items-center space-x-1">
                                {msg.text.includes('연결') && <div className="w-2 h-2 rounded-full bg-gray-400 mr-1" />}
                                <span>{msg.text}</span>
                            </div>
                        ) : (
                            <>
                                {msg.sender !== 'Me' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex-shrink-0 self-end mb-1 overflow-hidden">
                                        <User className="w-full h-full text-gray-500 p-1" />
                                    </div>
                                )}
                                <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${msg.sender === 'Me'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-black rounded-bl-none border border-gray-200'
                                    }`}>
                                    {msg.text}
                                </div>
                            </>
                        )}
                    </motion.div>
                ))}
                {isLoading && (
                    <motion.div className="flex justify-start">
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex-shrink-0 self-end mb-1 overflow-hidden">
                            <User className="w-full h-full text-gray-500 p-1" />
                        </div>
                        <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-none border border-gray-200">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t bg-white flex items-center space-x-2">
                <input
                    type="text"
                    className="flex-1 h-10 bg-gray-100 rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="메시지 보내기..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    className={`p-2 rounded-full transition-colors ${inputValue.trim() ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}
                    disabled={!inputValue.trim() || isLoading}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const ContractPhase = ({ onComplete }) => {
    const { addItem } = useGame();
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [notification, setNotification] = useState(null);
    const [canSign, setCanSign] = useState(false);

    // Mini Chat State
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const overlayRef = useRef(null);

    // Initial Trigger: "Suspicious"
    useEffect(() => {
        const timer = setTimeout(() => {
            setNotification({
                sender: 'Friend_A',
                text: '야 이상한 뻐끔뻐끔 계약서인데?'
            });
        }, 2000); // 2s after opening contract
        return () => clearTimeout(timer);
    }, []);

    const openOverlay = () => {
        setOverlayOpen(true);
        setNotification(null);
        // Start conversation
        if (messages.length === 0) {
            setMessages([{ id: 1, sender: 'Friend_A', text: '야 이상한 뻐끔뻐끔 계약서인데?', type: 'text', time: 'Now' }]);
        }
    };

    const handleOverlaySend = async () => {
        if (!inputValue.trim() || isLoading) return;
        const userText = inputValue;
        setInputValue("");

        const userMsg = { id: Date.now(), sender: 'Me', text: userText, type: 'text', time: 'Now' };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // Check if this is the "final" turn
            const userTurnCount = messages.filter(m => m.sender === 'Me').length + 1;

            let aiText = "";

            if (userTurnCount >= 3) {
                // Force final script
                aiText = "별거 없겠지. 웰컴드링크 빨리 받으러 가자!";
                setCanSign(true);
            } else {
                // Dynamic Chat
                const data = await sendChatMessage(userText, 'friend_a');
                aiText = data.response;
            }

            const aiMsg = { id: Date.now() + 1, sender: 'Friend_A', text: aiText, type: 'text', time: 'Now' };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'Friend_A', text: '??', type: 'text', time: 'Now' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSign = () => {
        // Add to inventory
        addItem('item004'); // Suspicious Contract
        // Animation & Blackout
        onComplete();
    };

    return (
        <div className="relative w-full h-full bg-gray-900 overflow-hidden flex flex-col">
            {/* Contract Visual */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-[#fdfbf7] min-h-[600px] p-8 shadow-2xl relative text-gray-800 font-serif"
                    style={{ backgroundImage: 'linear-gradient(#e8e8e8 1px, transparent 1px)', backgroundSize: '100% 24px' }}
                >
                    <div className="w-16 h-16 border-4 border-red-800 rounded-full absolute top-10 right-10 opacity-20 rotate-12 flex items-center justify-center">
                        <span className="text-xs font-bold text-red-800 uppercase transform -rotate-12">Confidential</span>
                    </div>

                    <h2 className="text-3xl font-bold text-center mb-8 border-b-2 border-black pb-4">AGREEMENT</h2>

                    <div className="space-y-4 text-sm leading-relaxed opacity-80" style={{ filter: 'blur(0.4px)' }}>
                        <p>제 1조 [목적] 본 계약은 '솔피 리조트' (이하 "갑")와 방문객 (이하 "을") 사이의 영에 귀속된 권리를 규정함에 있다.</p>
                        <p>제 2조 [뻐끔] "을"은 시설 내에서 발생하는 모든 <span className="font-bold text-red-700">뻐끔뻐끔</span> 현상에 대해 이의를 제기하지 아니한다.</p>
                        <p>제 3조 [서명] 본 서명은 "을"의 자유 의지에 의한 것이며, 이후 발생하는 신체적 변이는 자연스러운 진화의 과정으로 간주한다.</p>
                        <div className="my-8 h-px bg-gray-300"></div>
                        <p className="font-mono text-xs">SECTION 4.2: THE FISH EYES ARE WATCHING.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
                    </div>

                    {/* Sign Area */}
                    <div className="mt-12 flex flex-col items-end space-y-2">
                        <div className="w-48 border-b-2 border-black"></div>
                        <span className="text-sm font-bold">서명 (Signature)</span>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Interaction Area */}
            <div className="p-4 bg-gray-900 border-t border-gray-800 z-20">
                <button
                    onClick={handleSign}
                    disabled={!canSign}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all ${canSign
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <PenTool className="w-6 h-6" />
                    <span>{canSign ? "서명 완료 (SIGN)" : "계약서 확인 중..."}</span>
                </button>
            </div>

            {/* Notification */}
            <AnimatePresence>
                {notification && !overlayOpen && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute top-10 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 rounded-xl shadow-xl flex items-center space-x-3 cursor-pointer z-50 hover:bg-white/20 transition-colors"
                        onClick={openOverlay}
                    >
                        <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full p-[2px]">
                                <img src="/api/placeholder/48/48" alt="" className="w-full h-full rounded-full bg-gray-300" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
                        </div>
                        <div>
                            <p className="font-bold text-sm">친구 A</p>
                            <p className="text-sm opacity-90">{notification.text}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Overlay */}
            <AnimatePresence>
                {overlayOpen && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: "30%" }} // Partially covering
                        exit={{ y: "100%" }}
                        className="absolute inset-0 z-40 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col pb-4"
                    >
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl" onClick={() => canSign && setOverlayOpen(false)}>
                            <div className="flex items-center space-x-2">
                                <span className="font-bold text-gray-800">친구 A</span>
                            </div>
                            <button onClick={() => setOverlayOpen(false)} className="p-2 bg-gray-200 rounded-full">
                                <X className="w-4 h-4 text-black" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'Me' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'Me' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && <div className="text-xs text-gray-400">Typing...</div>}
                            <div ref={overlayRef} />
                        </div>

                        <div className="px-4 pt-2">
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-full p-2">
                                <input
                                    className="flex-1 bg-transparent px-2 text-sm focus:outline-none text-black"
                                    placeholder="Reply based on the contract..."
                                    value={inputValue}
                                    onChange={e => e.target.value.length <= 50 && setInputValue(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleOverlaySend()}
                                />
                                <button onClick={handleOverlaySend} className="p-2 bg-blue-500 rounded-full text-white">
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            {canSign && (
                                <p className="text-center text-xs text-green-600 mt-2 font-bold cursor-pointer" onClick={() => setOverlayOpen(false)}>
                                    대화가 마무리되었습니다. (탭하여 닫기)
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MessengerApp = ({ onComplete, onBack, initialMessages }) => {
    // phase: 'loading' | 'list' | 'chat'
    // NOTE: 'contract' phase is now handled globally by Test04Scene (Split Screen). 
    // The Messenger stays in 'chat' mode.
    const [phase, setPhase] = useState('loading');
    const { triggerAppEvent } = useGame();

    // --- LIFTED STATE ---
    const [messages, setMessages] = useState([]);
    const [isDisconnected, setIsDisconnected] = useState(false); // Lifted state
    const [isListAnimated, setIsListAnimated] = useState(false); // Track if initial animation is done

    const { chatLogs, setChatLogs, inventoryItems } = useGame();

    // Check for "Suspicious Contract" or "Enlightenment Contract" (item004 or item020)
    // If user has these, it means they completed the intro sequence.
    const hasContract = inventoryItems.some(item => item.id === 'item004' || item.id === 'item020');

    // Initialize messages
    useEffect(() => {
        if (initialMessages) {
            setMessages(initialMessages);
            setIsListAnimated(true);
        } else if (chatLogs && chatLogs.length > 0) {
            // Restore from context
            console.log("Restoring chat logs from context:", chatLogs);
            setMessages(chatLogs);
            setIsListAnimated(true); // Skip animation
        } else if (messages.length === 0) {
            // New Game Start (Tutorial not done yet)
            // Or if we just started fresh
            const initialMsgs = [
                { id: 1, sender: '강 형사', text: '지금 도착했냐? 위치 추적기 켜둬라.', type: 'text', time: '오후 2:01' },
                { id: 2, sender: '강 형사', text: '본부에서는 전광어 그 놈 그냥 뜬소문이라고 생각한다고.', type: 'text', time: '오후 2:01' },
                { id: 3, sender: '강 형사', text: '무리하지 말고 그냥 동태나 살피다 와. 알겠지?', type: 'text', time: '오후 2:02' },
            ];
            setMessages(initialMsgs);
        }
    }, [initialMessages]); // Run when initialMessages prop changes or on mount

    // Sync messages back to context whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            setChatLogs(messages);
        }
    }, [messages, setChatLogs]);

    // Check Disconnect State based on Inventory
    useEffect(() => {
        if (hasContract) {
            setIsDisconnected(true);

            // Append explicit "Connection Lost" message if not already there
            setMessages(prev => {
                const hasSystemMsg = prev.some(m => m.text === '상대방과의 연결이 종료되었습니다.');
                if (!hasSystemMsg) {
                    return [
                        ...prev,
                        {
                            id: Date.now(),
                            sender: 'security_bot',
                            text: '상대방과의 연결이 종료되었습니다.',
                            type: 'system',
                            time: ''
                        }
                    ];
                }
                return prev;
            });
        }
    }, [hasContract]);

    // Blackout effect state
    const [blackout, setBlackout] = useState(false);

    // This is called when the ChatScreen decides it's time (after X messages)
    const handleTriggerContract = () => {
        console.log("MessengerApp: Triggering Contract Phase globally");
        triggerAppEvent('CONTRACT_TRIGGER');
        // We stay in 'chat' phase here!
    };

    // We might still need to handle completion if the scene tells us? 
    // Or maybe the Scene handles the completion flow entirely now.
    // For now, let's keep the blackout logic if 'onComplete' is called explicitly.

    return (
        <div className="w-full h-full relative">
            <AnimatePresence mode="wait">
                {phase === 'loading' && (
                    <motion.div key="loading" className="w-full h-full" exit={{ opacity: 0 }}>
                        <MessengerLoading onLoaded={() => setPhase('list')} />
                    </motion.div>
                )}

                {phase === 'list' && (
                    <motion.div key="list" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ChatListScreen
                            onChatSelect={() => setPhase('chat')}
                            messages={messages}
                            isAnimated={isListAnimated}
                            onAnimationComplete={() => setIsListAnimated(true)}
                            isDisconnected={isDisconnected}
                        />
                        <button onClick={onBack} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-black/20 rounded-full z-50 hover:bg-black/40 transition-colors"></button>
                    </motion.div>
                )}

                {phase === 'chat' && (
                    <motion.div key="chat" className="w-full h-full" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "-50%", opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                        <ChatScreen
                            messages={messages}
                            setMessages={setMessages}
                            onBack={() => setPhase('list')}
                            onTriggerContract={handleTriggerContract}
                            isDisconnected={isDisconnected}
                            setIsDisconnected={setIsDisconnected}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MessengerApp;
