import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../context/AudioContext';
import { ChevronDown } from 'lucide-react';

/**
 * EndingScene - Complete ending sequence
 * 
 * FLOW:
 * 1. Opening Monologue (narration lines)
 * 2. Reflection Monologue (character reflection)
 * 3. Book Opening (3D book flip with content)
 * 4. Fadeout to Black (transition)
 * 5. Staff Scroll (credits rolling)
 * 6. Thank You Screen (final message)
 * 
 * FEATURES:
 * - Plays 'ending' BGM automatically (from AudioContext)
 * - Fully editable sequences at top of file
 * - Responsive animations with Framer Motion
 * - Auto-advances through each step with escape hatches
 * 
 * USAGE:
 * - From Credits menu (TestED):  Credits > TestED button
 * - Manual trigger:              useGame().isGameOver === true
 * - Direct import:               <EndingScene onComplete={handleNext} />
 * 
 * TIMING & CONTENT EDITS:
 * - Line durations: NarrationOverlay (LINE_DURATION)
 * - Book time: BookOpening (BOOK_DISPLAY_TIME)
 * - Staff speed: StaffScroll (STAFF_ITEM_DURATION)
 * - Thank you: ThankYouScreen (THANK_YOU_DURATION)
 * - Narration content: NARRATION_SEQUENCES (top of file)
 * - Book content: BOOK_CONTENT (top of file)
 * - Staff list: STAFF_CREDITS (top of file)
 * - Messages: THANK_YOU_MESSAGES (top of file)
 */

// ============================================================================
// 📝 EDITABLE CONFIG SECTION
// Edit these arrays and objects to customize the ending
// ============================================================================

const NARRATION_SEQUENCES = [
  {
    id: 'opening_monologue',
    character: '',
    // ⬇️ EDIT: Change lines here for opening monologue
    lines: [
      '5일이 지났다.',
      '이야기를 끝낼 시간이다.',
    ],
  },
  {
    id: 'reflection',
    character: '',
    // ⬇️ EDIT: Change lines here for reflection monologue
    lines: [
      '1.',
      '2.',
    ],
  },
];

const BOOK_CONTENT = {
  title: '원데이 클래스 우미',
  subtitle: 'Drawing One-Day Class Umi',
  // ⬇️ EDIT: Change book placeholders here
  placeholders: [
    '▢ 이야기 진행률: □□□□□ 미완성',
    '▢ 엔딩 분기: 더 많은 이야기를 찾으세요',
    '▢ 숨은 스토리: 준비 중...',
  ],
};

const STAFF_CREDITS = [
  // ⬇️ EDIT: Add/remove team members here
  { role: 'Game Director', name: 'TBD' },
  { role: 'Lead Game Designer', name: 'TBD' },
  { role: 'Programmer', name: 'TBD' },
  { role: 'Artist', name: 'TBD' },
  { role: 'Sound Design', name: 'TBD' },
  { role: 'Narrative Design', name: 'TBD' },
];

const THANK_YOU_MESSAGES = [
  // ⬇️ EDIT: Change thank you messages here
  '게임을 플레이해주셔서 감사합니다.',
  'Thank you for playing.',
];

// ============================================================================
// COMPONENTS
// ============================================================================

const NarrationOverlay = ({ sequence, isActive, onComplete }) => {
  const [lineIndex, setLineIndex] = useState(0);
  const currentLine = sequence?.lines[lineIndex];

  // ⏱️ EDIT: Change timing here
  const LINE_DURATION = 3000; // milliseconds per line
  const SEQUENCE_PAUSE_AFTER = 1000; // pause before moving to next sequence

  useEffect(() => {
    if (!isActive || !sequence) return;

    if (lineIndex >= sequence.lines.length) {
      // All lines done, move to next
      const timer = setTimeout(onComplete, SEQUENCE_PAUSE_AFTER);
      return () => clearTimeout(timer);
    }

    // Each line shows for LINE_DURATION
    const timer = setTimeout(() => {
      setLineIndex(prev => prev + 1);
    }, LINE_DURATION);

    return () => clearTimeout(timer);
  }, [isActive, sequence, lineIndex, onComplete]);

  return (
    <AnimatePresence mode="wait">
      {isActive && currentLine && (
        <Motion.div
          key={`line-${lineIndex}`}
          className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center max-w-2xl px-8">
            <p className="text-lg font-medium text-gray-400 mb-3">{sequence.character}</p>
            <p className="text-2xl md:text-3xl font-light text-white leading-relaxed">
              {currentLine}
            </p>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

const BookOpening = ({ isActive, onComplete }) => {
  // ⏱️ EDIT: Change book display duration
  const BOOK_DISPLAY_TIME = 5000; // milliseconds

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(onComplete, BOOK_DISPLAY_TIME);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <Motion.div
          className="fixed inset-0 flex items-center justify-center z-40 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Motion.div
            className="w-full max-w-4xl h-screen flex"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 1.2 }}
            style={{ perspective: '1200px' }}
          >
            {/* Left Page */}
            <div className="w-1/2 bg-amber-50 p-12 flex flex-col justify-center border-r border-amber-200 overflow-hidden">
              <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <h1 className="text-4xl font-serif font-bold text-amber-900 mb-2">
                  {BOOK_CONTENT.title}
                </h1>
                <p className="text-lg text-amber-700 italic">
                  {BOOK_CONTENT.subtitle}
                </p>
              </Motion.div>
            </div>

            {/* Right Page */}
            <div className="w-1/2 bg-amber-50 p-12 flex flex-col justify-center border-l border-amber-200">
              <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-6"
              >
                {BOOK_CONTENT.placeholders.map((placeholder, idx) => (
                  <div key={idx} className="text-amber-700 font-mono text-sm">
                    {placeholder}
                  </div>
                ))}
              </Motion.div>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

const StaffScroll = ({ isActive, onComplete }) => {
  const [scrollIndex, setScrollIndex] = useState(0);

  // ⏱️ EDIT: Change staff scroll speed
  const STAFF_ITEM_DURATION = 800; // milliseconds per staff member displayed

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setScrollIndex(prev => {
        if (prev >= STAFF_CREDITS.length - 1) {
          onComplete();
          return prev;
        }
        return prev + 1;
      });
    }, STAFF_ITEM_DURATION);

    return () => clearInterval(timer);
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <Motion.div
          className="fixed inset-0 flex flex-col items-center justify-center z-40 bg-gradient-to-b from-black via-black to-gray-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-light text-gray-300 mb-12">Staff</h2>

            <div className="space-y-6 h-40">
              <AnimatePresence mode="wait">
                {STAFF_CREDITS.slice(Math.max(0, scrollIndex - 1), scrollIndex + 2).map((credit, idx) => (
                  <Motion.div
                    key={`${credit.role}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={idx === 1 ? 'text-center' : 'text-center opacity-50'}
                  >
                    <p className="text-sm text-gray-400">{credit.role}</p>
                    <p className="text-xl font-light text-white">{credit.name}</p>
                  </Motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

const ThankYouScreen = ({ isActive, onComplete }) => {
  // ⏱️ EDIT: Change thank you message duration
  const THANK_YOU_DURATION = 6000; // milliseconds

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(onComplete, THANK_YOU_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <Motion.div
          className="fixed inset-0 flex items-center justify-center z-40 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Motion.div
            className="text-center space-y-6 px-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {THANK_YOU_MESSAGES.map((msg, idx) => (
              <Motion.p
                key={idx}
                className="text-2xl md:text-3xl font-light text-gray-300"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.4 }}
              >
                {msg}
              </Motion.p>
            ))}

            <Motion.div
              className="mt-12 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <Motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ChevronDown className="w-6 h-6 text-gray-500" />
              </Motion.div>
            </Motion.div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MAIN SCENE
// ============================================================================

const EndingScene = ({ onComplete }) => {
  // Sequence steps: 
  // 'opening_narration' -> 'reflection' -> 'book' -> 'fadeout' -> 'staff' -> 'thankyou' -> 'done'
  const [step, setStep] = useState('opening_narration');
  const { playEventBgm, isMusicEnabled } = useAudio();

  // Play ending BGM on mount
  useEffect(() => {
    if (isMusicEnabled) {
      playEventBgm('ending', { loop: false, volume: 0.65, fadeDuration: 800 });
    }
  }, [isMusicEnabled, playEventBgm]);

  const handleNarrationComplete = () => {
    setStep('reflection');
  };

  const handleReflectionComplete = () => {
    setStep('book');
  };

  const handleBookComplete = () => {
    setStep('fadeout');
  };

  const handleFadeoutComplete = () => {
    setStep('staff');
  };

  const handleStaffComplete = () => {
    setStep('thankyou');
  };

  const handleThankYouComplete = () => {
    setStep('done');
    if (onComplete) {
      setTimeout(onComplete, 500);
    }
  };

  // Fade out screen
  const isFadingOut = step === 'fadeout';

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      <AnimatePresence mode="wait">
        {/* Background fade during narration and fadeout */}
        <Motion.div
          key="bg"
          className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: isFadingOut ? 0 : 1 }}
          transition={{ duration: isFadingOut ? 2 : 0.3 }}
        />
      </AnimatePresence>

      {/* Narration Sequence 1 */}
      <NarrationOverlay
        sequence={step === 'opening_narration' ? NARRATION_SEQUENCES[0] : null}
        isActive={step === 'opening_narration'}
        onComplete={handleNarrationComplete}
      />

      {/* Narration Sequence 2 */}
      <NarrationOverlay
        sequence={step === 'reflection' ? NARRATION_SEQUENCES[1] : null}
        isActive={step === 'reflection'}
        onComplete={handleReflectionComplete}
      />

      {/* Book Opening */}
      <BookOpening
        isActive={step === 'book'}
        onComplete={handleBookComplete}
      />

      {/* Fadeout to black */}
      <AnimatePresence>
        {isFadingOut && (
          <Motion.div
            className="fixed inset-0 bg-black z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            onAnimationComplete={() => {
              if (step === 'fadeout') {
                handleFadeoutComplete();
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Staff Credits */}
      <StaffScroll
        isActive={step === 'staff'}
        onComplete={handleStaffComplete}
      />

      {/* Thank You */}
      <ThankYouScreen
        isActive={step === 'thankyou'}
        onComplete={handleThankYouComplete}
      />
    </div>
  );
};

export default EndingScene;

