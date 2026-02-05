import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import PortraitDisplay from '../components/PortraitDisplay';
import { Send, MessageCircle, PlayCircle } from 'lucide-react';
import { sendChatMessage } from '../api/chat';
import MessengerApp from '../components/apps/MessengerApp';

const Test04Scene = ({ onBack }) => {
    const {
        npcData,
        npcStats,
        updateStatsBackend,

        trust,
        hp, fishLevel, umiLevel,
        inventory, // Current inventory array
        ITEMS // Static item definitions
    } = useGame();

    const [targetNpcId] = useState('npc_a');

    // View Mode State: 'debug' | 'messenger'
    const [viewMode, setViewMode] = useState('debug');

    // Chat State
    const [messages, setMessages] = useState([
        { id: 1, sender: 'System', text: 'Debug Mode Started. Adjust stats and chat to test.' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef(null);

    // Stats State
    const [lastSaved, setLastSaved] = useState(null);

    // Safely merge with defaults to handle partial optimistic updates
    const rawNpcStats = npcStats?.[targetNpcId];
    const currentNpcStats = {
        friendly: 50,
        faith: 50,
        fishLevel: 0,
        ...rawNpcStats
    };

    const activeNpc = npcData?.[targetNpcId];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleNpcStatChange = (key, val) => {
        console.log(`Debug NPC Update: ${key} -> ${val}`);
        updateStatsBackend({ [key]: parseInt(val) }, targetNpcId);
        setLastSaved(new Date());
    };

    const handleGlobalStatChange = (key, val) => {
        console.log(`Debug Global Update: ${key} -> ${val}`);
        updateStatsBackend({ [key]: parseInt(val) });
        setLastSaved(new Date());
    };

    const handleInventoryToggle = (itemId) => {
        const currentInventory = inventory || [];
        let newInventory;
        if (currentInventory.includes(itemId)) {
            newInventory = currentInventory.filter(id => id !== itemId);
        } else {
            newInventory = [...currentInventory, itemId];
        }
        console.log(`Debug Inventory Update: ${itemId} -> ${newInventory.includes(itemId)}`);
        updateStatsBackend({ inventory: newInventory });
        setLastSaved(new Date());
    };

    const handleSend = async () => {
        if (!inputText.trim() || isThinking) return;

        const userMsg = { id: Date.now(), sender: 'User', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsThinking(true);

        try {
            const data = await sendChatMessage(userMsg.text, targetNpcId);

            // Add NPC Response
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: data.npcId || 'NPC',
                text: data.response
            }]);

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { id: Date.now() + 2, sender: 'System', text: 'Error: ' + err.message }]);
        } finally {
            setIsThinking(false);
        }
    };

    // Background
    const bgStyle = {
        backgroundImage: 'url("https://images.unsplash.com/photo-1518112166165-90b27dbb1b51?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    if (viewMode === 'messenger') {
        return (
            <div className="w-full h-full bg-white relative">
                {/* Debug Overlay Button to Force Exit */}
                <button
                    onClick={() => setViewMode('debug')}
                    className="absolute top-2 right-2 z-[60] px-3 py-1 bg-red-600 text-white text-xs font-bold rounded shadow-lg opacity-50 hover:opacity-100 transition-opacity"
                >
                    EXIT SEQ
                </button>
                <MessengerApp
                    onBack={() => setViewMode('debug')}
                    onComplete={() => {
                        alert("Sequence Completed!");
                        setViewMode('debug');
                    }}
                />
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-black text-white overflow-hidden font-mono" style={bgStyle}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60" />

            {/* Exit Button */}
            <button
                onClick={onBack}
                className="absolute top-4 left-4 z-50 px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded shadow-lg backdrop-blur-sm transition-all"
            >
                EXIT DEBUG
            </button>

            {/* View Mode Switcher / Sequence Trigger */}
            <div className="absolute top-4 right-4 z-50 flex space-x-2">
                <button
                    onClick={() => setViewMode('messenger')}
                    className="px-4 py-2 bg-blue-600/80 hover:bg-blue-500 text-white font-bold rounded shadow-lg backdrop-blur-sm transition-all flex items-center space-x-2"
                >
                    <PlayCircle className="w-4 h-4" />
                    <span>Run Start Sequence</span>
                </button>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex">

                {/* Left: NPC Portrait Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                    <div className="relative w-[500px] h-[700px]">
                        {/* Fix: Pass full activeNpc object */}
                        <PortraitDisplay
                            activeNpc={activeNpc}
                            className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,255,100,0.3)]"
                        />
                        <div className="absolute bottom-10 left-0 right-0 text-center">
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
                                {activeNpc?.name || targetNpcId}
                            </h1>
                            <p className="text-gray-400 text-sm mt-2">DEBUG MODE: STAT TEST</p>
                        </div>
                    </div>
                </div>

                {/* Right: Controls & Chat */}
                <div className="w-[400px] flex flex-col h-full bg-black/80 border-l border-white/10 backdrop-blur-md">

                    {/* Scrolling Container for Controls */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">

                        {/* NPC Stats */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                <h2 className="text-green-400 font-bold text-sm">NPC STATS ({targetNpcId})</h2>
                                {lastSaved && <span className="text-[10px] text-gray-500 animate-pulse">Synced</span>}
                            </div>
                            <div className="space-y-4">
                                <StatSlider label="Friendly (호감)" value={currentNpcStats.friendly} color="text-green-300" accent="accent-green-500" onChange={(v) => handleNpcStatChange('friendly', v)} />
                                <StatSlider label="Faith (신앙)" value={currentNpcStats.faith} color="text-purple-300" accent="accent-purple-500" onChange={(v) => handleNpcStatChange('faith', v)} />
                                <StatSlider label="FishLevel (변이)" value={currentNpcStats.fishLevel} color="text-blue-300" accent="accent-blue-500" onChange={(v) => handleNpcStatChange('fishLevel', v)} />
                            </div>
                        </div>

                        {/* Player Stats */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                <h2 className="text-blue-400 font-bold text-sm">PLAYER STATS</h2>
                                {lastSaved && <span className="text-[10px] text-gray-500 animate-pulse">Synced</span>}
                            </div>
                            <div className="space-y-4">
                                <StatSlider label="HP (체력)" value={hp} color="text-red-300" accent="accent-red-500" onChange={(v) => handleGlobalStatChange('hp', v)} />
                                <StatSlider label="Trust (신뢰)" value={trust} color="text-emerald-300" accent="accent-emerald-500" onChange={(v) => handleGlobalStatChange('trust', v)} />
                                <StatSlider label="FishLevel (이해)" value={fishLevel} color="text-cyan-300" accent="accent-cyan-500" onChange={(v) => handleGlobalStatChange('fishLevel', v)} />
                                <StatSlider label="UmiLevel (권한)" value={umiLevel} color="text-indigo-300" accent="accent-indigo-500" onChange={(v) => handleGlobalStatChange('umiLevel', v)} />
                            </div>
                        </div>

                        {/* Inventory Control */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                <h2 className="text-orange-400 font-bold text-sm">INVENTORY</h2>
                            </div>
                            <div className="space-y-2">
                                {Object.values(ITEMS).map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-black/20 rounded hover:bg-black/40 transition-colors">
                                        <div className="flex items-center space-x-2 overflow-hidden">
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="text-xs text-gray-300 truncate max-w-[120px]">{item.name}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={(inventory || []).includes(item.id)}
                                            onChange={() => handleInventoryToggle(item.id)}
                                            className="form-checkbox h-4 w-4 text-orange-500 rounded border-gray-600 bg-gray-700 focus:ring-orange-500 focus:ring-offset-gray-900"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 bg-black/50 rounded-xl border border-white/10 p-2 min-h-[300px] max-h-[400px] overflow-y-auto" ref={scrollRef}>
                            {messages.map((msg) => (
                                <div key={msg.id} className={`mb-2 p-2 rounded text-sm ${msg.sender === 'User' ? 'bg-white/10 text-right' : 'bg-green-900/30 text-left'}`}>
                                    <span className="block text-xs opacity-50 mb-1">{msg.sender}</span>
                                    {msg.text}
                                </div>
                            ))}
                            {isThinking && <div className="text-xs text-gray-500 italic p-2">NPC is thinking... </div>}
                        </div>
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-white/10 bg-black/90">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                                placeholder="Type a message..."
                            />
                            <button
                                onClick={handleSend}
                                disabled={isThinking}
                                className="p-2 bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const StatSlider = ({ label, value, color, accent, onChange }) => (
    <div>
        <div className="flex justify-between text-xs mb-1">
            <span>{label}</span>
            <span className={color}>{value}</span>
        </div>
        <input
            type="range" min="0" max="100"
            value={value || 0}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full ${accent}`}
        />
    </div>
);

export default Test04Scene;
