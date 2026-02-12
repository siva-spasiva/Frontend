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
import Test05Scene from './scenes/Test05Scene';
import Debug00Scene from './scenes/Debug00Scene';
import Debug01Scene from './scenes/Debug01Scene';
import CrashScene from './scenes/CrashScene';
import TerminalScene from './scenes/TerminalScene';
import { GameProvider } from './context/GameContext';

import './index.css';
import MainMenuBg from './assets/map/mainmenu01.png';
import OutsideBg from './assets/map/1F_outside01.png';

// Start sequence background - transitions from mainmenu to outside view
const StartBackground = () => {
  const [showOutside, setShowOutside] = React.useState(false);

  React.useEffect(() => {
    const handler = (e) => {
      if (e.detail === 'outside') setShowOutside(true);
    };
    window.addEventListener('start-bg-transition', handler);
    return () => window.removeEventListener('start-bg-transition', handler);
  }, []);

  return (
    <>
      <AnimatePresence>
        {!showOutside && (
          <motion.img
            key="mainmenu-bg"
            src={MainMenuBg}
            alt="Start Background"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showOutside && (
          <motion.img
            key="outside-bg"
            src={OutsideBg}
            alt="Umi Gallery Outside"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
    </>
  );
};

// Inner Layout Component that has access to Context
const MainLayout = () => {
  // phase state: 'teamLogo' -> 'mainMenu' -> 'start'/'gameStart'/'mainGame' -> 'crash' -> 'terminal' -> 'test02' -> 'test03'
  const [phase, setPhase] = useState('mainMenu');
  // teamlogoscene 으로 나중에 교체 

  // Access Game Context for Layout
  const { isPhoneCentered, setIsPhoneCentered, appEvent } = useGame();

  // Phase transition functions
  const toMainMenu = () => setPhase('mainMenu');
  const toGameStart = () => setPhase('gameStart');
  const toMainGame = () => setPhase('mainGame');
  const toTest02 = () => setPhase('test02');
  const toTest03 = () => setPhase('test03');
  const toTest04 = () => setPhase('test04');
  const toStart = () => setPhase('start');
  const toTest05 = () => setPhase('test05');
  const toDebug00 = () => setPhase('debug00');
  const toDebug01 = () => setPhase('debug01');
  const toCrash = () => setPhase('crash');
  const toTerminal = () => {
    setPhase('terminal');
  };

  const [isPhoneOpen, setIsPhoneOpen] = useState(true);
  const togglePhone = () => setIsPhoneOpen(prev => !prev);

  // Contract panel state for start sequence
  const [showStartContract, setShowStartContract] = useState(false);

  // Reset phone state when entering MainGame or Test02/03/04/05
  React.useEffect(() => {
    if (phase === 'mainGame' || phase === 'test02' || phase === 'test03' || phase === 'test04' || phase === 'test05') setIsPhoneOpen(true);
    if (phase === 'start') {
      setIsPhoneOpen(true);
      setIsPhoneCentered(true); // Phone centered during start messenger sequence
      setShowStartContract(false);
    }
  }, [phase]);

  // Listen for CONTRACT_TRIGGER during start phase
  React.useEffect(() => {
    if (phase === 'start' && appEvent?.event === 'CONTRACT_TRIGGER') {
      // Move phone to left, show contract on right
      setIsPhoneCentered(false);
      // Small delay for phone animation to settle before showing contract
      setTimeout(() => {
        setShowStartContract(true);
      }, 300);
    }
  }, [appEvent, phase]);

  const isSplit = phase === 'gameStart' || phase === 'mainGame' || phase === 'test02' || phase === 'test03' || phase === 'test04' || phase === 'test05' || phase === 'start';

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

        {phase === 'debug01' && (
          <Debug01Scene key="debug01" onBack={toMainMenu} />
        )}

        {phase === 'terminal' && (
          <TerminalScene key="terminal" />
        )}

        {/* Unified Split Layout Group */}
        {(phase === 'mainMenu' || phase === 'gameStart' || phase === 'mainGame' || phase === 'test02' || phase === 'test03' || phase === 'test04' || phase === 'test05' || phase === 'start') && (
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
                  <Test04Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                </motion.div>
              )}

              {phase === 'start' && (
                <motion.div
                  key="start-bg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 z-0"
                >
                  <StartBackground />
                </motion.div>
              )}

              {phase === 'test05' && (
                <motion.div
                  key="test05-bg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 z-0"
                >
                  <Test05Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
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
                      ? ((phase === 'mainGame' || phase === 'test02' || phase === 'test03' || phase === 'test04' || phase === 'test05' || phase === 'start')
                        ? (isPhoneOpen ? '420px' : '0px')
                        : '50%')
                      : '100%'),

                  // If phone centered, we might want to ensure background is transparent so we see scene behind?
                  // But standard layout has transparent background for phone container anyway.
                  // Check opacity logic
                  opacity: ((phase === 'mainGame' || phase === 'test02' || phase === 'test03' || phase === 'test04' || phase === 'test05' || phase === 'start') && !isPhoneOpen && !isPhoneCentered) ? 0 : 1,

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
                      if (phase === 'start') {
                        // Start sequence: messenger complete → contract
                        toGameStart();
                      } else {
                        toGameStart();
                      }
                    }}
                    onTestStart={toMainGame}
                    onTest02Start={toTest02}
                    onTest03Start={toTest03}
                    onTest04Start={toTest04}
                    onTest05Start={toTest05}
                    onStartSequence={toStart}
                    onDebug00Start={toDebug00}
                    onDebug01Start={toDebug01}
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

                {phase === 'start' && showStartContract && (
                  <motion.div
                    key="startContract-panel"
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="flex-1 h-full flex items-center justify-center p-8 pointer-events-auto"
                  >
                    <GameStartSequence onSign={() => {
                      setIsPhoneCentered(false);
                      toTest04();
                    }} />
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

import FishLevelWarning from './components/FishLevelWarning';

function App() {
  return (
    <GameProvider>
      <MainLayout />
      <FishLevelWarning />
    </GameProvider>
  );
}

export default App;
