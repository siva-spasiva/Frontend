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
import TutorialScene from './scenes/TutorialScene';
import MainGameScene from './scenes/MainGameScene';

import { GameProvider } from './context/GameContext';

import './index.css';
import MainMenuBg from './assets/map/mainmenu01.png';
import OutsideBg from './assets/map/1F_outside01.png';

// Removed legacy StartBackground

// Inner Layout Component that has access to Context
const MainLayout = () => {
  // phase state: 'teamLogo' -> 'mainMenu' -> 'tutorial' -> 'mainGame' 
  // (legacy phases kept for debug buttons)
  const [phase, setPhase] = useState('mainMenu');

  // Access Game Context for Layout
  const { isPhoneCentered, setIsPhoneCentered, appEvent } = useGame();

  // Phase transition functions
  const toMainMenu = () => setPhase('mainMenu');
  const toTutorial = () => setPhase('tutorial');
  const toMainGame = () => setPhase('mainGame');

  // Legacy / Test phase transitions
  const toTest02 = () => setPhase('test02');
  const toTest03 = () => setPhase('test03');
  const toTest04 = () => setPhase('test04');
  const toTest05 = () => setPhase('test05');
  const toDebug00 = () => setPhase('debug00');
  const toDebug01 = () => setPhase('debug01');
  const toDebug02 = () => setPhase('debug02');
  const toDebug03 = () => setPhase('debug03');
  const toCrash = () => setPhase('crash');
  const toTerminal = () => setPhase('terminal');

  const [isPhoneOpen, setIsPhoneOpen] = useState(true);
  const togglePhone = () => setIsPhoneOpen(prev => !prev);

  // Reset phone state when entering new phases
  React.useEffect(() => {
    // Phases where phone should be open and side-by-side
    const splitPhases = ['mainGame', 'test02', 'test03', 'test04', 'test05'];
    if (splitPhases.includes(phase)) {
      setIsPhoneOpen(true);
      setIsPhoneCentered(false); // Default to split view
    }
  }, [phase, setIsPhoneCentered]);

  const isSplit = ['mainGame', 'test02', 'test03', 'test04', 'test05'].includes(phase);

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'teamLogo' && (
          <TeamLogoScene key="teamLogo" onComplete={toMainMenu} />
        )}

        {phase === 'tutorial' && (
          <TutorialScene key="tutorial" onComplete={toMainGame} />
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

              {phase === 'mainGame' && (
                <motion.div key="mainGame-bg" className="absolute inset-0 z-0">
                  <MainGameScene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
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

              {phase === 'test05' && (
                <motion.div key="test05-bg" className="absolute inset-0 z-0">
                  <Test05Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Foreground UI (Split Layout) */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <motion.div
                layout
                className={`flex items-center justify-center overflow-hidden bg-transparent pointer-events-auto ${!isPhoneCentered ? 'shadow-2xl border-r border-gray-600' : ''}`}
                initial={{ width: '100%' }}
                animate={{
                  width: isPhoneCentered
                    ? '100%'
                    : (isSplit ? '420px' : '100%'),
                  x: isPhoneCentered
                    ? 0
                    : (isSplit ? (isPhoneOpen ? 0 : '-100%') : 0),
                  opacity: (isSplit && !isPhoneOpen && !isPhoneCentered) ? 0 : 1,
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  zIndex: 50
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="pointer-events-auto w-full h-full flex items-center justify-center">
                  <MainMenuScene
                    onNext={() => {
                      // Main "Start" button routed to Tutorial
                      if (phase === 'mainMenu') {
                        toTutorial();
                      } else {
                        // Default fallback
                        toTutorial();
                      }
                    }}
                    onTestStart={() => { }}
                    onTest02Start={toTest02}
                    onTest03Start={toTest03}
                    onTest04Start={toTest04}
                    onTest05Start={toTest05}
                    onStartSequence={toTutorial}
                    onDebug00Start={toDebug00}
                    onDebug01Start={toDebug01}
                    onDebug02Start={toDebug02}
                    onDebug03Start={toDebug03}
                    onHome={toMainMenu}
                    currentPhase={phase}
                  />
                </div>
              </motion.div>


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
