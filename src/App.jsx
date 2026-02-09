import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from './context/GameContext'; // Now we can use this inside MainLayout
import TeamLogoScene from './scenes/TeamLogoScene';
import MainMenuScene from './scenes/MainMenuScene';
import GameStartSequence from './scenes/GameStartSequence';
import Test01Scene from './scenes/Test01Scene';
import Test02Scene from './scenes/Test02Scene';
import Test03Scene from './scenes/Test03Scene';
import Test04Scene from './scenes/Test04Scene';
import Debug00Scene from './scenes/Debug00Scene';
import CrashScene from './scenes/CrashScene';
import TerminalScene from './scenes/TerminalScene';
import { GameProvider } from './context/GameContext';

import './index.css';
import MainMenuBg from './assets/map/mainmenu01.png';

// Inner Layout Component that has access to Context
const MainLayout = () => {
  // phase state: 'teamLogo' -> 'mainMenu' -> 'gameStart'/'mainGame' -> 'crash' -> 'terminal' -> 'test02' -> 'test03'
  const [phase, setPhase] = useState('teamLogo');

  // Access Game Context for Layout
  const { isPhoneCentered, setIsPhoneCentered } = useGame();

  // Phase transition functions
  const toMainMenu = () => setPhase('mainMenu');
  const toGameStart = () => setPhase('gameStart');
  const toMainGame = () => setPhase('mainGame');
  const toTest02 = () => setPhase('test02');
  const toTest03 = () => setPhase('test03');
  const toTest04 = () => setPhase('test04');
  const toDebug00 = () => setPhase('debug00');
  const toCrash = () => setPhase('crash');
  const toTerminal = () => {
    setPhase('terminal');
  };

  const [isPhoneOpen, setIsPhoneOpen] = useState(true);
  const togglePhone = () => setIsPhoneOpen(prev => !prev);

  // Reset phone state when entering MainGame or Test02/03/04
  React.useEffect(() => {
    if (phase === 'mainGame' || phase === 'test02' || phase === 'test03' || phase === 'test04') setIsPhoneOpen(true);
  }, [phase]);

  const isSplit = phase === 'gameStart' || phase === 'mainGame' || phase === 'test02' || phase === 'test03' || phase === 'test04';

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'teamLogo' && (
          <TeamLogoScene key="teamLogo" onComplete={toMainMenu} />
        )}

        {phase === 'crash' && (
          <CrashScene key="crash" onMount={toTerminal} />
        )}

        {phase === 'debug00' && (
          <Debug00Scene key="debug00" onBack={toMainMenu} />
        )}

        {phase === 'terminal' && (
          <TerminalScene key="terminal" />
        )}

        {/* Unified Split Layout Group */}
        {(phase === 'mainMenu' || phase === 'gameStart' || phase === 'mainGame' || phase === 'test02' || phase === 'test03' || phase === 'test04') && (
          <motion.div
            key="split-group"
            className="w-full h-full relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Background Types */}
            <AnimatePresence>
              {phase === 'mainMenu' && (
                <motion.div
                  key="mainMenu-bg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 z-0"
                >
                  <img src={MainMenuBg} alt="Main Menu Background" className="w-full h-full object-cover" />
                  {/* Overlay for better text/phone visibility */}
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
                </motion.div>
              )}

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

              {phase === 'test04' && (
                <motion.div
                  key="test04-bg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 z-0"
                >
                  <Test04Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} onComplete={toTest03} />
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
                  // If isPhoneCentered is true, we want Full Screen (100%) and Z-Index 50 (handled via separate class or style?)
                  // layout prop handles smooth width transition.
                  // We need to ensure when centered, it's truly centered.
                  // If isPhoneCentered, width is 100%. If split, 50% or 420px. 
                  width: isPhoneCentered
                    ? '100%'
                    : (isSplit
                      ? ((phase === 'mainGame' || phase === 'test02' || phase === 'test03' || phase === 'test04')
                        ? (isPhoneOpen ? '420px' : '0px')
                        : '50%')
                      : '100%'),

                  // If phone centered, we might want to ensure background is transparent so we see scene behind?
                  // But standard layout has transparent background for phone container anyway.
                  // Check opacity logic
                  opacity: ((phase === 'mainGame' || phase === 'test02' || phase === 'test03' || phase === 'test04') && !isPhoneOpen && !isPhoneCentered) ? 0 : 1,

                  // Position Absolute if Centering over content?
                  // If we use Flex row, making it 100% width PUSHES the right content off screen or squeezes it.
                  // We want to OVERLAY.
                  position: isPhoneCentered ? 'absolute' : 'relative',
                  left: 0,
                  zIndex: 50
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="pointer-events-auto w-full h-full flex items-center justify-center">
                  <MainMenuScene
                    onNext={() => {
                      if (phase === 'test04') {
                        // Special handler for Test04: Signal Messenger Completion
                        // Using hacky window event until we have a better way, or just assume automatic timer
                        window.dispatchEvent(new CustomEvent('test04-messenger-complete'));
                      } else {
                        toGameStart();
                      }
                    }}
                    onTestStart={toMainGame}
                    onTest02Start={toTest02}
                    onTest03Start={toTest03}
                    onTest04Start={toTest04}
                    onDebug00Start={toDebug00}
                    onHome={toMainMenu}
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
                    <GameStartSequence onSign={toMainGame} />
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
  );
};

function App() {
  return (
    <GameProvider>
      <MainLayout />
    </GameProvider>
  );
}

export default App;
