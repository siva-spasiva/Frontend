import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TeamLogoScene from './scenes/TeamLogoScene';
import MainMenuScene from './scenes/MainMenuScene';
import GameStartSequence from './scenes/GameStartSequence';
import Test01Scene from './scenes/Test01Scene'; // Refactored from MainGameScene
import Test02Scene from './scenes/Test02Scene';
import Test03Scene from './scenes/Test03Scene';
import Test04Scene from './scenes/Test04Scene'; // New Debug Scene
import CrashScene from './scenes/CrashScene';
import TerminalScene from './scenes/TerminalScene'; // Updated
import { GameProvider } from './context/GameContext'; // New

import './index.css';

function App() {
  // phase state: 'teamLogo' -> 'mainMenu' -> 'gameStart'/'mainGame' -> 'crash' -> 'terminal' -> 'test02' -> 'test03'
  const [phase, setPhase] = useState('teamLogo');

  // Phase transition functions
  const toMainMenu = () => setPhase('mainMenu');
  const toGameStart = () => setPhase('gameStart');
  const toMainGame = () => setPhase('mainGame'); // Updated (renders Test01)
  const toTest02 = () => setPhase('test02'); // New
  const toTest03 = () => setPhase('test03'); // New
  const toTest04 = () => setPhase('test04'); // New Debug
  const toCrash = () => setPhase('crash');
  const toTerminal = () => {
    setPhase('terminal');
  };

  const [isPhoneOpen, setIsPhoneOpen] = useState(true);
  const togglePhone = () => setIsPhoneOpen(prev => !prev);

  // Reset phone state when entering MainGame or Test02/03
  React.useEffect(() => {
    if (phase === 'mainGame' || phase === 'test02' || phase === 'test03') setIsPhoneOpen(true);
  }, [phase]);

  const isSplit = phase === 'gameStart' || phase === 'mainGame' || phase === 'test02' || phase === 'test03';

  return (
    <GameProvider>
      <div className="relative w-full h-screen bg-gray-100 overflow-hidden">

        <AnimatePresence mode="wait">
          {phase === 'teamLogo' && (
            <TeamLogoScene key="teamLogo" onComplete={toMainMenu} />
          )}

          {phase === 'crash' && (
            <CrashScene key="crash" onMount={toTerminal} />
          )}

          {phase === 'terminal' && (
            <TerminalScene key="terminal" />
          )}

          {phase === 'test04' && (
            <motion.div
              key="test04"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50"
            >
              <Test04Scene onBack={toMainMenu} />
            </motion.div>
          )}

          {/* Unified Split Layout Group */}
          {(phase === 'mainMenu' || phase === 'gameStart' || phase === 'mainGame' || phase === 'test02' || phase === 'test03') && (
            <motion.div
              key="split-group"
              className="w-full h-full relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Background Types */}
              <AnimatePresence>
                {phase === 'mainGame' && (
                  <motion.div
                    key="mainGame-bg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-0"
                  >
                    <Test01Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                  </motion.div>
                )}

                {phase === 'test02' && (
                  <motion.div
                    key="test02-bg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-0"
                  >
                    <Test02Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                  </motion.div>
                )}

                {phase === 'test03' && (
                  <motion.div
                    key="test03-bg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-0"
                  >
                    <Test03Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Foreground UI (Split Layout) */}
              <div className="flex w-full h-full relative z-10 pointer-events-none">
                <motion.div
                  layout
                  className="flex-shrink-0 flex items-center justify-center overflow-hidden"
                  initial={{ width: '100%' }}
                  animate={{
                    width: isSplit
                      ? ((phase === 'mainGame' || phase === 'test02' || phase === 'test03') ? (isPhoneOpen ? '420px' : '0px') : '50%')
                      : '100%',
                    opacity: ((phase === 'mainGame' || phase === 'test02' || phase === 'test03') && !isPhoneOpen) ? 0 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="pointer-events-auto w-full h-full flex items-center justify-center">
                    <MainMenuScene
                      onNext={toGameStart}
                      onTestStart={toMainGame}
                      onTest02Start={toTest02}
                      onTest03Start={toTest03}
                      onTest04Start={toTest04}
                      currentPhase={phase}
                    />
                  </div>
                </motion.div>

                <AnimatePresence mode="wait">
                  {phase === 'gameStart' && (
                    <motion.div
                      key="gameStart-panel"
                      initial={{ x: '100%', opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: '100%', opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="flex-1 h-full flex items-center justify-center p-8 pointer-events-auto"
                    >
                      <GameStartSequence onSign={toCrash} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {phase === 'crash' && (
            <CrashScene key="crash" onMount={toTerminal} />
          )}
          {phase === 'terminal' && (
            <TerminalScene key="terminal" />
          )}
        </AnimatePresence>
      </div>
    </GameProvider>
  );
}

export default App;
