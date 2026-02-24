import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
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
    const fadeoutTimeoutRef = useRef(null);
    const baseTrackVolumeRef = useRef(0.5);
    const currentBgmRef = useRef(null);
    const isMusicEnabledRef = useRef(initialSettings.isMusicEnabled);
    const bgmVolumeRef = useRef(initialSettings.bgmVolume);

    // Sync refs with state
    useEffect(() => { isMusicEnabledRef.current = isMusicEnabled; }, [isMusicEnabled]);
    useEffect(() => { bgmVolumeRef.current = bgmVolume; }, [bgmVolume]);
    useEffect(() => { currentBgmRef.current = currentBgm; }, [currentBgm]);

    const bgmMapRef = useRef({
        choir: choirBgm,
        ending: endingBgm,
        opening: openingBgm,
        overworld01: overworld01Bgm,
        overworld02: overworld02Bgm,
    });

    const getEffectiveVolume = useCallback((trackVolume = 0.5) => {
        return clampVolume(trackVolume) * clampVolume(bgmVolumeRef.current);
    }, []);

    const stopBgmInternal = useCallback(() => {
        if (fadeoutTimeoutRef.current) {
            clearTimeout(fadeoutTimeoutRef.current);
            fadeoutTimeoutRef.current = null;
        }
        if (bgmHowlRef.current) {
            bgmHowlRef.current.stop();
            bgmHowlRef.current.unload();
            bgmHowlRef.current = null;
        }
        setCurrentBgm(null);
        currentBgmRef.current = null;
    }, []);

    const startNewBgm = useCallback((bgmName, loop, volume, fadeDuration) => {
        const normalizedTrackVolume = clampVolume(volume);
        const targetVolume = getEffectiveVolume(normalizedTrackVolume);

        // 모든 Howl 인스턴스를 완전히 정리 (HTML5 Audio 풀 포함)
        Howler.unload();
        bgmHowlRef.current = null;

        const sound = new Howl({
            src: [bgmMapRef.current[bgmName]],
            loop: loop,
            volume: fadeDuration > 0 ? 0 : targetVolume,
            mute: !isMusicEnabledRef.current,
            html5: true,
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
        currentBgmRef.current = bgmName;
    }, [getEffectiveVolume]);

    const playBgm = useCallback((bgmName, { loop = true, volume = 0.5, fadeDuration = 0 } = {}) => {
        if (!bgmMapRef.current[bgmName]) {
            console.warn(`BGM '${bgmName}' 을 찾을 수 없습니다.`);
            return;
        }

        if (!isMusicEnabledRef.current) {
            return;
        }

        // 이미 같은 BGM이 재생 중이면 무시
        if (currentBgmRef.current === bgmName && bgmHowlRef.current && bgmHowlRef.current.playing()) {
            return;
        }

        if (fadeoutTimeoutRef.current) {
            clearTimeout(fadeoutTimeoutRef.current);
            fadeoutTimeoutRef.current = null;
        }

        // 기존 BGM 정지
        if (bgmHowlRef.current) {
            if (fadeDuration > 0) {
                bgmHowlRef.current.fade(bgmHowlRef.current.volume(), 0, fadeDuration);
                fadeoutTimeoutRef.current = setTimeout(() => {
                    stopBgmInternal();
                    startNewBgm(bgmName, loop, volume, fadeDuration);
                    fadeoutTimeoutRef.current = null;
                }, fadeDuration);
                return;
            } else {
                stopBgmInternal();
            }
        }

        startNewBgm(bgmName, loop, volume, fadeDuration);
    }, [stopBgmInternal, startNewBgm]);

    const stopBgm = useCallback(() => {
        stopBgmInternal();
    }, [stopBgmInternal]);

    // stopBgm is now defined above via useCallback

    const setMusicEnabled = useCallback((enabled) => {
        const nextEnabled = !!enabled;
        setIsMusicEnabled(nextEnabled);
        isMusicEnabledRef.current = nextEnabled;

        if (!nextEnabled) {
            stopBgmInternal();
        }
    }, [stopBgmInternal]);

    const toggleMute = useCallback(() => {
        setMusicEnabled(!isMusicEnabledRef.current);
    }, [setMusicEnabled]);

    const setMasterBgmVolume = useCallback((nextVolume) => {
        const v = clampVolume(Number(nextVolume));
        setBgmVolume(v);
        bgmVolumeRef.current = v;
    }, []);

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

    // 초기 마운트 시 잔여 오디오 정리 + 언마운트 시 정리
    useEffect(() => {
        Howler.unload();
        return () => {
            if (fadeoutTimeoutRef.current) {
                clearTimeout(fadeoutTimeoutRef.current);
            }
            Howler.unload();
            bgmHowlRef.current = null;
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
