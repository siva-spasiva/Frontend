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
import Debug02Scene from './scenes/Debug02Scene';
import Debug03Scene from './scenes/Debug03Scene';
import CrashScene from './scenes/CrashScene';
import TerminalScene from './scenes/TerminalScene';

// New Scenes
import IntroSequence from './scenes/IntroSequence';
import IslandOutsideScene from './scenes/IslandOutsideScene';
import ClassroomScene from './scenes/ClassroomScene';
import Room001Scene from './scenes/Room001Scene';

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
  // phase state: 'teamLogo' -> 'mainMenu' -> 'intro' -> 'outside' -> 'classroom' -> 'room001' ...
  const [phase, setPhase] = useState('mainMenu');

  // Access Game Context for Layout
  const { isPhoneCentered, setIsPhoneCentered, appEvent } = useGame();

  // Phase transition functions
  const toMainMenu = () => setPhase('mainMenu');
  const toIntro = () => setPhase('intro');
  const toOutside = () => setPhase('outside');
  const toClassroom = () => setPhase('classroom');
  const toRoom001 = () => setPhase('room001');

  // Legacy / Test phase transitions
  const toGameStart = () => setPhase('gameStart');
  const toMainGame = () => setPhase('mainGame');
  const toTest02 = () => setPhase('test02');
  const toTest03 = () => setPhase('test03');
  const toTest04 = () => setPhase('test04');
  const toStart = () => setPhase('start'); // Legacy start
  const toTest05 = () => setPhase('test05');
  const toDebug00 = () => setPhase('debug00');
  const toDebug01 = () => setPhase('debug01');
  const toDebug02 = () => setPhase('debug02');
  const toDebug03 = () => setPhase('debug03');
  const toCrash = () => setPhase('crash');
  const toTerminal = () => setPhase('terminal');

  const [isPhoneOpen, setIsPhoneOpen] = useState(true);
  const togglePhone = () => setIsPhoneOpen(prev => !prev);

  // Contract panel state for legacy start sequence
  const [showStartContract, setShowStartContract] = useState(false);

  // Reset phone state when entering new phases
  React.useEffect(() => {
    // Phases where phone should be open and side-by-side
    const splitPhases = ['outside', 'classroom', 'room001', 'mainGame', 'test02', 'test03', 'test04', 'test05'];
    if (splitPhases.includes(phase)) {
        setIsPhoneOpen(true);
        setIsPhoneCentered(false); // Default to split view
    }
    
    // Legacy Start
    if (phase === 'start') {
      setIsPhoneOpen(true);
      setIsPhoneCentered(true);
      setShowStartContract(false);
    }
  }, [phase, setIsPhoneCentered]);

  // Listen for CONTRACT_TRIGGER during legacy start phase
  React.useEffect(() => {
    if (phase === 'start' && appEvent?.event === 'CONTRACT_TRIGGER') {
      setIsPhoneCentered(false);
      setTimeout(() => {
        setShowStartContract(true);
      }, 300);
    }
  }, [appEvent, phase, setIsPhoneCentered]);

  const isSplit = ['outside', 'classroom', 'room001', 'gameStart', 'mainGame', 'test02', 'test03', 'test04', 'test05', 'start'].includes(phase);

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'teamLogo' && (
          <TeamLogoScene key="teamLogo" onComplete={toMainMenu} />
        )}

        {phase === 'intro' && (
            <IntroSequence key="intro" onComplete={toOutside} />
        )}

        {phase === 'crash' && (
          <CrashScene key="crash" onMount={toTerminal} />
        )}

        {phase === 'debug00' && <Debug00Scene key="debug00" onBack={toMainMenu} />}
        {phase === 'debug01' && <Debug01Scene key="debug01" onBack={toMainMenu} />}
        {phase === 'debug02' && <Debug02Scene key="debug02" onBack={toMainMenu} />}
        {phase === 'debug03' && <Debug03Scene key="debug03" onBack={toMainMenu} />}
        {phase === 'terminal' && <TerminalScene key="terminal" />}

        {/* Unified Split Layout Group */}
        {(phase === 'mainMenu' || isSplit) && (
          <motion.div
            key="split-group"
            className="w-full h-full relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Background Types */}
            <AnimatePresence>
                {/* --- Main Menu Background --- */}
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
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
                </motion.div>
              )}

              {/* --- NEW SCENES --- */}
              {phase === 'outside' && (
                <motion.div
                  key="outside-bg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-0"
                >
                  <IslandOutsideScene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} onEnterClassroom={toClassroom} />
                </motion.div>
              )}

              {phase === 'classroom' && (
                <motion.div
                  key="classroom-bg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-0"
                >
                  <ClassroomScene onComplete={toRoom001} />
                </motion.div>
              )}

              {phase === 'room001' && (
                <motion.div
                  key="room001-bg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-0"
                >
                  <Room001Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                </motion.div>
              )}


              {/* --- LEGACY SCENES --- */}
              {phase === 'mainGame' && (
                <motion.div key="mainGame-bg" className="absolute inset-0 z-0">
                  <Test01Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                </motion.div>
              )}
              {phase === 'test02' && (
                <motion.div key="test02-bg" className="absolute inset-0 z-0">
                  <Test02Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                </motion.div>
              )}
              {phase === 'test03' && (
                <motion.div key="test03-bg" className="absolute inset-0 z-0">
                  <Test03Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                </motion.div>
              )}
              {phase === 'test04' && (
                <motion.div key="test04-bg" className="absolute inset-0 z-0">
                  <Test04Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                </motion.div>
              )}
              {phase === 'start' && (
                <motion.div key="start-bg" className="absolute inset-0 z-0">
                  <StartBackground />
                </motion.div>
              )}
              {phase === 'test05' && (
                 <motion.div key="test05-bg" className="absolute inset-0 z-0">
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
                  width: isPhoneCentered
                    ? '100%'
                    : (isSplit
                      ? (isPhoneOpen ? '420px' : '0px')
                      : '100%'),
                  opacity: (['outside', 'classroom', 'room001', 'mainGame', 'test02', 'test03', 'test04', 'test05', 'start'].includes(phase) && !isPhoneOpen && !isPhoneCentered) ? 0 : 1,
                  position: isPhoneCentered ? 'absolute' : 'relative',
                  left: 0,
                  zIndex: 50
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="pointer-events-auto w-full h-full flex items-center justify-center">
                  <MainMenuScene
                    onNext={() => {
                       // Main "Start" button routed to Intro
                       if (phase === 'mainMenu') {
                           toIntro();
                       } else if (phase === 'start') {
                        // Legacy handling
                        toGameStart();
                       } else {
                        // Default fallback
                        toGameStart();
                       }
                    }}
                    onTestStart={toMainGame}
                    onTest02Start={toTest02}
                    onTest03Start={toTest03}
                    onTest04Start={toTest04}
                    onTest05Start={toTest05}
                    onStartSequence={toIntro}
                    onDebug00Start={toDebug00}
                    onDebug01Start={toDebug01}
                    onDebug02Start={toDebug02}
                    onDebug03Start={toDebug03}
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
