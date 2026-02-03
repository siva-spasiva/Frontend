import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';

import { generateAIResponse } from '../utils/aiService';
// import { FRIEND_A_PROMPT } from '../utils/prompts'; // Moved to backend

const LogEntry = ({ log }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (log.type === 'friend_multi') {
        return (
            <div
                className="text-yellow-400 cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <p className="text-xs mb-1 text-red-400 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                    Incoming Message [ID: {log.sender}] {isExpanded ? '▼' : '▶'}
                    <span className="ml-2 text-[10px] animate-pulse">
                        (CLICK TO {isExpanded ? 'COLLAPSE' : 'EXPAND'})
                    </span>
                </p>

                <AnimatePresence mode="wait">
                    {!isExpanded ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key="collapsed"
                        >
                            <p>"{log.messages[log.messages.length - 1]}"</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            key="expanded"
                            className="space-y-1 border-l-2 border-yellow-900 pl-2"
                        >
                            {log.messages.map((msg, i) => (
                                <p key={i} className={i !== log.messages.length - 1 ? "opacity-50" : "font-bold"}>
                                    "{msg}"
                                </p>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className={log.type === 'friend' ? 'text-yellow-400' : log.type === 'system' ? 'text-blue-400' : 'text-green-400'}>
            {log.type === 'friend' && <p className="text-xs opacity-70 mb-1">Incoming Message [ID: {log.sender}]...</p>}
            <p>{log.type === 'user' ? `> ${log.text}` : log.text}</p>
        </div>
    );
};

const TerminalScene = () => {
    const [phase, setPhase] = useState('boot'); // boot, status, interactive
    const [interactionStep, setInteractionStep] = useState('intro'); // intro, input, user_processing, friend_waiting, friend_reply, system_reply
    const [inputValue, setInputValue] = useState('');
    const [logs, setLogs] = useState([]); // { id, type, text, sender }
    const [isStatusTyped, setIsStatusTyped] = useState(false);
    const [isHealed, setIsHealed] = useState(false);

    // AI Integration States
    const [aiResponseText, setAiResponseText] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);

    const [statusValues, setStatusValues] = useState({
        mobility: '0%',
        mobilityStatus: '(CRITICAL)',
        pain: '██████████',
        painStatus: '(OVERLOAD)'
    });

    const bottomRef = useRef(null);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs, interactionStep, phase, isStatusTyped, isHealed, isAiThinking]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue.trim() !== '') {
            setInteractionStep('user_processing');
        }
    };

    const handleHealing = () => {
        setIsHealed(true);
        setStatusValues({
            mobility: '5%',
            mobilityStatus: '(IMPAIRED)',
            pain: '█████████░',
            painStatus: '(HIGH)'
        });
        setInteractionStep('cooldown');

        // Delay restoring input to allow user to see the healing effect
        setTimeout(() => {
            setInteractionStep('input');
        }, 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen bg-black text-green-500 p-8 font-mono text-lg overflow-y-auto relative"
            style={{ textShadow: '0 0 5px #0f0' }}
        >
            {/* Global Red Overlay */}
            <div
                className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${isHealed ? 'opacity-0' : 'opacity-30'}`}
                style={{
                    boxShadow: isHealed ? 'none' : 'inset 0 0 100px red',
                    zIndex: 0
                }}
            >
                <div className={`w-full h-full bg-red-900 mix-blend-overlay ${!isHealed && 'animate-pulse'}`}></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10 flex flex-col space-y-6">

                {/* 1. Boot Sequence */}
                {phase === 'boot' && (
                    <TypeAnimation
                        sequence={[
                            '> SYSTEM REBOOT...', 800,
                            '> INITIALIZING KERNEL...', 500,
                            '> LOADING DRIVERS... OK.', 500,
                            '\n',
                            () => setPhase('status')
                        ]}
                        wrapper="div"
                        cursor={true}
                        speed={50}
                        style={{ whiteSpace: 'pre-line' }}
                    />
                )}

                {/* 2. Persistent Status Display */}
                {phase !== 'boot' && (
                    <div className="space-y-4">
                        <div>
                            <p className={`font-bold mb-4 transition-colors duration-1000 ${isHealed ? 'text-green-600' : 'text-red-500'}`}>
                                {isHealed ? '[SYSTEM: BIO-SIGNAL STABILIZING]' : '[WARNING: CRITICAL BIO-SIGNAL DETECTED]'}
                            </p>

                            {!isStatusTyped ? (
                                <TypeAnimation
                                    sequence={[
                                        `> INJURY DETECTED: RIGHT ANKLE (COMMINUTED FRACTURE)\n`,
                                        800,
                                        `\n> MOBILITY: 0% (CRITICAL)\n`,
                                        800,
                                        `\n> PAIN LEVEL: ██████████ (OVERLOAD)\n`,
                                        800,
                                        `\n> LOADING LOCAL_MESSENGER...\n`,
                                        1000,
                                        () => {
                                            setIsStatusTyped(true);
                                            setPhase('interactive');
                                        }
                                    ]}
                                    speed={50}
                                    cursor={false}
                                    style={{ whiteSpace: 'pre-line' }}
                                />
                            ) : (
                                <div className="whitespace-pre-line">
                                    <p>{`> INJURY DETECTED: RIGHT ANKLE (COMMINUTED FRACTURE)`}</p>
                                    <div className="h-4"></div>
                                    <p>
                                        {`> MOBILITY: ${statusValues.mobility} `}
                                        <span className={isHealed ? 'text-yellow-500' : 'text-red-500'}>{statusValues.mobilityStatus}</span>
                                    </p>
                                    <div className="h-4"></div>
                                    <p>
                                        {`> PAIN LEVEL: `}
                                        <span className={isHealed ? 'text-orange-500' : 'text-red-600'}>{statusValues.pain}</span>
                                        {` ${statusValues.painStatus}`}
                                    </p>
                                    <div className="h-4"></div>
                                    <p>{`> LOADING LOCAL_MESSENGER...`}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Interactive Chat Section */}
                {phase === 'interactive' && isStatusTyped && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4 border-t border-green-900 pt-6"
                    >
                        {/* Intro Friend Messages */}
                        {interactionStep === 'intro' ? (
                            <div className="text-yellow-400">
                                <TypeAnimation
                                    sequence={[
                                        `Incoming Message [ID: FRIEND_A]...\n`,
                                        500,
                                        `"야!! 괜찮아?? 피가 너무 많이 나... 어떡해 나 무서워 ㅠㅠ"\n`,
                                        1000,
                                        `"문이 안 열려... 우리 갇힌 거 맞지?"`,
                                        500,
                                        () => {
                                            // Combine messages into one collapsible log
                                            const introLog = {
                                                id: 'intro_group',
                                                type: 'friend_multi',
                                                sender: 'FRIEND_A',
                                                messages: [
                                                    "야!! 괜찮아?? 피가 너무 많이 나... 어떡해 나 무서워 ㅠㅠ",
                                                    "문이 안 열려... 우리 갇힌 거 맞지?"
                                                ]
                                            };
                                            setLogs(prev => [
                                                ...prev,
                                                introLog,
                                                { id: 'sys_instr', type: 'system', text: '[시스템: 통증으로 인해 음성 대화가 불가능합니다. 텍스트로 지시하십시오. (예시: 지혈해)]' }
                                            ]);
                                            setInteractionStep('input');
                                        }
                                    ]}
                                    speed={50}
                                    cursor={false}
                                    style={{ whiteSpace: 'pre-line' }}
                                />
                            </div>
                        ) : (
                            // Render persistent logs + current interaction
                            <>
                                {logs.map((log, idx) => (
                                    <LogEntry key={idx} log={log} />
                                ))}

                                {/* Current Active Step Animations */}
                                {interactionStep === 'user_processing' && (
                                    <div className="text-green-400 flex">
                                        <span className="mr-2">{'>'}</span>
                                        <TypeAnimation
                                            sequence={[
                                                inputValue.split('').join('.. ') + '...',
                                                500,
                                                () => {
                                                    const userMsg = inputValue;
                                                    setLogs(prev => [...prev, { id: Date.now(), type: 'user', text: userMsg }]);
                                                    setInputValue('');

                                                    // Start AI Request
                                                    setInteractionStep('friend_waiting');
                                                    setIsAiThinking(true);

                                                    // Pass the specific system prompt for Friend A
                                                    generateAIResponse(userMsg, { npcId: 'friend_a' })
                                                        .then(data => {
                                                            setAiResponseText(data.response);
                                                            setIsAiThinking(false);
                                                            setInteractionStep('friend_reply');
                                                        })
                                                        .catch(err => {
                                                            console.error(err);
                                                            setAiResponseText("...(통신 오류: 메시지 수신 실패)...");
                                                            setIsAiThinking(false);
                                                            setInteractionStep('friend_reply');
                                                        });
                                                }
                                            ]}
                                            speed={20} // fast stutter
                                            cursor={false}
                                        />
                                    </div>
                                )}

                                {interactionStep === 'friend_waiting' && (
                                    <div className="text-yellow-400 group cursor-default">
                                        <p className="text-xs mb-1 text-red-400 opacity-70">
                                            Incoming Message [ID: FRIEND_A]...
                                        </p>
                                        <div className="animate-pulse">...</div>
                                    </div>
                                )}

                                {interactionStep === 'friend_reply' && (
                                    <div className="text-yellow-400 group cursor-default">
                                        <p className="text-xs mb-1 text-red-400 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                                            Incoming Message [ID: FRIEND_A]...
                                        </p>
                                        <TypeAnimation
                                            sequence={[
                                                `...`, 500,
                                                aiResponseText, // Use the generated text
                                                800,
                                                () => {
                                                    // Use friend_multi format for consistent styling
                                                    const replyLog = {
                                                        id: Date.now(),
                                                        type: 'friend_multi',
                                                        sender: 'FRIEND_A',
                                                        messages: [`"${aiResponseText}"`]
                                                    };
                                                    setLogs(prev => [...prev, replyLog]);

                                                    // For now, loop back to input after reply, OR go to system reply if specific triggers met
                                                    // For this demo, let's just go back to input to keep chatting
                                                    setInteractionStep('input');

                                                    // Optional: If you still want the healing event to trigger once, 
                                                    // you can add logic here to check if it has happened yet.
                                                    if (!isHealed && aiResponseText.includes("알겠어")) {
                                                        setInteractionStep('system_reply');
                                                    }
                                                }
                                            ]}
                                            speed={50}
                                            cursor={false}
                                        />
                                    </div>
                                )}

                                {interactionStep === 'system_reply' && (
                                    <div className="text-blue-400">
                                        <TypeAnimation
                                            sequence={[
                                                `[SYSTEM] Status Update: Bleeding Slowed. Mobility increased to 5%.`,
                                                1000,
                                                () => {
                                                    setLogs(prev => [...prev, { id: Date.now(), type: 'system', text: '[SYSTEM] Status Update: Bleeding Slowed. Mobility increased to 5%.' }]);
                                                    handleHealing();
                                                }
                                            ]}
                                            speed={70}
                                            cursor={false}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* Input Area (System Instruction is now part of logs) */}
                        {interactionStep !== 'intro' && (
                            <div className="pt-4">
                                {interactionStep === 'input' && (
                                    <div className="flex items-center text-green-400 text-xl">
                                        <span className="mr-3">{'>'}</span>
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="bg-transparent border-none outline-none text-green-400 w-full font-mono placeholder-green-800 focus:ring-0"
                                            placeholder="명령어 입력..."
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                <div ref={bottomRef} className="h-8" />
            </div>

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)50%,rgba(0,0,0,0.25)50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-30 bg-[length:100%_4px,3px_100%]"></div>
        </motion.div>
    );
};

export default TerminalScene;
