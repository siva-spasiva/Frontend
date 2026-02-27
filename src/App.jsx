import React, { useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useGame } from './context/GameContext'; // Now we can use this inside MainLayout
import TeamLogoScene from './scenes/TeamLogoScene';
import MainMenuScene from './scenes/MainMenuScene';
import Test01Scene from './scenes/Test01Scene';
import Test02Scene from './scenes/Test02Scene';
import Test03Scene from './scenes/Test03Scene';
import Test04Scene from './scenes/Test04Scene';
import Test05Scene from './scenes/Test05Scene';
import Debug00Scene from './scenes/Debug00Scene';
import Debug01Scene from './scenes/Debug01Scene';
import Debug02Scene from './scenes/Debug02Scene';
import Debug03Scene from './scenes/Debug03Scene';

// New Scenes
import TutorialScene from './scenes/TutorialScene';
import MainGameScene from './scenes/MainGameScene';

import { GameProvider } from './context/GameContext';
import { useAudio } from './context/AudioContext';

import './index.css';
import MainMenuBg from './assets/map/mainmenu01.png';
import OutsideBg from './assets/map/1F_outside01.png';

// Removed legacy StartBackground

// Inner Layout Component that has access to Context
const MainLayout = () => {
  // phase state: 'teamLogo' -> 'mainMenu' -> 'tutorial' -> 'mainGame' 
  // (legacy phases kept for debug buttons)
  const [phase, setPhase] = useState('teamLogo');

  // Access Game Context for Layout
  const { isPhoneCentered, setIsPhoneCentered, currentDay, currentPeriod } = useGame();
  const { playBgm, stopBgm, isMusicEnabled } = useAudio();

  // Phase transition functions
  const toMainMenu = () => setPhase('mainMenu');
  const toTutorial = () => setPhase('tutorial');
  const toMainGame = () => setPhase('mainGame');

  // Legacy / Test phase transitions
  const toTest01 = () => setPhase('test01');
  const toTest02 = () => setPhase('test02');
  const toTest03 = () => setPhase('test03');
  const toTest04 = () => setPhase('test04');
  const toTest05 = () => setPhase('test05');
  const toDebug00 = () => setPhase('debug00');
  const toDebug01 = () => setPhase('debug01');
  const toDebug02 = () => setPhase('debug02');
  const toDebug03 = () => setPhase('debug03');

  const [isPhoneOpen, setIsPhoneOpen] = useState(true);
  const [menuScreen, setMenuScreen] = useState('menu');
  const togglePhone = () => setIsPhoneOpen(prev => !prev);

  // Reset phone state when entering new phases
  React.useEffect(() => {
    // Phases where phone should be open and side-by-side
    const splitPhases = ['test02', 'test04', 'test05'];
    if (splitPhases.includes(phase)) {
      setIsPhoneOpen(true);
      setIsPhoneCentered(false); // Default to split view
    }
  }, [phase, setIsPhoneCentered]);

  const isSplit = ['test02', 'test04', 'test05'].includes(phase);
  const gameNoDragPhases = ['mainMenu', 'tutorial', 'mainGame', 'test02', 'test03', 'test04', 'test05'];
  const isGameNoDrag = gameNoDragPhases.includes(phase);

  const handleGameDragStartCapture = (event) => {
    if (!isGameNoDrag) return;

    const target = event.target;
    const isTextInput =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    if (!isTextInput) {
      event.preventDefault();
    }
  };

  React.useEffect(() => {
    if (!isMusicEnabled) {
      stopBgm();
      return;
    }

    if (phase === 'mainMenu' || phase === 'tutorial') {
      playBgm('opening', { loop: true, volume: 0.6, fadeDuration: 600 });
      return;
    }

    const inGamePhases = ['mainGame', 'test02', 'test03', 'test04', 'test05'];
    if (inGamePhases.includes(phase)) {
      const periodOrder = ['morning', 'afternoon', 'evening', 'night'];
      const periodIndex = Math.max(0, periodOrder.indexOf(currentPeriod));
      const bgmName = ((currentDay + periodIndex) % 2 === 0) ? 'overworld01' : 'overworld02';
      playBgm(bgmName, { loop: true, volume: 0.55, fadeDuration: 600 });
      return;
    }

    stopBgm();
  }, [phase, currentDay, currentPeriod, isMusicEnabled, playBgm, stopBgm]);

  return (
    <div
      className={`relative w-full h-screen bg-gray-100 overflow-hidden ${isGameNoDrag ? 'game-no-drag' : ''}`}
      onDragStartCapture={handleGameDragStartCapture}
    >
      <AnimatePresence mode="wait">
        {phase === 'teamLogo' && (
          <TeamLogoScene key="teamLogo" onComplete={toMainMenu} />
        )}

        {phase === 'tutorial' && (
          <TutorialScene key="tutorial" onComplete={toMainGame} />
        )}

        {phase === 'test01' && <Test01Scene key="test01" isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} onBack={toMainMenu} />}
        {phase === 'debug00' && <Debug00Scene key="debug00" onBack={toMainMenu} />}
        {phase === 'debug01' && <Debug01Scene key="debug01" onBack={toMainMenu} />}
        {phase === 'debug02' && <Debug02Scene key="debug02" onBack={toMainMenu} />}
        {phase === 'debug03' && <Debug03Scene key="debug03" onBack={toMainMenu} />}
        {phase === 'mainGame' && <MainGameScene key="mainGame" />}
        {phase === 'test03' && <Test03Scene key="test03" />}

        {/* Unified Split Layout Group */}
        {(phase === 'mainMenu' || isSplit) && (
          <Motion.div
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
                <Motion.div
                  key="mainMenu-bg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 z-0"
                >
                  <img src={MainMenuBg} alt="Main Menu Background" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>

                  {/* Game Title — right side, hidden when phone is on sub-screen */}
                  <AnimatePresence>
                    {menuScreen === 'menu' && (
                      <Motion.div
                        key="game-title"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center pointer-events-none select-none"
                        style={{ left: '420px' }}
                      >
                        <div className="text-center">
                          <p className="text-sm md:text-base font-mono tracking-[0.4em] uppercase text-white/50 mb-2">Project</p>
                          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]" style={{ fontFamily: "'Inter', 'Pretendard', sans-serif" }}>
                            UMI
                          </h1>
                          <div className="flex items-center justify-center gap-3 mt-2">
                            <span className="block w-12 h-px bg-white/30"></span>
                            <p className="text-xs md:text-sm font-mono tracking-[0.3em] uppercase text-white/40">protocol</p>
                            <span className="block w-12 h-px bg-white/30"></span>
                          </div>
                        </div>

                        <p className="mt-6 text-[10px] md:text-xs font-mono tracking-widest text-white/25 uppercase">
                          Solphi Interactive
                        </p>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </Motion.div>
              )}

              {phase === 'test02' && (
                <Motion.div key="test02-bg" className="absolute inset-0 z-0">
                  <Test02Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                </Motion.div>
              )}
              {phase === 'test04' && (
                <Motion.div key="test04-bg" className="absolute inset-0 z-0">
                  <Test04Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                </Motion.div>
              )}

              {phase === 'test05' && (
                <Motion.div key="test05-bg" className="absolute inset-0 z-0">
                  <Test05Scene isPhoneOpen={isPhoneOpen} onTogglePhone={togglePhone} />
                </Motion.div>
              )}
            </AnimatePresence>

            {/* Foreground UI (Split Layout) */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <Motion.div
                layout
                className="flex items-center justify-center overflow-hidden bg-transparent pointer-events-auto"
                initial={{ width: '100%' }}
                animate={{
                  width: (phase === 'mainMenu')
                    ? (menuScreen === 'menu' ? '420px' : '100%')
                    : (isPhoneCentered ? '100%' : (isSplit ? '420px' : '100%')),
                  x: (phase === 'mainMenu')
                    ? 0
                    : (isPhoneCentered ? 0 : (isSplit ? (isPhoneOpen ? 0 : '-100%') : 0)),
                  opacity: (isSplit && !isPhoneOpen && !isPhoneCentered) ? 0 : 1,
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  zIndex: 50
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 28 }}
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
                    onTestStart={toTest01}
                    onTest02Start={toTest02}
                    onTest03Start={toTest03}
                    onTest04Start={toTest04}
                    onTest05Start={toTest05}
                    onStartSequence={toTutorial}
                    onLoadGame={toMainGame}
                    onDebug00Start={toDebug00}
                    onDebug01Start={toDebug01}
                    onDebug02Start={toDebug02}
                    onDebug03Start={toDebug03}
                    onHome={toMainMenu}
                    currentPhase={phase}
                    onMenuScreenChange={setMenuScreen}
                  />
                </div>
              </Motion.div>


            </div>
          </Motion.div>
        )}



      </AnimatePresence>
    </div>
  );
};



import FishLevelWarning from './components/FishLevelWarning';
import { AudioProvider } from './context/AudioContext';

function App() {
  return (
    <AudioProvider>
      <GameProvider>
        <MainLayout />
        <FishLevelWarning />
      </GameProvider>
    </AudioProvider>
  );
}

export default App;
