import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Howl, Howler } from 'howler';

// BGM 파일 임포트
import choirBgm from '../assets/bgm/choir.mp3';
import endingBgm from '../assets/bgm/ending.mp3';
import openingBgm from '../assets/bgm/opening.mp3';
import overworld01Bgm from '../assets/bgm/overworld01.mp3';
import overworld02Bgm from '../assets/bgm/overworld02.mp3';

const AudioContext = createContext(null);
const AUDIO_SETTINGS_STORAGE_KEY = 'solphi.audio.settings.v1';

const clampVolume = (value) => {
    if (Number.isNaN(value)) return 0.5;
    return Math.min(1, Math.max(0, value));
};

const readStoredAudioSettings = () => {
    if (typeof window === 'undefined') {
        return { isMusicEnabled: true, bgmVolume: 0.5 };
    }

    try {
        const raw = window.localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
        if (!raw) return { isMusicEnabled: true, bgmVolume: 0.5 };

        const parsed = JSON.parse(raw);
        return {
            isMusicEnabled: parsed?.isMusicEnabled ?? true,
            bgmVolume: clampVolume(parsed?.bgmVolume ?? 0.5),
        };
    } catch (error) {
        console.warn('오디오 설정을 불러오지 못했습니다.', error);
        return { isMusicEnabled: true, bgmVolume: 0.5 };
    }
};

export const AudioProvider = ({ children }) => {
    const initialSettings = readStoredAudioSettings();
    const [currentBgm, setCurrentBgm] = useState(null);
    const [isMusicEnabled, setIsMusicEnabled] = useState(initialSettings.isMusicEnabled);
    const [bgmVolume, setBgmVolume] = useState(initialSettings.bgmVolume);
    const bgmHowlRef = useRef(null);
    const baseTrackVolumeRef = useRef(0.5);

    const bgmMap = {
        choir: choirBgm,
        ending: endingBgm,
        opening: openingBgm,
        overworld01: overworld01Bgm,
        overworld02: overworld02Bgm,
    };

    const getEffectiveVolume = (trackVolume = 0.5) => clampVolume(trackVolume) * clampVolume(bgmVolume);

    const playBgm = (bgmName, { loop = true, volume = 0.5, fadeDuration = 0 } = {}) => {
        if (!bgmMap[bgmName]) {
            console.warn(`BGM '${bgmName}' 을 찾을 수 없습니다.`);
            return;
        }

        if (!isMusicEnabled) {
            return;
        }

        // 이미 같은 BGM이 재생 중이면 무시
        if (currentBgm === bgmName && bgmHowlRef.current && bgmHowlRef.current.playing()) {
            return;
        }

        // 기존 BGM 정지 (페이드 아웃 설정 가능)
        if (bgmHowlRef.current) {
            if (fadeDuration > 0) {
                bgmHowlRef.current.fade(bgmHowlRef.current.volume(), 0, fadeDuration);
                setTimeout(() => {
                    stopBgm();
                    startNewBgm(bgmName, loop, volume, fadeDuration);
                }, fadeDuration);
                return;
            } else {
                stopBgm();
            }
        }

        startNewBgm(bgmName, loop, volume, fadeDuration);
    };

    const startNewBgm = (bgmName, loop, volume, fadeDuration) => {
        const normalizedTrackVolume = clampVolume(volume);
        const targetVolume = getEffectiveVolume(normalizedTrackVolume);

        const sound = new Howl({
            src: [bgmMap[bgmName]],
            loop: loop,
            volume: fadeDuration > 0 ? 0 : targetVolume,
            mute: !isMusicEnabled,
            html5: true, // 대용량 오디오(BGM)용 권장 설정
        });

        if (fadeDuration > 0) {
            sound.play();
            sound.fade(0, targetVolume, fadeDuration);
        } else {
            sound.play();
        }

        baseTrackVolumeRef.current = normalizedTrackVolume;
        bgmHowlRef.current = sound;
        setCurrentBgm(bgmName);
    };

    const stopBgm = () => {
        if (bgmHowlRef.current) {
            bgmHowlRef.current.stop();
            bgmHowlRef.current.unload(); // 메모리 해제
            bgmHowlRef.current = null;
        }
        setCurrentBgm(null);
    };

    const setMusicEnabled = (enabled) => {
        const nextEnabled = !!enabled;
        setIsMusicEnabled(nextEnabled);

        if (!nextEnabled) {
            stopBgm();
        }
    };

    const toggleMute = () => {
        setMusicEnabled(!isMusicEnabled);
    };

    const setMasterBgmVolume = (nextVolume) => {
        setBgmVolume(clampVolume(Number(nextVolume)));
    };

    const playEventBgm = (eventName, options = {}) => {
        if (eventName === 'choir' || eventName === 'ending') {
            playBgm(eventName, options);
            return;
        }

        console.warn(`이벤트 BGM '${eventName}' 은(는) 정의되어 있지 않습니다.`);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const payload = JSON.stringify({
            isMusicEnabled,
            bgmVolume,
        });

        window.localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, payload);
    }, [isMusicEnabled, bgmVolume]);

    useEffect(() => {
        Howler.mute(!isMusicEnabled);

        if (bgmHowlRef.current && isMusicEnabled) {
            bgmHowlRef.current.volume(getEffectiveVolume(baseTrackVolumeRef.current));
        }
    }, [isMusicEnabled, bgmVolume]);

    useEffect(() => {
        return () => {
            if (bgmHowlRef.current) {
                bgmHowlRef.current.unload();
            }
        };
    }, []);

    return (
        <AudioContext.Provider
            value={{
                playBgm,
                playEventBgm,
                stopBgm,
                toggleMute,
                isMuted: !isMusicEnabled,
                isMusicEnabled,
                setMusicEnabled,
                bgmVolume,
                setBgmVolume: setMasterBgmVolume,
                currentBgm,
            }}
        >
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio hook은 AudioProvider 내에서만 사용할 수 있습니다.');
    }
    return context;
};
